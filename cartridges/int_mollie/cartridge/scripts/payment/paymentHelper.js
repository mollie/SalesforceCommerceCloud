var Transaction = require('dw/system/Transaction');
var Order = require('dw/order/Order');
var URLUtils = require('dw/web/URLUtils');

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

    if (orderHelper.getOrderIsAuthorized(order)) {
        Transaction.wrap(function () {
            orderHelper.setOrderIsAuthorized(order, false);
        });
    }

    // PROCESS STATUS
    switch (paymentResult.status) {
        case STATUS.COMPLETED:
            COHelpers.placeOrder(order);
            Transaction.wrap(function () {
                orderHelper.setOrderShippingStatus(order, Order.SHIPPING_STATUS_SHIPPED,
                    { customLogMessage: 'PAYMENT :: Order shipped, Mollie status :: ' + paymentResult.status });
                order.setStatus(Order.ORDER_STATUS_COMPLETED);
            });
            break;

        case STATUS.PAID:
            COHelpers.placeOrder(order);
            Transaction.wrap(function () {
                orderHelper.setOrderPaymentStatus(order, Order.PAYMENT_STATUS_PAID,
                    { customLogMessage: 'PAYMENT :: Order paid, Mollie status :: ' + paymentResult.status });
            });
            break;

        case STATUS.PENDING:
            Transaction.wrap(function () {
                orderHelper.addItemToOrderHistory(order,
                    'PAYMENT :: Order pending, Mollie status :: ' + paymentResult.status);
            });
            break;

        case STATUS.AUTHORIZED:
            Transaction.wrap(function () {
                orderHelper.setOrderIsAuthorized(order, true);
                orderHelper.addItemToOrderHistory(order,
                    'PAYMENT :: Order authorized, Mollie status :: ' + paymentResult.status);
            });
            break;

        case STATUS.OPEN:
        case STATUS.CREATED:
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
                orderHelper.failOrCancelOrder(order,
                    'PAYMENT :: Canceling payment and returning to checkout because of bad status, Mollie status :: ' + paymentResult.status);
            });
            break;

        case STATUS.EXPIRED:
        case STATUS.CANCELED:
        case STATUS.FAILED:
            url = URLUtils.https('Checkout-Begin', 'orderID', orderId, 'stage', 'payment').toString();
            Transaction.wrap(function () {
                orderHelper.failOrCancelOrder(order,
                    'PAYMENT :: Canceling order, Mollie status :: ' + paymentResult.status);
            });
            break;

        case STATUS.SHIPPING:
            Transaction.wrap(function () {
                orderHelper.setOrderShippingStatus(order, Order.SHIPPING_STATUS_PARTSHIPPED,
                    { customLogMessage: 'Order partially shipped, Mollie status :: ' + paymentResult.status });
            });
            break;

        default:
            Transaction.wrap(function () {
                orderHelper.addItemToOrderHistory(order, 'PAYMENT :: Unknown Mollie status update :: ' + paymentResult.status);
            });
    }

    Transaction.wrap(function () {
        if (isMollieOrder) {
            orderHelper.setOrderId(order, paymentResult.id);
            orderHelper.setOrderStatus(order, paymentResult.status);
        } else {
            orderHelper.setPaymentId(order, null, paymentResult.id);
            orderHelper.setPaymentStatus(order, null, paymentResult.status);
        }
    });

    return {
        url: url
    };
}

module.exports = {
    processPaymentResult: processPaymentResult
};

