var MollieService = require('*/cartridge/scripts/services/mollieService');
var orderHelper = require('*/cartridge/scripts/order/orderHelper');
var config = require('*/cartridge/scripts/config');

/**
 *
 * @param {dw.order.Order} order - Order object
 * @param {string} paymentMethod - Order PaymentMethodId
 * @returns {Object} - Redirect object
 * @throws {ServiceException}
 */
function createOrder(order, paymentMethod) {
    const API = config.getTransactionAPI(); // ORDER / PAYMENT
    try {
        const orderResult = MollieService.createPayment({
            orderId: order.orderNo,
            amount: order.getTotalGrossPrice(),
            productLineItems: order.getProductLineItems(),
            billingAddress: order.getBillingAddress(),
            method: paymentMethod,
        });

        Transaction.wrap(function () {
            var historyItem = 'PAYMENT :: Create order payment: ' + orderResult.raw;
            orderHelper.addItemToOrderHistory(order, historyItem, true);
            orderHelper.setTransactionAPI(order, null, API.ORDER);
        });

        return orderResult.order.links.checkout.link.href;
    } catch (e) {
        if (e.name === 'PaymentProviderException') throw e;
        throw ServiceException.from(e);
    }
}


/**
 *
 * @param {string} orderId - orderId
 * @returns {Object} - Redirect object
 * @throws {ServiceException}
 */
function cancelOrder(orderId) {
    try {
        const orderResult = MollieService.cancelOrder({
            orderId: orderId,
        });

        Transaction.wrap(function () {
            var historyItem = 'PAYMENT :: Canceling order payment: ' + orderResult.raw;
            orderHelper.addItemToOrderHistory(order, historyItem, true);
        });

        return paymentHelper.processOrderResult(order, orderResult.order);
    } catch (e) {
        if (e.name === 'PaymentProviderException') throw e;
        throw ServiceException.from(e);
    }
}

module.exports = {
    createOrder: createOrder,
    cancelOrder: cancelOrder
}