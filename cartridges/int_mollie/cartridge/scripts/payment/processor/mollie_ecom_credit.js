'use strict';

var PaymentMgr = require('dw/order/PaymentMgr');
var OrderMgr = require('dw/order/OrderMgr');
var Transaction = require('dw/system/Transaction');
var PaymentProviderException = require('*/cartridge/scripts/exceptions/PaymentProviderException');
var MollieServiceException = require('*/cartridge/scripts/exceptions/MollieServiceException');
var paymentService = require('*/cartridge/scripts/payment/paymentService');
var config = require('*/cartridge/scripts/mollieConfig');
var Logger = require('*/cartridge/scripts/utils/logger');
var orderHelper = require('*/cartridge/scripts/order/orderHelper');
var collections = require('*/cartridge/scripts/util/collections');

/**
 * Creates a token. This should be replaced by utilizing a tokenization provider
 * @returns {string} a token
 */
function createToken() {
    return Math.random().toString(36).substr(2);
}

/**
 * Verifies that entered credit card information is a valid card. If the information is valid a
 * credit card payment instrument is created
 * @param {dw.order.Basket} basket Current users's basket
 * @param {Object} paymentInformation - the payment information
 * @return {Object} returns an error object
 */
function Handle(basket, paymentInformation) {
    var currentBasket = basket;
    var cardErrors = {};
    var serverErrors = [];
    var cardType = paymentInformation.cardType.value;
    var pm = paymentInformation.paymentMethod;

    Transaction.wrap(function () {
        var paymentInstruments = currentBasket.getPaymentInstruments();

        collections.forEach(paymentInstruments, function (item) {
            var paymentMethod = PaymentMgr.getPaymentMethod(item.getPaymentMethod());
            if (paymentMethod && paymentMethod.getPaymentProcessor().getID().indexOf('MOLLIE') >= 0) {
                currentBasket.removePaymentInstrument(item);
            }
        });

        var paymentInstrument = currentBasket.createPaymentInstrument(pm, currentBasket.totalGrossPrice);

        paymentInstrument.setCreditCardType(cardType);
        paymentInstrument.setCreditCardHolder(currentBasket.billingAddress.fullName);
    });

    return {
        fieldErrors: [cardErrors],
        serverErrors: serverErrors,
        error: false
    };
}

/**
 * Authorizes a payment using a credit card. Customizations may use other processors and custom
 *      logic to authorize credit card payment.
 * @param {number} orderNumber - The current order's number
 * @param {dw.order.PaymentInstrument} paymentInstrument -  The payment instrument to authorize
 * @param {dw.order.PaymentProcessor} paymentProcessor -  The payment processor of the current
 *      payment method
 * @return {Object} returns an error object
 */
function Authorize(orderNumber, paymentInstrument, paymentProcessor) {
    var serverErrors = [];
    var fieldErrors = {};
    var error = false;
    var redirectUrl;

    var order = OrderMgr.getOrder(orderNumber);

    try {
        var paymentMethod = PaymentMgr.getPaymentMethod(paymentInstrument.getPaymentMethod());

        var billingForm = session.forms.billing;
        var creditCardFields = billingForm.creditCardFields;
        var isReturningCustomer = billingForm.isReturningCustomer.checked;
        var paymentInfo = {};

        if (creditCardFields.cardToken.value && !isReturningCustomer && config.getComponentsEnabled()) {
            paymentInfo.cardToken = creditCardFields.cardToken.value;
        }

        if ((creditCardFields.saveCard.checked || isReturningCustomer) && config.getEnableSingleClickPayments()) {
            var profile = order.customer.profile;
            var mollieCustomerId = profile.custom.mollieCustomerId;
            if (!mollieCustomerId) {
                var createCustomerResult = paymentService.createCustomer(profile);
                Transaction.wrap(function () {
                    profile.custom.mollieCustomerId = createCustomerResult.customer.id;
                });
            }
            paymentInfo.customerId = profile.custom.mollieCustomerId;
        }

        var createResult;
        var paymentMethodEnabledTransactionAPI = paymentMethod.custom.mollieEnabledTransactionAPI.value;
        var enabledTransactionAPI = paymentMethodEnabledTransactionAPI === config.getDefaultAttributeValue() ? config.getDefaultEnabledTransactionAPI().value : paymentMethodEnabledTransactionAPI;
        if (enabledTransactionAPI === config.getTransactionAPI().PAYMENT) {
            createResult = paymentService.createPayment(order, paymentMethod, paymentInfo);
            redirectUrl = createResult.payment.links.checkout.href;
        } else {
            createResult = paymentService.createOrder(order, paymentMethod, paymentInfo);
            redirectUrl = createResult.order.links.checkout.href;
        }

        // Mollie Components handle non-3DS cards
        if (!redirectUrl) {
            if (enabledTransactionAPI === config.getTransactionAPI().PAYMENT) {
                redirectUrl = createResult.payment.redirectUrl;
            } else {
                redirectUrl = createResult.order.redirectUrl;
            }
        }

        Transaction.wrap(function () {
            paymentInstrument.getPaymentTransaction().setTransactionID(orderNumber);
            paymentInstrument.getPaymentTransaction().setPaymentProcessor(paymentProcessor);
            orderHelper.setRefundStatus(order, config.getRefundStatus().NOTREFUNDED);
            orderHelper.setPaymentLink(order, null, redirectUrl);
        });
    } catch (e) {
        var exception = e;
        if (exception instanceof PaymentProviderException) {
            var Resource = require('dw/web/Resource');

            error = true;
            var mollieError = exception.errorDetail;
            serverErrors.push(
                exception.isCardAuthError
                    ? mollieError.extra.failureMessage
                    : Resource.msg('error.technical', 'checkout', null)
            );

            Transaction.wrap(function () {
                OrderMgr.failOrder(order, true);
                orderHelper.addItemToOrderHistory(order, exception.message + ' :: ' + JSON.stringify(exception.errorDetail), true);
                if (!exception.isCardAuthError) {
                    Logger.error(exception.message + ' :: ' + exception.errorDetail);
                }
            });
        } else {
            throw MollieServiceException.from(e);
        }
    }

    return {
        error: error,
        redirectUrl: redirectUrl,
        fieldErrors: fieldErrors,
        serverErrors: serverErrors
    };
}

exports.Handle = Handle;
exports.Authorize = Authorize;
exports.createToken = createToken;
