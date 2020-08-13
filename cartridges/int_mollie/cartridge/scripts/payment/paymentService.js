var MollieService = require('*/cartridge/scripts/services/worldlineService');
var orderHelper = require('*/cartridge/scripts/order/orderHelper');
var config = require('*/cartridge/scripts/config');
var sfccEntities = require('*/cartridge/scripts/services/mollie/sfccEntities');

/**
 *
 * @param {dw.order.Order} order - Order object
 * @param {string} paymentMethod - Order PaymentMethodId
 * @returns {Object} - Redirect object
 * @throws {ServiceException}
 */
function createPayment(order, paymentMethod) {
    const API = config.getTransactionAPI(); // ORDER / PAYMENT
    try {
        const paymentResult = MollieService.createPayment({
            orderId: order.orderNo,
            amount: new sfccEntities.Currency(order.getTotalGrossPrice()),
            description: 'description order', //TODO
            method: paymentMethod,
        });

        Transaction.wrap(function () {
            var historyItem = 'MOLLIE :: CREATE PAYMENT' + paymentResult.raw;
            orderHelper.addItemToOrderHistory(order, historyItem, true);
            orderHelper.setTransactionAPI(order, null, API.PAYMENT);
        });

        return paymentResult.links.checkout.link.href;
    } catch (e) {
        if (e.name === 'PaymentProviderException') throw e;
        throw ServiceException.from(e);
    }
}

/**
 *
 * @param {string} paymentId - paymentId
 * @returns {Object} - Redirect object
 * @throws {ServiceException}
 */
function handlePaymentUpdate(paymentId) {
    try {
        const paymentResult = MollieService.getPayment({
            paymentId: paymentId,
        });

        Transaction.wrap(function () {
            var historyItem = 'MOLLIE :: HANDLING PAYMENT UPDATE' + paymentResult.raw;
            orderHelper.addItemToOrderHistory(order, historyItem, true);
        });

        return paymentHelper.processOrderResult(order, paymentResult);
    } catch (e) {
        if (e.name === 'PaymentProviderException') throw e;
        throw ServiceException.from(e);
    }
}

/**
 *
 * @param {string} paymentId - paymentId
 * @returns {Object} - Redirect object
 * @throws {ServiceException}
 */
function cancelPayment(paymentId) {
    try {
        const paymentResult = MollieService.cancelPayment({
            paymentId: paymentId,
        });

        Transaction.wrap(function () {
            var historyItem = 'MOLLIE :: CANCEL PAYMENT' + paymentResult.raw;
            orderHelper.addItemToOrderHistory(order, historyItem, true);
        });

        return paymentHelper.processOrderResult(order, paymentResult);
    } catch (e) {
        if (e.name === 'PaymentProviderException') throw e;
        throw ServiceException.from(e);
    }
}

module.exports.createPayment = createPayment;
module.exports.handlePaymentUpdate = handlePaymentUpdate;
module.exports.cancelPayment = cancelPayment;