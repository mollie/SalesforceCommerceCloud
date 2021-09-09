var Transaction = require('dw/system/Transaction');
var Order = require('dw/order/Order');
var URLUtils = require('dw/web/URLUtils');

var config = require('*/cartridge/scripts/mollieConfig');
var orderHelper = require('*/cartridge/scripts/order/orderHelper');
var COHelpers = require('*/cartridge/scripts/checkout/checkoutHelpers');

/**
 * Returns the URL to redirect to when order has been placed
 *
 * @param {dw.order.Order} order order
 * @returns {string} URL to redirect to when order is placed
 */
function getRedirectSuccessURL(order) {
    var orderId = order.orderNo;
    var orderToken = order.orderToken;

    // Uncomment block to support SFRA < 6.0.0
    // return URLUtils.https('Order-Confirm', 'ID', orderId, 'token', orderToken).toString();

    // Comment block to support SFRA >= 6.0.0
    return URLUtils.https('MolliePayment-RedirectSuccess', 'orderId', orderId, 'orderToken', orderToken).toString();
    // End block
}

/**
 * Checks if Mollie order status has changed
 *
 * @param {dw.order.Order} order order
 * @param {Object} paymentResult paymentResult from getOrder or getPayment call
 * @returns {boolean} Whether Mollie order status has changed or not
 */
function isMollieOrderStatusChanged(order, paymentResult) {
    var isMollieOrder = orderHelper.isMollieOrder(order);
    var mollieOrderStatus = isMollieOrder ? orderHelper.getOrderStatus(order) : orderHelper.getPaymentStatus(order);
    return mollieOrderStatus !== paymentResult.status;
}

/**
 * Update the mollie status on the order
 *
 * @param {dw.order.Order} order order
 * @param {Object} paymentResult paymentResult from getOrder or getPayment call
 * @param {boolean} isMollieOrder true if mollie order, false if mollie payment
 */
function updateStatus(order, paymentResult, isMollieOrder) {
    Transaction.wrap(function () {
        if (paymentResult.payments && paymentResult.payments[0]) {
            orderHelper.setPaymentDetails(order, null, paymentResult.payments[0].details);
        }

        if (isMollieOrder) {
            orderHelper.setOrderId(order, paymentResult.id);
            orderHelper.setOrderStatus(order, paymentResult.status);
        } else {
            orderHelper.setPaymentId(order, null, paymentResult.id);
            orderHelper.setPaymentStatus(order, null, paymentResult.status);
        }
    });
}

/**
 * Process the Order Result from Mollie when redirect endpoint is called
 *
 * @param {dw.order.Order} order order
 * @param {Object} paymentResult paymentResult from getOrder or getPayment call
 * @return {Object} url
 */
function processPaymentResultRedirect(order, paymentResult) {
    var orderId = order.orderNo;
    var url = getRedirectSuccessURL(order);
    var isMollieOrder = orderHelper.isMollieOrder(order);
    var shouldUpdateStatus = true;

    if (!isMollieOrderStatusChanged(order, paymentResult)) {
        return { url: url };
    }

    var STATUS = config.getTransactionStatus();

    // PROCESS STATUS
    switch (paymentResult.status) {
        case STATUS.PENDING:
            Transaction.wrap(function () {
                orderHelper.addItemToOrderHistory(order,
                    'PAYMENT :: Order pending, Mollie status :: ' + paymentResult.status);
            });
            break;

        case STATUS.OPEN:
        case STATUS.CREATED:
            Transaction.wrap(function () {
                orderHelper.addItemToOrderHistory(order,
                    'PAYMENT :: Order open, Mollie status :: ' + paymentResult.status);
            });
            break;

        case STATUS.SHIPPING:
            Transaction.wrap(function () {
                orderHelper.setOrderShippingStatus(order, Order.SHIPPING_STATUS_PARTSHIPPED,
                    { customLogMessage: 'Order partially shipped, Mollie status :: ' + paymentResult.status });
            });
            break;

        case STATUS.EXPIRED:
        case STATUS.CANCELED:
        case STATUS.FAILED:
            shouldUpdateStatus = false;
            url = URLUtils.https('Checkout-Begin', 'orderID', orderId, 'stage', 'payment').toString();
            break;

        default:
            shouldUpdateStatus = false;
    }

    if (shouldUpdateStatus) {
        updateStatus(order, paymentResult, isMollieOrder);
    }

    return {
        url: url
    };
}

/**
 * Process the Order Result from Mollie
 *
 * @param {dw.order.Order} order order
 * @param {Object} paymentResult paymentResult from getOrder or getPayment call
 * @return {Object} url
 */
function processPaymentResultHook(order, paymentResult) {
    var orderId = order.orderNo;
    var url = getRedirectSuccessURL(order);
    var isMollieOrder = orderHelper.isMollieOrder(order);

    orderHelper.checkMollieRefundStatus(order, paymentResult);

    if (!isMollieOrderStatusChanged(order, paymentResult)) {
        return { url: url };
    }

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

        case STATUS.AUTHORIZED:
            Transaction.wrap(function () {
                orderHelper.setOrderIsAuthorized(order, true);
                orderHelper.addItemToOrderHistory(order,
                    'PAYMENT :: Order authorized, Mollie status :: ' + paymentResult.status);
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

        default:
            Transaction.wrap(function () {
                orderHelper.addItemToOrderHistory(order, 'PAYMENT :: Unknown Mollie status update :: ' + paymentResult.status);
            });
    }

    updateStatus(order, paymentResult, isMollieOrder);

    return {
        url: url
    };
}

/**
 * Process the QR code
 *
 * @param {dw.order.Order} order order
 * @return {string} url
 */
function processQR(order) {
    var orderId = order.orderNo;
    var orderToken = order.orderToken;
    var mollieOrderStatus = orderHelper.getPaymentStatus(order);
    var STATUS = config.getTransactionStatus();
    var result;

    switch (mollieOrderStatus) {
        case STATUS.PAID:
        case STATUS.OPEN:
            result = {
                paidStatus: true,
                continueUrl: URLUtils.https('MolliePayment-Redirect', 'orderId', orderId, 'orderToken', orderToken).toString()
            };
            break;

        case STATUS.EXPIRED:
        case STATUS.CANCELED:
        case STATUS.FAILED:
            result = {
                paidStatus: false,
                continueUrl: URLUtils.https('Checkout-Begin', 'orderID', orderId, 'stage', 'payment').toString()
            };
            break;

        default:
            result = {
                paidStatus: false
            };
    }

    return result;
}

module.exports = {
    processPaymentResultHook: processPaymentResultHook,
    processPaymentResultRedirect: processPaymentResultRedirect,
    processQR: processQR
};

