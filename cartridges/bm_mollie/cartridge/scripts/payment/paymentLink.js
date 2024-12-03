'use strict';

var MollieServiceException = require('*/cartridge/scripts/exceptions/MollieServiceException');
var paymentService = require('*/cartridge/scripts/payment/paymentService');

/**
 * Send payment link mail
 * @param {dw.order.Order} order - Order object
 * @param {string} email - the customer email
 * @param {string} paymentLink - generated payment link
 */
function sendPaymentLink(order, email, paymentLink) { // eslint-disable-line no-unused-vars
    // Implement custom email logic
    throw new MollieServiceException('sendPaymentLink not yet implemented');
}

/**
 * Get payment link from Mollie
 * @param {dw.order.Order} order - order
 * @param {dw.order.PaymentMethod} paymentMethod - paymentMethod
 * @param {Object} paymentData - paymentData
 */
function getPaymentLink(order, paymentMethod, paymentData) {
    return paymentService.createPaymentLink(order, paymentMethod, paymentData);
}

exports.sendPaymentLink = sendPaymentLink;
exports.getPaymentLink = getPaymentLink;