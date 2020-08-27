'use strict';

var collections = require('*/cartridge/scripts/util/collections');

var PaymentInstrument = require('dw/order/PaymentInstrument');
var PaymentMgr = require('dw/order/PaymentMgr');
var OrderMgr = require('dw/order/OrderMgr');
var Resource = require('dw/web/Resource');
var Transaction = require('dw/system/Transaction');
var paymentService = require('*/cartridge/scripts/payment/paymentService');
var Logger = require('*/cartridge/scripts/utils/logger');
var config = require('*/cartridge/scripts/mollieConfig');

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


    Transaction.wrap(function () {
        var paymentInstruments = currentBasket.getPaymentInstruments();

        collections.forEach(paymentInstruments, function (item) {
            currentBasket.removePaymentInstrument(item);
        });

        var paymentInstrument = currentBasket.createPaymentInstrument(
            PaymentInstrument.METHOD_CREDIT_CARD, currentBasket.totalGrossPrice
        );

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
    try {
        Transaction.wrap(function () {
            paymentInstrument.getPaymentTransaction().setTransactionID(orderNumber);
            paymentInstrument.getPaymentTransaction().setPaymentProcessor(paymentProcessor);
        });

        var order = OrderMgr.getOrder(orderNumber);
        var paymentMethod = PaymentMgr.getPaymentMethod(paymentInstrument.getPaymentMethod());
        var cardToken = session.forms.billing.creditCardFields.cardToken.value;

        if (config.getEnabledTransactionAPI() === config.getTransactionAPI().PAYMENT) {
            var result = paymentService.createPayment(order, paymentMethod, { cardToken: cardToken });
            redirectUrl = result.payment.links.checkout.href;
        } else {
            var result = paymentService.createOrder(order, paymentMethod, { cardToken: cardToken });
            redirectUrl = result.order.links.checkout.href;
        }
    } catch (e) {
        Logger.error(e.javaMessage + '\n\r' + e.stack);

        error = true;
        serverErrors.push(
            Resource.msg('error.technical', 'checkout', null)
        );
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
exports.createToken = createToken;
