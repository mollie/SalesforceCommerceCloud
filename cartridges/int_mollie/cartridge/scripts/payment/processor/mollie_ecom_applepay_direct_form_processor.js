'use strict';

var PaymentMgr = require('dw/order/PaymentMgr');

/**
 * Verifies the required information for billing form is provided.
 * @param {Object} req - The request object
 * @param {Object} paymentForm - the payment form
 * @param {Object} viewFormData - object contains billing form data
 * @returns {Object} an object that has error information or payment information
 */
function processForm(req, paymentForm, viewFormData) {
    var viewData = viewFormData;
    var cardType = PaymentMgr.getPaymentMethod(paymentForm.paymentMethod.value);

    viewData.paymentMethod = {
        value: paymentForm.paymentMethod.value,
        htmlName: paymentForm.paymentMethod.htmlName
    };

    viewData.paymentInformation = {
        paymentMethod: viewData.paymentMethod.value,
        cardType: {
            value: cardType.getName()
        }
    };

    return {
        error: false,
        viewData: viewData
    };
}

/**
 * Save the credit card information to login account if save card option is selected
 * @param {Object} req - The request object
 * @param {dw.order.Basket} basket - The current basket
 * @param {Object} billingData - payment information
 */
function savePaymentInformation(req, basket, billingData) { } // eslint-disable-line no-unused-vars

exports.processForm = processForm;
exports.savePaymentInformation = savePaymentInformation;
