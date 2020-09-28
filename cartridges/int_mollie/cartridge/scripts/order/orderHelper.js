var Logger = require('*/cartridge/scripts/utils/logger');
var PaymentMgr = require('dw/order/PaymentMgr');
var OrderMgr = require('dw/order/OrderMgr');
var Order = require('dw/order/Order');
var config = require('*/cartridge/scripts/mollieConfig');
var Transaction = require('dw/system/Transaction');

/**
 *
 *
 * @param {dw.order.Order} order - CommerceCloud Order object
 * @param {dw.order.PaymentMethod} paymentMethod - Order paymentMethod
 * @returns {void}
 */
function getPaymentDescription(order, paymentMethod) {
    var description = paymentMethod.description && paymentMethod.description.markup;
    if (description) {
        var stringMapping = {
            '{orderNumber}': order.orderNo,
            '{storeName}': config.getSiteName(),
            '{order.reference}': order.customerOrderReference,
            '{customer.firstname}': order.customer.profile.firstName,
            '{customer.lastName}': order.customer.profile.lastName,
            '{customer.company}': order.customer.profile.companyName
        };

        Object.keys(stringMapping).forEach(function (key) {
            var value = stringMapping[key];
            description = value ? description.replace(key, value) : description.replace(key, '');
        });
    }

    return description;
}

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
        failOrder(order, message);
    } else if (orderStatus === Order.ORDER_STATUS_OPEN || orderStatus === Order.ORDER_STATUS_NEW) {
        cancelOrder(order, message);
    } else {
        addItemToOrderHistory(order, 'PAYMENT :: Cannot fail or cancel the order. Order has not the correct status: ' + order.getStatus());
    }
}

/**
 *
 *
 * @param {dw.order.Order} order - CommerceCloud Order object
 * @param {number} paymentStatus - Payment Status
 * @param {string} logMessage - log message
 * @returns {void}
 */
function setOrderPaymentStatus(order, paymentStatus, logMessage) {
    var logMessage = logMessage || 'PAYMENT :: UpdatePaymentStatus :: Updated payment status for order ' + order.orderNo + ' to ' + paymentStatus;
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
 * @param {string} logMessage - log message
 * @returns {void}
 */
function setOrderShippingStatus(order, shippingStatus, logMessage) {
    var logMessage = logMessage || 'PAYMENT :: UpdateShippingStatus :: Updated shipping status for order ' + order.orderNo + ' to ' + shippingStatus;
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
    var filterFunction = function (instrument) {
        var paymentMethod = PaymentMgr.getPaymentMethod(instrument.getPaymentMethod());
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
    var paymentInstrument = getMolliePaymentInstruments(order, paymentMethodId).pop();

    if (paymentInstrument) {
        paymentInstrument.getPaymentTransaction().custom[custom.key] = custom.value;
    }
}

/**
 *
 * @description Get transaction custom property
 * @param {dw.order.Order} order - order object
 * @param {string} paymentMethodId - payment method id
 * @param {Object} custom - custom
 * @returns {Object} - transaction custom property
 */
function getTransactionCustomProperty(order, paymentMethodId, custom) {
    var paymentInstrument = getMolliePaymentInstruments(order, paymentMethodId).pop();

    if (!paymentInstrument) return null;
    var customProperty = paymentInstrument.getPaymentTransaction().custom[custom.key];
    return customProperty && customProperty.toString();
}

/**
 *
 * @description Set order custom property
 * @param {dw.order.Order} order - order object
 * @param {Object} custom - custom
 */
function setOrderCustomProperty(order, custom) {
    order.custom[custom.key] = custom.value; // eslint-disable-line no-param-reassign
}

/**
 *
 * @description Get order custom property
 * @param {dw.order.Order} order - order object
 * @param {Object} custom - custom
 * @returns {Object} - transaction custom property
 */
function getOrderCustomProperty(order, custom) {
    var customProperty = order.custom[custom.key];
    return customProperty && customProperty.toString();
}

/**
 *
 *
 * @param {dw.order.Order} order - CommerceCloud Order object
 * @param {string} paymentMethodId - payment method id
 * @param {string} paymentId - Mollie payment id
 * @returns {void}
 */
function setPaymentId(order, paymentMethodId, paymentId) {
    setTransactionCustomProperty(order, paymentMethodId, { key: 'molliePaymentId', value: paymentId });
}

/**
 *
 *
 * @param {dw.order.Order} order - CommerceCloud Order object
 * @param {string} paymentMethodId - payment method id
 * @returns {string} - Mollie payment id
 */
function getPaymentId(order, paymentMethodId) {
    return getTransactionCustomProperty(order, paymentMethodId, { key: 'molliePaymentId' });
}

/**
 *
 *
 * @param {dw.order.Order} order - CommerceCloud Order object
 * @param {string} paymentMethodId - payment method id
 * @param {string} status - Mollie payment status
 * @returns {void}
 */
function setPaymentStatus(order, paymentMethodId, status) {
    setTransactionCustomProperty(order, paymentMethodId, { key: 'molliePaymentStatus', value: status });
}

/**
 *
 *
 * @param {dw.order.Order} order - CommerceCloud Order object
 * @param {string} paymentMethodId - payment method id
 * @returns {string} - Mollie payment status
 */
function getPaymentStatus(order, paymentMethodId) {
    return getTransactionCustomProperty(order, paymentMethodId, { key: 'molliePaymentStatus' });
}

/**
 *
 *
 * @param {dw.order.Order} order - CommerceCloud Order object
 * @param {string} paymentMethodId - payment method id
 * @returns {string} - Mollie issuer data
 */
function getIssuerData(order, paymentMethodId) {
    return getTransactionCustomProperty(order, paymentMethodId, { key: 'mollieIssuerData' });
}

/**
 *
 *
 * @param {dw.order.Order} order - CommerceCloud Order object
 * @param {string} paymentMethodId - payment method id
 * @param {string} issuerData - Mollie issuer data
 * @returns {void}
 */
function setIssuerData(order, paymentMethodId, issuerData) {
    setTransactionCustomProperty(order, paymentMethodId, { key: 'mollieIssuerData', value: issuerData });
}

/**
 *
 *
 * @param {dw.order.Order} order - CommerceCloud Order object
 * @param {string} orderId - Mollie order id
 * @returns {void}
 */
function setOrderId(order, orderId) {
    setOrderCustomProperty(order, { key: 'mollieOrderId', value: orderId });
}

/**
 *
 *
 * @param {dw.order.Order} order - CommerceCloud Order object
 * @returns {string} - Mollie order id
 */
function getOrderId(order) {
    return getOrderCustomProperty(order, { key: 'mollieOrderId' });
}

/**
 *
 *
 * @param {dw.order.Order} order - CommerceCloud Order object
 * @param {string} orderStatus - Mollie order status
 * @returns {void}
 */
function setOrderStatus(order, orderStatus) {
    setOrderCustomProperty(order, { key: 'mollieOrderStatus', value: orderStatus });
}

/**
 *
 *
 * @param {dw.order.Order} order - CommerceCloud Order object
 * @returns {string} - Mollie order status
 */
function getOrderStatus(order) {
    return getOrderCustomProperty(order, { key: 'mollieOrderStatus' });
}

/**
 *
 *
 * @param {dw.order.Order} order - CommerceCloud Order object
 * @param {string} usedTransactionAPI - Mollie used transaction API (order / payment)
 * @returns {void}
 */
function setUsedTransactionAPI(order, usedTransactionAPI) {
    setOrderCustomProperty(order, { key: 'mollieUsedTransactionAPI', value: usedTransactionAPI });
}

/**
 *
 *
 * @param {dw.order.Order} order - CommerceCloud Order object
 * @returns {string} - Mollie used transaction API (order / payment)
 */
function getUsedTransactionAPI(order) {
    return getOrderCustomProperty(order, { key: 'mollieUsedTransactionAPI' });
}

/**
 *
 *
 * @param {dw.order.Order} order - CommerceCloud Order object
 * @param {string} refundStatus - Mollie refund status
 * @returns {void}
 */
function setRefundStatus(order, refundStatus) {
    setOrderCustomProperty(order, { key: 'mollieRefundStatus', value: refundStatus });
}

/**
 *
 *
 * @param {dw.order.Order} order - CommerceCloud Order object
 * @returns {string} - Mollie refund status
 */
function getRefundStatus(order) {
    return getOrderCustomProperty(order, { key: 'mollieRefundStatus' });
}

/**
 *
 *
 * @param {dw.order.Order} order - Order object
 * @returns {boolean} is mollie order?
 */
function isMollieOrder(order) {
    var orderHelper = require('*/cartridge/scripts/order/orderHelper');
    return orderHelper.getUsedTransactionAPI(order) === config.getTransactionAPI().ORDER;
}

/**
 * Checks the mollie refund status and updates SFCC order
 *
 * @param {dw.order.Order} order order
 * @param {Object} paymentResult paymentResult from getOrder or getPayment call
 */
function checkMollieRefundStatus(order, paymentResult) {
    var orderHelper = require('*/cartridge/scripts/order/orderHelper');
    var amountRefunded = paymentResult.amountRefunded.value;
    if (amountRefunded && Number(amountRefunded) > 0) {
        var REFUND_STATUS = config.getRefundStatus();
        if (amountRefunded === paymentResult.amount.value
            && orderHelper.getRefundStatus(order).value !== REFUND_STATUS.REFUNDED) {
            Transaction.wrap(function () {
                orderHelper.setRefundStatus(order, REFUND_STATUS.REFUNDED);
            });
        } else if (amountRefunded !== paymentResult.amount.value
            && orderHelper.getRefundStatus(order).value !== REFUND_STATUS.PARTREFUNDED) {
            Transaction.wrap(function () {
                orderHelper.setRefundStatus(order, REFUND_STATUS.PARTREFUNDED);
            });
        }
    }
}

module.exports = {
    getPaymentDescription: getPaymentDescription,
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
    getIssuerData: getIssuerData,
    setIssuerData: setIssuerData,
    setPaymentStatus: setPaymentStatus,
    getPaymentStatus: getPaymentStatus,
    setOrderId: setOrderId,
    getOrderId: getOrderId,
    setOrderStatus: setOrderStatus,
    getOrderStatus: getOrderStatus,
    setUsedTransactionAPI: setUsedTransactionAPI,
    getUsedTransactionAPI: getUsedTransactionAPI,
    setRefundStatus: setRefundStatus,
    getRefundStatus: getRefundStatus,
    checkMollieRefundStatus: checkMollieRefundStatus
};
