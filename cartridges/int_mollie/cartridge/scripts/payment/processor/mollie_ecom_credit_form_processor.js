'use strict';
var Resource = require('dw/web/Resource');
var PaymentMgr = require('dw/order/PaymentMgr');
var config = require('*/cartridge/scripts/mollieConfig');

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

    if (config.getComponentsEnabled() && !paymentForm.creditCardFields.cardToken.value && !paymentForm.isReturningCustomer.checked) {
        return {
            fieldErrors: [],
            serverErrors: [Resource.msg('error.invalid.card', 'mollie', null)],
            error: true
        };
    }

    viewData.paymentMethod = {
        value: paymentForm.paymentMethod.value,
        htmlName: paymentForm.paymentMethod.htmlName
    };

    viewData.paymentInformation = {
        paymentMethod: viewData.paymentMethod.value,
        cardType: {
            value: cardType.getName(),
            htmlName: paymentForm.creditCardFields.cardType.htmlName
        },
        cardToken: {
            value: paymentForm.creditCardFields.cardToken.value,
            htmlName: paymentForm.creditCardFields.cardToken.htmlName
        }
    };

    viewData.saveCard = paymentForm.creditCardFields.saveCard.checked;

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
