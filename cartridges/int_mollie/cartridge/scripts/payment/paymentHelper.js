var Transaction = require('dw/system/Transaction');
var Order = require('dw/order/Order');
var URLUtils = require('dw/web/URLUtils');
var Resource = require('dw/web/Resource');

var config = require('*/cartridge/scripts/mollieConfig');
var orderHelper = require('*/cartridge/scripts/order/orderHelper');
var COHelpers = require('*/cartridge/scripts/checkout/checkoutHelpers');
var ObjectUtil = require('*/cartridge/scripts/utils/object');
var ObjectUtil = require('*/cartridge/scripts/utils/object');
var paymentService = require('*/cartridge/scripts/payment/paymentService');

/**
 * Process the Order Result from Mollie
 *
 * @param {dw.order.Order} order
 * @param {Object} paymentResult
*  @param {String} paymentMethodId
 * @return {string} url
 */
function processPaymentResult(order, paymentResult, paymentMethodId) {
    const STATUS = config.getTransactionStatus();
    const isMollieOrder = orderHelper.isMollieOrder(order);

    var orderId = order.orderNo;
    var orderToken = order.orderToken;
    var url = URLUtils.https('Order-Confirm', 'ID', orderId, 'token', orderToken).toString()
    var historyItem;
    // PROCESS STATUS
    switch (paymentResult.status) {
        case STATUS.COMPLETED:
            historyItem = 'PAYMENT :: Order shipped, status :: ' + paymentResult.status;
            Transaction.wrap(function () {
                orderHelper.setOrderShippingStatus(order, Order.SHIPPING_STATUS_SHIPPED);
            });
            break;
        case STATUS.PAID:
            historyItem = 'PAYMENT :: Order paid, status :: ' + paymentResult.status;
            if (orderHelper.isNewOrder(order)) {
                COHelpers.placeOrder(order);
            }
            Transaction.wrap(function () {
                orderHelper.setOrderPaymentStatus(order, Order.PAYMENT_STATUS_PAID);
            });
            break;

        case STATUS.PENDING:
        case STATUS.AUTHORIZED:
            historyItem = 'PAYMENT :: Order pending, status :: ' + paymentResult.status;
            if (orderHelper.isNewOrder(order)) {
                COHelpers.placeOrder(order);
            }
            break;

        case STATUS.OPEN:
        case STATUS.CREATED:
            historyItem = 'PAYMENT :: Return to checkout because of bad status, status :: ' + paymentResult.status;
            url = URLUtils.https('Checkout-Begin', 'orderID', orderId, 'stage', 'payment').toString();
            if (paymentResult.isCancelable()) {
                if (isMollieOrder) {
                    paymentService.cancelOrder(order);
                } else {
                    var paymentId = orderHelper.getPaymentId(order, paymentMethodId);
                    paymentService.cancelPayment(paymentId);
                }
            }

        case STATUS.EXPIRED:
        case STATUS.CANCELED:
        case STATUS.FAILED:
            Transaction.wrap(function () {
                var historyItem = 'PAYMENT :: Canceling order, status :: ' + paymentResult.status;
                orderHelper.failOrCancelOrder(order, historyItem);
            });

            session.privacy.mollieError = Resource.msg('mollie.payment.error.' + ObjectUtil.getProperty(STATUS, paymentResult.status), 'mollie', null);
            url = URLUtils.https('Checkout-Begin', 'orderID', orderId, 'stage', 'payment').toString();
            break;
    }

    Transaction.wrap(function () {
        if (isMollieOrder) {
            orderHelper.setOrderId(order, paymentResult.id)
            orderHelper.setOrderStatus(order, paymentResult.status);
        } else {
            orderHelper.setPaymentId(order, paymentMethodId, paymentResult.id)
            orderHelper.setPaymentStatus(order, paymentMethodId, paymentResult.status);
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

