'use strict';

var base = require('*/cartridge/scripts/utils/superModule')(module);

var PaymentMgr = require('dw/order/PaymentMgr');
var URLUtils = require('dw/web/URLUtils');
var paymentService = require('*/cartridge/scripts/payment/paymentService');
var collections = require('*/cartridge/scripts/util/collections');

/**
 * Creates an array of objects containing selected payment information
 * @param {dw.util.ArrayList<dw.order.PaymentInstrument>} selectedPaymentInstruments - ArrayList
 *      of payment instruments that the user is using to pay for the current basket
 * @returns {Array} Array of objects that contain information about the selected payment instruments
 */
function getSelectedPaymentInstruments(selectedPaymentInstruments) {
    return collections.map(selectedPaymentInstruments, function (paymentInstrument) {
        var paymentMethod = PaymentMgr.getPaymentMethod(paymentInstrument.paymentMethod);
        var issuerData = paymentInstrument.getPaymentTransaction().custom.mollieIssuerData;
        issuerData = issuerData && JSON.parse(issuerData);

        var results = {
            paymentMethodId: paymentMethod.getID(),
            paymentMethod: paymentMethod.getName(),
            amount: paymentInstrument.paymentTransaction.amount.value,
            issuer: issuerData && issuerData.name
        };

        return results;
    });
}

/**
 * Creates an array of objects containing applicable payment methods
 * @param {dw.util.ArrayList<dw.order.dw.order.PaymentMethod>} paymentMethods - An ArrayList of
 *      applicable payment methods that the user could use for the current basket.
 * @param {dw.order.Basket} currentBasket - the target Basket object
 * @param {string} countryCode - the associated Site countryCode
 * @returns {Array} of object that contain information about the applicable payment methods for the
 *      current cart
 */
function applicablePaymentMethods(paymentMethods, currentBasket, countryCode) {
    var getMethodResponse = paymentService.getMethods(currentBasket, countryCode);
    var mollieMethods = {};
    getMethodResponse.methods.forEach(function (mollieMethod) {
        mollieMethods[mollieMethod.id] = mollieMethod;
    });

    var methods = [];
    paymentMethods.toArray().forEach(function (method) {
        var mollieMethodId = method.custom.molliePaymentMethodId;
        var mollieMethod = mollieMethods[mollieMethodId];
        if (mollieMethod || !mollieMethodId) {
            methods.push({
                ID: method.ID,
                name: method.name,
                image: method.image ? method.image.URL.toString() :
                    mollieMethod && mollieMethod.imageURL,
                issuers: mollieMethod && mollieMethod.issuers
            });
        }
    });

    return methods;
}

/**
 * Payment class that represents payment information for the current basket
 * @param {dw.order.Basket} currentBasket - the target Basket object
 * @param {dw.customer.Customer} currentCustomer - the associated Customer object
 * @param {string} countryCode - the associated Site countryCode
 * @constructor
 */
function Payment(currentBasket, currentCustomer, countryCode) {
    base.call(this, currentBasket, currentCustomer, countryCode);

    var paymentAmount = currentBasket.totalGrossPrice;
    var paymentMethods = PaymentMgr.getApplicablePaymentMethods(
        currentCustomer,
        countryCode,
        paymentAmount.value
    );

    var paymentInstruments = currentBasket.paymentInstruments;

    // TODO: Should compare currentBasket and currentCustomer and countryCode to see
    //     if we need them or not
    this.applicablePaymentMethods =
        paymentMethods ? applicablePaymentMethods(paymentMethods, currentBasket, countryCode) : null;

    this.selectedPaymentInstruments = paymentInstruments ?
        getSelectedPaymentInstruments(paymentInstruments) : null;
}

module.exports = Payment;
