'use strict';

var MollieServiceException = require('*/cartridge/scripts/exceptions/MollieServiceException');

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

exports.sendPaymentLink = sendPaymentLink;
