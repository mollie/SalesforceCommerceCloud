var MollieService = require('*/cartridge/scripts/services/mollieService');
var orderHelper = require('*/cartridge/scripts/order/orderHelper');
var config = require('*/cartridge/scripts/mollieConfig');
var sfccEntities = require('*/cartridge/scripts/services/mollie/sfccEntities');
var URLUtils = require('dw/web/URLUtils');
var ServiceException = require('*/cartridge/scripts/exceptions/ServiceException');
var Transaction = require('dw/system/Transaction');
var paymentHelper = require('*/cartridge/scripts/payment/paymentHelper');

/**
 *
 * @param {string} paymentId - paymentId
 * @returns {object} - Payment
 * @throws {ServiceException}
 */
function getPayment(paymentId) {
    try {
        return MollieService.getPayment({
            paymentId: paymentId
        });
    } catch (e) {
        if (e.name === 'PaymentProviderException') throw e;
        throw ServiceException.from(e);
    }
}

/**
 *
 * @param {dw.order.Order} order - Order object
 * @param {dw.order.PaymentMethod} paymentMethod - Order paymentMethod
 * @param {object} paymentData - object containing method specific data
 * @returns {string} - Redirect url
 * @throws {ServiceException}
 */
function createPayment(order, paymentMethod, paymentData) {
    try {
        const paymentResult = MollieService.createPayment({
            orderId: order.orderNo,
            totalGrossPrice: order.getTotalGrossPrice(),
            methodId: paymentMethod.custom.molliePaymentMethodId,
            cardToken: paymentData && paymentData.cardToken,
            issuer: paymentData && paymentData.issuer,
            customerId: paymentData && paymentData.customerId
        });

        Transaction.wrap(function () {
            var historyItem = 'PAYMENT :: Create payment: ' + paymentResult.raw;
            orderHelper.addItemToOrderHistory(order, historyItem, true);
            orderHelper.setUsedTransactionAPI(order, config.getTransactionAPI().PAYMENT);
            orderHelper.setPaymentId(order, paymentMethod.getID(), paymentResult.payment.id);
        });

        return paymentResult;
    } catch (e) {
        if (e.name === 'PaymentProviderException') throw e;
        throw ServiceException.from(e);
    }
}

/**
 *
 * @param {dw.order.Order} order - Order object
 * @param {string} statusUpdateId - id of the order / payment to update
 * @returns {string} - Redirect url
* @throws {ServiceException}
 */
function processPaymentUpdate(order, statusUpdateId) {
    try {
        if (orderHelper.isMollieOrder(order) &&
            (!statusUpdateId || orderHelper.getOrderId(order) === statusUpdateId)) {
            var result = getOrder(orderHelper.getOrderId(order));
            return paymentHelper.processPaymentResult(order, result.order).url;
        } else if (!statusUpdateId || orderHelper.getPaymentId(order) === statusUpdateId) {
            // Instead of searching for payment to update, get last one
            /*
            var paymentInstruments = order.getPaymentInstruments().toArray().filter(function (instrument) {
                const paymentMethodId = instrument.getPaymentMethod();
                return orderHelper.getPaymentId(order, paymentMethodId) === statusUpdateId;
            });

            var paymentInstrument = paymentInstruments.pop();
            if (paymentInstrument) {
                var paymentMethodId = paymentInstrument.getPaymentMethod();
                var result = getPayment(orderHelper.getPaymentId(order));
                paymentHelper.processPaymentResult(order, result.payment, paymentMethodId);
            }
            */
            var result = getPayment(orderHelper.getPaymentId(order));
            return paymentHelper.processPaymentResult(order, result.payment).url
        }
    } catch (e) {
        if (e.name === 'PaymentProviderException') throw e;
        throw ServiceException.from(e);
    }
}

/**
 *
 * @param {dw.order.Order} order - Order object
 * @param {string} paymentId - paymentMethodId
 * @throws {ServiceException}
 */
function cancelPayment(paymentId) {
    try {
        const paymentResult = MollieService.cancelPayment({
            paymentId: paymentId
        });

        return paymentResult;
    } catch (e) {
        if (e.name === 'PaymentProviderException') throw e;
        throw ServiceException.from(e);
    }
}

/**
 *
 * @param {string} orderId - orderId
 * @returns {object} - Order
 * @throws {ServiceException}
 */
function getOrder(orderId) {
    try {
        return MollieService.getOrder({
            orderId: orderId
        });
    } catch (e) {
        if (e.name === 'PaymentProviderException') throw e;
        throw ServiceException.from(e);
    }
}

/**
 *
 * @param {dw.order.Order} order - Order object
 * @param {dw.order.PaymentMethod} paymentMethod - Order paymentMethod
 * @param {object} paymentData - object containing method specific data
 * @returns {string} - redirect url
 * @throws {ServiceException}
 */
function createOrder(order, paymentMethod, paymentData) {
    try {
        var orderResult = MollieService.createOrder({
            orderId: order.orderNo,
            productLineItems: order.getProductLineItems(),
            billingAddress: order.getBillingAddress(),
            paymentMethod: paymentMethod,
            profile: order.getCustomer().getProfile(),
            totalGrossPrice: order.getTotalGrossPrice(),
            shipments: order.getShipments(),
            cardToken: paymentData && paymentData.cardToken,
            issuer: paymentData && paymentData.issuer,
            customerId: paymentData && paymentData.customerId
        });

        Transaction.wrap(function () {
            var historyItem = 'PAYMENT :: Create order payment: ' + orderResult.raw;
            orderHelper.addItemToOrderHistory(order, historyItem, true);
            orderHelper.setUsedTransactionAPI(order, config.getTransactionAPI().ORDER);
            orderHelper.setOrderId(order, orderResult.order.id);
        });

        return orderResult;

    } catch (e) {
        if (e.name === 'PaymentProviderException') throw e;
        throw ServiceException.from(e);
    }
}


/**
 *
 * @param {dw.order.Order} order - Order object
 * @returns {object}  - result of the cancel order REST call
 * @throws {ServiceException}
 */
function cancelOrder(order) {
    try {
        const cancelResult = MollieService.cancelOrder({
            orderId: orderHelper.getOrderId(order),
        });

        return cancelResult;
    } catch (e) {
        if (e.name === 'PaymentProviderException') throw e;
        throw ServiceException.from(e);
    }
}

/**
 *
 * @param {dw.order.Order} order - Order object
 * @returns {object}  - result of the cancel order REST call
 * @throws {ServiceException}
 */
function cancelOrderLineItem(order, lines) {
    try {
        const cancelResult = MollieService.cancelOrderLineItem({
            orderId: orderHelper.getOrderId(order),
            lines: lines || []
        });

        return cancelResult;
    } catch (e) {
        if (e.name === 'PaymentProviderException') throw e;
        throw ServiceException.from(e);
    }
}

/**
 *
 * @param {Array} paymentMethods - list of payment methods
 * @returns {Array} - List of applicable payment methods
 * @throws {ServiceException}
 */
function getApplicablePaymentMethods(paymentMethods) {
    try {
        var methodResult = MollieService.getMethods();
        var methods = [];
        paymentMethods.toArray().forEach(function (method) {
            var mollieMethod = methodResult.methods.filter(function (mollieMethod) {
                return mollieMethod.id === method.custom.molliePaymentMethodId;
            })[0];

            if ((mollieMethod && mollieMethod.isEnabled()) || !mollieMethod) {
                methods.push({
                    ID: method.ID,
                    name: method.name,
                    image: (method.image) ? method.image.URL.toString() :
                        mollieMethod && mollieMethod.imageURL || URLUtils.staticURL('./images/mollieMethodImage.png'),
                    issuers: mollieMethod && mollieMethod.issuers
                });
            }
        });
        return methods;
    } catch (e) {
        if (e.name === 'PaymentProviderException') throw e;
        throw ServiceException.from(e);
    }
}

/**
 *
 * @param {dw.order.Order} order - order object
 * @param {objeect} lines - object containing lines
 * @returns {object}  - result of the refund order REST call
 * @throws {ServiceException}
 */
function createOrderRefund(order, lines) {
    try {
        return MollieService.createOrderRefund({
            orderId: orderHelper.getOrderId(order),
            lines: lines || []
        });
    } catch (e) {
        if (error.name === 'PaymentProviderException') throw error;
        throw ServiceException.from(error);
    }
}

/**
 *
 * @param {string} paymentId - payment id
 * @param {number} amount - amount to refund
 * @returns {object}  - result of the refund order REST call
 * @throws {ServiceException}
 */
function createPaymentRefund(paymentId, amount) {
    try {
        return MollieService.createOrderRefund({
            id: paymentId,
            amount: amount
        });
    } catch (e) {
        if (error.name === 'PaymentProviderException') throw error;
        throw ServiceException.from(error);
    }
}

/**
 *
 * @param {orderId} order - Order object
 * @param {objet} lines - lines
 * @returns {object}  - result of the create shipment REST call
 * @throws {ServiceException}
 */
function createShipment(order, lines) {
    try {
        return MollieService.createShipment({
            orderId: orderHelper.getOrderId(order),
            lines: lines || []
        });
    } catch (e) {
        if (e.name === 'PaymentProviderException') throw e;
        throw ServiceException.from(e);
    }
}

/**
 *
 * @param {dw.customer.Profile} profile - Profile object
 * @returns {object}  - result of the create customer REST call
 * @throws {ServiceException}
 */
function createCustomer(profile) {
    try {
        return MollieService.createCustomer({
            profile: profile
        });
    } catch (e) {
        if (e.name === 'PaymentProviderException') throw e;
        throw ServiceException.from(e);
    }
}

module.exports = {
    getPayment: getPayment,
    createPayment: createPayment,
    processPaymentUpdate: processPaymentUpdate,
    cancelPayment: cancelPayment,
    getOrder: getOrder,
    createOrder: createOrder,
    cancelOrder: cancelOrder,
    cancelOrderLineItem: cancelOrderLineItem,
    getApplicablePaymentMethods: getApplicablePaymentMethods,
    createPaymentRefund: createPaymentRefund,
    createOrderRefund: createOrderRefund,
    createShipment: createShipment,
    createCustomer: createCustomer
}
