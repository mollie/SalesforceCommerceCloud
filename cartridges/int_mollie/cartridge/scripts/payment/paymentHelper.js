var Transaction = require('dw/system/Transaction');
var Order = require('dw/order/Order');
var URLUtils = require('dw/web/URLUtils');
var Resource = require('dw/web/Resource');

var config = require('*/cartridge/scripts/config');
var orderHelper = require('*/cartridge/scripts/order/orderHelper');
var COHelpers = require('*/cartridge/scripts/checkout/checkoutHelpers');
var ObjectUtil = require('*/cartridge/scripts/utils/object');

/**
 * Process the Order Result from worldline
 *
 * @param {dw.order.Order} order
 * @param {object} paymentResult
 * @return {string} url
 */
function processPaymentResult(order, paymentResult) {
    const STATUS = config.getTransactionStatus();

    var url;
    var orderId = order.orderNo;
    var orderToken = order.orderToken;

    Transaction.wrap(function () {
        var historyItem = 'PAYMENT :: Processing ' + ' ' + processType + ' :: ' + JSON.stringify(paymentResults);
        orderHelper.addItemToOrderHistory(order, historyItem, true);
        orderHelper.setTransactionStatus(order, null, paymentResult.status);
        orderHelper.setTransactionPaymentId(order, null, paymentResult.id);
    });

    /**
     * OPEN: "open", ---
    CREATED: "created", ---
    PENDING: "pending",
    AUTHORIZED: "authorized", HOOK
    PAID: "paid", --- HOOK
    SHIPPING: "shipping", X
    COMPLETED: "completed", X
    EXPIRED: "expired", --- HOOK
    CANCELED: "canceled", --- HOOK
    FAILED: "failed" --- HOOK
     */

    // PROCESS STATUS
    switch (paymentResult.status) {
        case STATUS.PAID:
            if (orderHelper.isNewOrder(order)) {
                COHelpers.placeOrder(order);
            }
            Transaction.wrap(function () {
                orderHelper.setPaymentStatus(order, Order.PAYMENT_STATUS_PAID);
            });
            url = URLUtils.https('Order-Confirm', 'ID', orderId, 'token', orderToken).toString();
            break;

        case STATUS.PENDING:
        case STATUS.AUTHORIZED:
            if (orderHelper.isNewOrder(order)) {
                COHelpers.placeOrder(order);
            }
            url = URLUtils.https('Order-Confirm', 'ID', orderId, 'token', orderToken).toString();
            break;

        case STATUS.OPEN:
        case STATUS.CREATED:
        case STATUS.EXPIRED:
        case STATUS.CANCELED:
        case STATUS.FAILED:
        default:
            Transaction.wrap(function () {
                var historyItem = 'PAYMENT :: Return to checkout because of bad status :: ' + transaction.toStatusString();
                orderHelper.failOrCancelOrder(order, historyItem);
            });
            orderHelper.cancelPaymentOrOrder(order);
            session.privacy.mollieError = Resource.msg('mollie.payment.error.' + ObjectUtil.getProperty(STATUS, paymentResult.status), 'mollie', null);
            url = URLUtils.https('Checkout-Begin', 'orderID', orderId, 'stage', 'payment').toString()
            break;
    }

    Transaction.wrap(function () {
        var historyItem = 'PAYMENT :: ' + transaction.transactionType + ' transaction ' + transaction.status;
        orderHelper.addItemToOrderHistory(order, historyItem, false);
    });

    return url;
}

module.exports = {
    processPaymentResult: processPaymentResult
};

