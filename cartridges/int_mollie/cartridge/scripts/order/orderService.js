var MollieService = require('*/cartridge/scripts/services/worldlineService');
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
            var historyItem = 'MOLLIE :: CREATE PAYMENT' + orderResult.raw;
            orderHelper.addItemToOrderHistory(order, historyItem, true);
            orderHelper.setTransactionAPI(order, null, API.ORDER);
        });

        return paymentResult.links.checkout.link.href;
    } catch (e) {
        if (e.name === 'PaymentProviderException') throw e;
        throw ServiceException.from(e);
    }
}

module.exports.createOrder = createOrder;