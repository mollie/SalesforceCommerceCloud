var Logger = require('*/cartridge/scripts/utils/logger');
var PaymentMgr = require('dw/order/PaymentMgr');
var OrderMgr = require('dw/order/OrderMgr');
var Order = require('dw/order/Order');

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
 *
 *
 * @param {dw.order.Order} order - CommerceCloud Order object
 * @param {number} paymentStatus - Payment Status
 * @returns {void}
 */
function setPaymentStatus(order, paymentStatus) {
    var logMessage = 'PAYMENT :: UpdatePaymentStatus :: Updated payment status for order ' + order.orderNo + ' to ' + paymentStatus;
    var currentPaymentStatus = order.getPaymentStatus().getValue();

    if (currentPaymentStatus !== paymentStatus) {
        order.setPaymentStatus(paymentStatus);
        addItemToOrderHistory(order, logMessage, true);
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

/**
 *
 * @description Set transaction custom property
 * @param {dw.order.Order} order - order object
 * @param {string} paymentMethod - Payment Method
 * @param {Object} custom - custom
 */
function setTransactionCustomProperty(order, paymentMethod, custom) {
    const paymentInstrument = getMolliePaymentInstruments(order, paymentMethod).pop();

    if (paymentInstrument) {
        paymentInstrument.getPaymentTransaction().custom[custom.key] = custom.value;
    }
};

/**
 *
 * @description Get transaction custom property
 * @param {dw.order.Order} order - order object
 * @param {string} paymentMethod - Payment Method
 * @param {Object} custom - custom
 * @returns {Object} - transaction custom property
 */
function getTransactionCustomProperty(order, paymentMethod, custom) {
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
    setPaymentStatus: setPaymentStatus,
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
