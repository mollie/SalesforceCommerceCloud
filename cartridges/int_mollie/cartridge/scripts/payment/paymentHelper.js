var Transaction = require('dw/system/Transaction');
var Order = require('dw/order/Order');
var URLUtils = require('dw/web/URLUtils');
var Resource = require('dw/web/Resource');

var config = require('*/cartridge/scripts/mollieConfig');
var orderHelper = require('*/cartridge/scripts/order/orderHelper');
var COHelpers = require('*/cartridge/scripts/checkout/checkoutHelpers');

/**
 * Process the Order Result from Mollie
 *
 * @param {dw.order.Order} order order
 * @param {Object} paymentResult paymentResult from getOrder or getPayment call
 * @return {string} url
 */
function processPaymentResult(order, paymentResult) {
    var paymentService = require('*/cartridge/scripts/payment/paymentService');

    var orderId = order.orderNo;
    var orderToken = order.orderToken;
    var url = URLUtils.https('Order-Confirm', 'ID', orderId, 'token', orderToken).toString();

    orderHelper.checkMollieRefundStatus(order, paymentResult);

    var isMollieOrder = orderHelper.isMollieOrder(order);
    var mollieOrderStatus = isMollieOrder ? orderHelper.getOrderStatus(order) : orderHelper.getPaymentStatus(order);
    if (mollieOrderStatus === paymentResult.status) return { url: url };

    var STATUS = config.getTransactionStatus();
    var historyItem;

    // PROCESS STATUS
    switch (paymentResult.status) {
        case STATUS.COMPLETED:
            historyItem = 'PAYMENT :: Order shipped, status :: ' + paymentResult.status;
            COHelpers.placeOrder(order);
            Transaction.wrap(function () {
                orderHelper.setOrderShippingStatus(order, Order.SHIPPING_STATUS_SHIPPED);
            });
            break;

        case STATUS.PAID:
            historyItem = 'PAYMENT :: Order paid, status :: ' + paymentResult.status;
            COHelpers.placeOrder(order);
            Transaction.wrap(function () {
                orderHelper.setOrderPaymentStatus(order, Order.PAYMENT_STATUS_PAID);
            });
            break;

        case STATUS.PENDING:
        case STATUS.AUTHORIZED:
            historyItem = 'PAYMENT :: Order pending, status :: ' + paymentResult.status;
            COHelpers.placeOrder(order);
            break;

        case STATUS.OPEN:
        case STATUS.CREATED:
            var cancelHistoryItem = 'PAYMENT :: Canceling payment and returning to checkout because of bad status, status :: ' + paymentResult.status;
            url = URLUtils.https('Checkout-Begin', 'orderID', orderId, 'stage', 'payment').toString();
            if (paymentResult.isCancelable()) {
                if (isMollieOrder) {
                    paymentService.cancelOrder(order);
                } else {
                    var paymentId = orderHelper.getPaymentId(order);
                    paymentService.cancelPayment(paymentId);
                }
            }
            Transaction.wrap(function () {
                orderHelper.failOrCancelOrder(order, cancelHistoryItem);
            });
            break;

        case STATUS.EXPIRED:
        case STATUS.CANCELED:
        case STATUS.FAILED:
            var failHistoryItem = 'PAYMENT :: Canceling order, status :: ' + paymentResult.status;
            session.privacy.mollieError = Resource.msg('mollie.payment.error.' + paymentResult.status, 'mollie', null);
            url = URLUtils.https('Checkout-Begin', 'orderID', orderId, 'stage', 'payment').toString();
            Transaction.wrap(function () {
                orderHelper.failOrCancelOrder(order, failHistoryItem);
            });
            break;

        case STATUS.SHIPPING:
            Transaction.wrap(function () {
                orderHelper.setOrderShippingStatus(order, Order.SHIPPING_STATUS_PARTSHIPPED);
            });
            break;

        default:
            historyItem = 'PAYMENT :: Unknown Mollie status update :: ' + paymentResult.status;
    }

    Transaction.wrap(function () {
        if (isMollieOrder) {
            orderHelper.setOrderId(order, paymentResult.id);
            orderHelper.setOrderStatus(order, paymentResult.status);
        } else {
            orderHelper.setPaymentId(order, null, paymentResult.id);
            orderHelper.setPaymentStatus(order, null, paymentResult.status);
        }
        if (historyItem) {
            orderHelper.addItemToOrderHistory(order, historyItem, true);
        }
    });

    return {
        url: url
    };
}

module.exports = {
    processPaymentResult: processPaymentResult
};

