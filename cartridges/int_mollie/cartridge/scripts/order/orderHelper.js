var Logger = require('*/cartridge/scripts/utils/logger');
var PaymentMgr = require('dw/order/PaymentMgr');
var OrderMgr = require('dw/order/OrderMgr');
var Order = require('dw/order/Order');
var config = require('*/cartridge/scripts/mollieConfig');

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
    var orderStatus = order.getStatus().value;
    if (orderStatus === Order.ORDER_STATUS_CREATED) {
        failOrder(order, message)
    } else if (orderStatus === Order.ORDER_STATUS_OPEN || orderStatus === Order.ORDER_STATUS_NEW) {
        cancelOrder(order, message)
    } else {
        addItemToOrderHistory(order, 'PAYMENT :: Cannot fail or cancel the order. Order has not the correct status: ' + order.getStatus());
    }
}

/**
 *
 *
 * @param {dw.order.Order} order - Order object
 * @returns {boolean} is mollie order
 */
function isMollieOrder(order) {
    return getUsedTransactionAPI(order) === config.getTransactionAPI().ORDER;
}

/**
 *
 *
 * @param {dw.order.Order} order - CommerceCloud Order object
 * @param {number} paymentStatus - Payment Status
 * @returns {void}
 */
function setOrderPaymentStatus(order, paymentStatus) {
    var logMessage = 'PAYMENT :: UpdatePaymentStatus :: Updated payment status for order ' + order.orderNo + ' to ' + paymentStatus;
    var currentPaymentStatus = order.getPaymentStatus().getValue();

    if (currentPaymentStatus !== paymentStatus) {
        order.setPaymentStatus(paymentStatus);
        addItemToOrderHistory(order, logMessage, true);
    }
}

/**
 *
 *
 * @param {dw.order.Order} order - CommerceCloud Order object
 * @param {number} shippingStatus - Shipping Status
 * @returns {void}
 */
function setOrderShippingStatus(order, shippingStatus) {
    var logMessage = 'PAYMENT :: UpdateShippingStatus :: Updated shipping status for order ' + order.orderNo + ' to ' + shippingStatus;
    var currentShippingStatus = order.getShippingStatus().getValue();

    if (currentShippingStatus !== shippingStatus) {
        order.setShippingStatus(shippingStatus);
        addItemToOrderHistory(order, logMessage, true);
    }
}

/**
 *
 * @description Returns all paymentInstruments related to the Mollie processor
 * @param {dw.order.Order} order - order object
 * @param {string} paymentMethodId - payment method id
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
 * @param {string} paymentMethodId - payment method id
 * @param {Object} custom - custom
 */
function setTransactionCustomProperty(order, paymentMethodId, custom) {
    const paymentInstrument = getMolliePaymentInstruments(order, paymentMethodId).pop();

    if (paymentInstrument) {
        paymentInstrument.getPaymentTransaction().custom[custom.key] = custom.value;
    }
};

/**
 *
 * @description Get transaction custom property
 * @param {dw.order.Order} order - order object
 * @param {string} paymentMethodId - payment method id
 * @param {Object} custom - custom
 * @returns {Object} - transaction custom property
 */
function getTransactionCustomProperty(order, paymentMethodId, custom) {
    const paymentInstrument = getMolliePaymentInstruments(order, paymentMethodId).pop();

    if (!paymentInstrument) return null;
    const customProperty = paymentInstrument.getPaymentTransaction().custom[custom.key];
    return customProperty && customProperty.toString();
};

/**
 *
 * @description Set order custom property
 * @param {dw.order.Order} order - order object
 * @param {Object} custom - custom
 */
function setOrderCustomProperty(order, custom) {
    order.custom[custom.key] = custom.value;
};

/**
 *
 * @description Get order custom property
 * @param {dw.order.Order} order - order object
 * @param {Object} custom - custom
 * @returns {Object} - transaction custom property
 */
function getOrderCustomProperty(order, custom) {
    const customProperty = order.custom[custom.key];
    return customProperty && customProperty.toString();
};

/**
 *
 *
 * @param {dw.order.Order} order - CommerceCloud Order object
 * @param {string} paymentMethodId - payment method id
 * @param {string} paymentId - Mollie payment id
 * @returns {void}
 */
function setPaymentId(order, paymentMethodId, paymentId) {
    setTransactionCustomProperty(order, paymentMethodId, { key: 'molliePaymentId', value: new String(paymentId).toString() });
}

/**
 *
 *
 * @param {dw.order.Order} order - CommerceCloud Order object
 * @param {string} paymentMethodId - payment method id
 * @returns {string} - payment id
 */
function getPaymentId(order, paymentMethodId) {
    return getTransactionCustomProperty(order, paymentMethodId, { key: 'molliePaymentId' });
}

/**
 *
 *
 * @param {dw.order.Order} order - CommerceCloud Order object
 * @param {string} paymentMethodId - payment method id
 * @param {string} transactionId - Mollie payment / order status
 * @returns {void}
 */
function setPaymentStatus(order, paymentMethodId, status) {
    setTransactionCustomProperty(order, paymentMethodId, { key: 'molliePaymentStatus', value: new String(status).toString() });
}

/**
 *
 *
 * @param {dw.order.Order} order - CommerceCloud Order object
 * @param {string} paymentMethodId - payment method id
 * @returns {string} - captureId
 */
function getPaymentStatus(order, paymentMethodId) {
    return getTransactionCustomProperty(order, paymentMethodId, { key: 'molliePaymentStatus' });
}

/**
 *
 *
 * @param {dw.order.Order} order - CommerceCloud Order object
 * @param {string} orderId - Mollie order id
 * @returns {void}
 */
function setOrderId(order, orderId) {
    setOrderCustomProperty(order, { key: 'mollieOrderId', value: new String(orderId).toString() });
}

/**
 *
 *
 * @param {dw.order.Order} order - CommerceCloud Order object
 * @returns {string} - order id
 */
function getOrderId(order) {
    return getOrderCustomProperty(order, { key: 'mollieOrderId' });
}

/**
 *
 *
 * @param {dw.order.Order} order - CommerceCloud Order object
 * @param {string} orderId - Mollie order id
 * @returns {void}
 */
function setOrderStatus(order, orderStatus) {
    setOrderCustomProperty(order, { key: 'mollieOrderStatus', value: new String(orderStatus).toString() });
}

/**
 *
 *
 * @param {dw.order.Order} order - CommerceCloud Order object
 * @returns {string} - order status
 */
function getOrderStatus(order) {
    return getOrderCustomProperty(order, { key: 'mollieOrderStatus' });
}

/**
 *
 *
 * @param {dw.order.Order} order - CommerceCloud Order object
 * @param {string} usedTransactionAPI - Mollie order id
 * @returns {void}
 */
function setUsedTransactionAPI(order, usedTransactionAPI) {
    setOrderCustomProperty(order, { key: 'mollieUsedTransactionAPI', value: new String(usedTransactionAPI).toString() });
}

/**
 *
 *
 * @param {dw.order.Order} order - CommerceCloud Order object
 * @returns {string} - order id
 */
function getUsedTransactionAPI(order) {
    return getOrderCustomProperty(order, { key: 'mollieUsedTransactionAPI' });
}

module.exports = {
    addItemToOrderHistory: addItemToOrderHistory,
    failOrder: failOrder,
    cancelOrder: cancelOrder,
    failOrCancelOrder: failOrCancelOrder,
    isMollieOrder: isMollieOrder,
    setOrderPaymentStatus: setOrderPaymentStatus,
    setOrderShippingStatus: setOrderShippingStatus,
    getMolliePaymentInstruments: getMolliePaymentInstruments,
    setTransactionCustomProperty: setTransactionCustomProperty,
    getTransactionCustomProperty: getTransactionCustomProperty,
    setOrderCustomProperty: setOrderCustomProperty,
    getOrderCustomProperty: getOrderCustomProperty,
    setPaymentId: setPaymentId,
    getPaymentId: getPaymentId,
    setPaymentStatus: setPaymentStatus,
    getPaymentStatus: getPaymentStatus,
    setOrderId: setOrderId,
    getOrderId: getOrderId,
    setOrderStatus: setOrderStatus,
    getOrderStatus: getOrderStatus,
    setUsedTransactionAPI: setUsedTransactionAPI,
    getUsedTransactionAPI: getUsedTransactionAPI
};
