var Logger = require('*/cartridge/scripts/utils/logger');
var OrderMgr = require('dw/order/OrderMgr');
var molliePaymentService = require('*/cartridge/scripts/payment/paymentService');

/**
 *
 *
 * @param {dw.order.Order} order - CommerceCloud Order object
 * @param {string} historyItem - String to log
 * @param {boolean} [logDebug] - Log historyItem to debug
 * @returns {void}
 */
function addItemToOrderHistory(order, historyItem, logDebug) {
    order.trackOrderChange(historyItem);
    if (logDebug) {
        Logger.debug(historyItem);
    }
}

/**
 *
 *
 * @param {dw.order.Order} order - Order object
 * @param {string} message - Error Message
 * @returns {void}
 */
function failOrder(order, message) {
    addItemToOrderHistory(order, message, true);

    var failOrderStatus = OrderMgr.failOrder(order, true);
    if (failOrderStatus.isError()) {
        addItemToOrderHistory(order, 'PAYMENT :: Failed failing the order. User basket not restored: ' + JSON.stringify(failOrderStatus.getMessage()), true);
    }
}

/**
 *
 *
 * @param {dw.order.Order} order - Order object
 * @param {string} message - Error Message
 * @returns {void}
 */
function cancelOrder(order, message) {
    addItemToOrderHistory(order, message, true);

    var failOrderStatus = OrderMgr.cancelOrder(order);
    if (failOrderStatus.isError()) {
        addItemToOrderHistory(order, 'PAYMENT :: Failed canceling the order. User basket not restored: ' + JSON.stringify(failOrderStatus.getMessage()), true);
    }
}

/**
 *
 *
 * @param {dw.order.Order} order - Order object
 * @param {string} message - Error Message
 * @returns {void}
 */
function failOrCancelOrder(order, message) {
    if (order.getStatus() === Order.ORDER_STATUS_CREATED) {
        failOrder(order, message)
    } else if (order.getStatus() === Order.ORDER_STATUS_OPEN || order.getStatus() === Order.ORDER_STATUS_NEW) {
        cancelOrder(order, message)
    } else {
        addItemToOrderHistory(order, 'PAYMENT :: Cannot fail or cancel the order. Order has not the correct status: ' + order.getStatus());
    }
}

/**
 *
 *
 * @param {dw.order.Order} order - Order object
 * @returns {void}
 */
function isNewOrder(order) {
    return order.getStatus() === Order.ORDER_STATUS_CREATED;
}

/**
 * Cancels the mollie payment / order
 *
 * @param {dw.order.Order} order 
 * @return {void}
 */
function cancelMolliePaymentOrOrder(order) {
    if (orderHelper.getTransactionAPI() === config.getTransactionAPI().ORDER) {
        var orderId = orderHelper.getTransactionOrderId(order, null);
        mollieOrderService.cancelOrder(orderId);
    } else {
        var paymentId = orderHelper.getTransactionPaymentId(order, null);
        molliePaymentService.cancelPayment(paymentId);
    }
}

/**
 *
 * @description Returns all paymentInstruments related to the Mollie processor
 * @param {dw.order.Order} order - order object
 * @param {string} [paymentMethodId] - paymentMethodId
 * @returns {dw.order.OrderPaymentInstrument[]} - Mollie PaymentInstruments
 */
function getMolliePaymentInstruments(order, paymentMethodId) {
    const filterFunction = function (instrument) {
        const paymentMethod = PaymentMgr.getPaymentMethod(instrument.getPaymentMethod());
        return paymentMethod && paymentMethod.getPaymentProcessor().getID().indexOf('MOLLIE') >= 0;
    };
    return paymentMethodId
        ? order.getPaymentInstruments(paymentMethodId).toArray().filter(filterFunction)
        : order.getPaymentInstruments().toArray().filter(filterFunction);
}

var setTransactionCustomProperty = function (order, paymentMethod, custom) {
    const paymentInstrument = getMolliePaymentInstruments(order, paymentMethod).pop();

    if (paymentInstrument) {
        paymentInstrument.getPaymentTransaction().custom[custom.key] = custom.value;
    }
};

var getTransactionCustomProperty = function (order, paymentMethod, custom) {
    const paymentInstrument = getMolliePaymentInstruments(order, paymentMethod).pop();

    if (!paymentInstrument) return null;
    const customProperty = paymentInstrument.getPaymentTransaction().custom[custom.key];
    return customProperty && customProperty.toString();
};

/**
 *
 *
 * @param {dw.order.Order} order - CommerceCloud Order object
 * @param {string} paymentMethod - Payment Method
 * @param {string} transactionId - Mollie payment / order status
 * @returns {void}
 */
function setTransactionStatus(order, paymentMethod, status) {
    setTransactionCustomProperty(order, paymentMethod, { key: 'mollieTransactionStatus', value: new String(status).toString() });
}

/**
 *
 *
 * @param {dw.order.Order} order - CommerceCloud Order object
 * @param {string} paymentMethod - Payment Method
 * @returns {string} - captureId
 */
function getTransactionStatus(order, paymentMethod) {
    return getTransactionCustomProperty(order, paymentMethod, { key: 'mollieTransactionStatus' });
}

/**
 *
 *
 * @param {dw.order.Order} order - CommerceCloud Order object
 * @param {string} paymentMethod - Payment Method
 * @param {string} paymentId - Mollie payment id
 * @returns {void}
 */
function setTransactionPaymentId(order, paymentMethod, paymentId) {
    setTransactionCustomProperty(order, paymentMethod, { key: 'mollieTransactionPaymentId', value: new String(paymentId).toString() });
}

/**
 *
 *
 * @param {dw.order.Order} order - CommerceCloud Order object
 * @param {string} paymentMethod - Payment Method
 * @returns {string} - payment id
 */
function getTransactionPaymentId(order, paymentMethod) {
    return getTransactionCustomProperty(order, paymentMethod, { key: 'mollieTransactionPaymentId' });
}

/**
 *
 *
 * @param {dw.order.Order} order - CommerceCloud Order object
 * @param {string} paymentMethod - Payment Method
 * @param {string} transactionId - Mollie order id
 * @returns {void}
 */
function setTransactionOrderId(order, paymentMethod, orderId) {
    setTransactionCustomProperty(order, paymentMethod, { key: 'mollieTransactionOrderId', value: new String(orderId).toString() });
}

/**
 *
 *
 * @param {dw.order.Order} order - CommerceCloud Order object
 * @param {string} paymentMethod - Payment Method
 * @returns {string} - order id
 */
function getTransactionOrderId(order, paymentMethod) {
    return getTransactionCustomProperty(order, paymentMethod, { key: 'mollieTransactionOrderId' });
}

/**
 *
 *
 * @param {dw.order.Order} order - CommerceCloud Order object
 * @param {string} paymentMethod - Payment Method
 * @param {string} transactionId - Mollie payment / order status
 * @returns {void}
 */
function setTransactionAPI(order, paymentMethod, type) {
    setTransactionCustomProperty(order, paymentMethod, { key: 'mollieTransactionAPI', value: new String(type).toString() });
}

/**
 *
 *
 * @param {dw.order.Order} order - CommerceCloud Order object
 * @param {string} paymentMethod - Payment Method
 * @returns {string} - type
 */
function getTransactionAPI(order, paymentMethod) {
    return getTransactionCustomProperty(order, paymentMethod, { key: 'mollieTransactionAPI' });
}

module.exports = {
    addItemToOrderHistory: addItemToOrderHistory,
    failOrder: failOrder,
    cancelOrder: cancelOrder,
    failOrCancelOrder: failOrCancelOrder,
    isNewOrder: isNewOrder,
    cancelMolliePaymentOrOrder: cancelMolliePaymentOrOrder,
    getMolliePaymentInstruments: getMolliePaymentInstruments,
    setTransactionCustomProperty: setTransactionCustomProperty,
    getTransactionCustomProperty: getTransactionCustomProperty,
    setTransactionStatus: setTransactionStatus,
    getTransactionStatus: getTransactionStatus,
    setTransactionPaymentId: setTransactionPaymentId,
    getTransactionPaymentId: getTransactionPaymentId,
    setTransactionOrderId: setTransactionOrderId,
    getTransactionOrderId: getTransactionOrderId,
    setTransactionAPI: setTransactionAPI,
    getTransactionAPI: getTransactionAPI,
};
