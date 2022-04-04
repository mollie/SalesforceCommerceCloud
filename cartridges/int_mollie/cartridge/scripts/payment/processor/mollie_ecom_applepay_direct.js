'use strict';

var Resource = require('dw/web/Resource');
var Transaction = require('dw/system/Transaction');
var OrderMgr = require('dw/order/OrderMgr');
var PaymentMgr = require('dw/order/PaymentMgr');
var PaymentProviderException = require('*/cartridge/scripts/exceptions/PaymentProviderException');
var MollieServiceException = require('*/cartridge/scripts/exceptions/MollieServiceException');
var Logger = require('*/cartridge/scripts/utils/logger');
var paymentService = require('*/cartridge/scripts/payment/paymentService');
var collections = require('*/cartridge/scripts/util/collections');
var config = require('*/cartridge/scripts/mollieConfig');
var orderHelper = require('*/cartridge/scripts/order/orderHelper');

/**
 * Creates the payment instrument based on the given information.
 *
 * @param {dw.order.Order} order - The basket
 * @param {Object} event - The payment form
 * @return {Object} returns an error object
 */
function Handle(order, event) {
    var cardErrors = {};
    var serverErrors = [];

    var mollieApplePayMethodID = config.getApplePayDirectPaymentMethodId();
    Transaction.wrap(function () {
        var paymentInstruments = order.getPaymentInstruments();
        collections.forEach(paymentInstruments, (function (item) {
            if (item.getPaymentMethod() === 'DW_APPLE_PAY') {
                order.removePaymentInstrument(item);
            } else {
                var paymentMethod = PaymentMgr.getPaymentMethod(item.getPaymentMethod());
                var paymentMethodProcessorID = paymentMethod.getPaymentProcessor().getID();
                if (paymentMethod && (paymentMethodProcessorID.indexOf('MOLLIE') >= 0)) {
                    order.removePaymentInstrument(item);
                }
            }
        }));
        order.createPaymentInstrument(mollieApplePayMethodID, order.totalGrossPrice);
    });

    var applePayPaymentToken = event.payment && event.payment.token;
    Transaction.wrap(function () {
        if (applePayPaymentToken) {
            orderHelper.setPaymentDetails(order, mollieApplePayMethodID, applePayPaymentToken);
        }
    });


    // Payment forms are managed by Mollie, so field and server errors are irrelevant her.
    return { fieldErrors: [cardErrors], serverErrors: serverErrors, error: false };
}

/**
 * Authorizes a payment using an e-commerce redirect.
 *
 * @param {dw.order.Order} order - The current order
 * @param {dw.order.OrderPaymentInstrument} paymentInstrument -  The payment instrument to authorize
 * @param {dw.order.PaymentProcessor} paymentProcessor
 *  -  The payment processor of the current payment method
 * @return {Object} returns an error object
 */
function Authorize(order, paymentInstrument, paymentProcessor) {
    var serverErrors = [];
    var fieldErrors = {};
    var error = false;
    var redirectUrl;

    try {
        var paymentMethod = PaymentMgr.getPaymentMethod(paymentInstrument.getPaymentMethod());
        var applePayPaymentToken = orderHelper.getPaymentDetails(order, paymentMethod.getID());

        var paymentMethodEnabledTransactionAPI = paymentMethod.custom.mollieEnabledTransactionAPI.value;
        var enabledTransactionAPI = paymentMethodEnabledTransactionAPI === config.getDefaultAttributeValue() ? config.getDefaultEnabledTransactionAPI().value : paymentMethodEnabledTransactionAPI;
        if (enabledTransactionAPI === config.getTransactionAPI().PAYMENT) {
            var createPaymentResult = paymentService.createPayment(order, paymentMethod, { applePayPaymentToken: applePayPaymentToken });
            redirectUrl = createPaymentResult.payment.links.checkout.href;
        } else {
            var createOrderResult = paymentService.createOrder(order, paymentMethod, { applePayPaymentToken: applePayPaymentToken });
            redirectUrl = createOrderResult.order.links.checkout.href;
        }

        Transaction.wrap(function () {
            session.privacy.applePayPaymentToken = null;
            paymentInstrument.getPaymentTransaction().setTransactionID(order.getOrderNo());
            paymentInstrument.getPaymentTransaction().setPaymentProcessor(paymentProcessor);
            orderHelper.setRefundStatus(order, config.getRefundStatus().NOTREFUNDED);
            orderHelper.setPaymentLink(order, paymentMethod.getID(), redirectUrl);
        });
    } catch (e) {
        var exception = e;
        if (exception instanceof PaymentProviderException) {
            error = true;
            serverErrors.push(Resource.msg('error.technical', 'checkout', null));
            Transaction.wrap(function () {
                OrderMgr.failOrder(order, true);
                orderHelper.addItemToOrderHistory(order, exception.message + ' :: ' + JSON.stringify(exception.errorDetail), true);
                Logger.error(exception.message + ' :: ' + exception.errorDetail);
            });
        } else {
            throw MollieServiceException.from(e);
        }
    }

    return {
        redirectUrl: redirectUrl,
        fieldErrors: fieldErrors,
        serverErrors: serverErrors,
        error: error
    };
}

exports.Handle = Handle;
exports.Authorize = Authorize;
