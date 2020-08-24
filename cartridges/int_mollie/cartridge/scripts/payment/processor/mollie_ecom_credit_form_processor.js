'use strict';

/**
 * Verifies the required information for billing form is provided.
 * @param {Object} req - The request object
 * @param {Object} paymentForm - the payment form
 * @param {Object} viewFormData - object contains billing form data
 * @returns {Object} an object that has error information or payment information
 */
function processForm(req, paymentForm, viewFormData) {
    const viewData = viewFormData;
    const PaymentMgr = require('dw/order/PaymentMgr');
    const cardType = PaymentMgr.getPaymentMethod(paymentForm.paymentMethod.value);

    viewData.paymentMethod = {
        value: paymentForm.paymentMethod.value,
        htmlName: paymentForm.paymentMethod.value
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
function savePaymentInformation(req, basket, billingData) { }

exports.processForm = processForm;
exports.savePaymentInformation = savePaymentInformation;
