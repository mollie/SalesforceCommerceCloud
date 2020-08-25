var MollieService = require('*/cartridge/scripts/services/mollieService');
var orderHelper = require('*/cartridge/scripts/order/orderHelper');
var config = require('*/cartridge/scripts/mollieConfig');
var sfccEntities = require('*/cartridge/scripts/services/mollie/sfccEntities');
var URLUtils = require('dw/web/URLUtils');
var ServiceException = require('*/cartridge/scripts/exceptions/ServiceException');
var Transaction = require('dw/system/Transaction');
var paymentHelper = require('*/cartridge/scripts/payment/paymentHelper');
var PaymentMgr = require('dw/order/PaymentMgr');

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
 * @param {string} cardToken - Mollie components card token
 * @returns {string} - Redirect url
 * @throws {ServiceException}
 */
function createPayment(order, paymentMethod, cardToken) {
    try {
        const paymentResult = MollieService.createPayment({
            orderId: order.orderNo,
            amount: new sfccEntities.Currency(order.getTotalGrossPrice()),
            methodId: paymentMethod.custom.molliePaymentMethodId,
            cardToken: cardToken
        });

        Transaction.wrap(function () {
            var historyItem = 'PAYMENT :: Create payment: ' + paymentResult.raw;
            orderHelper.addItemToOrderHistory(order, historyItem, true);
            orderHelper.setTransactionAPI(order, paymentMethod.getID(), config.getTransactionAPI().PAYMENT);
            orderHelper.setTransactionPaymentId(order, paymentMethod.getID(), paymentResult.payment.id);
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
 * @returns {string} - Redirect url
 * @throws {ServiceException}
 */
function getRedirectUrl(order) {
    var result = getPaymentOrOrder(order);
    return paymentHelper.processPaymentResult(order, result.payment || result.order).url
}

/**
 *
 * @param {dw.order.Order} order - Order object
 * @param {string} statusUpdateId - id of the order / payment to update
 * @returns {Object} - Redirect url
 * @throws {ServiceException}
 */
function handleStatusUpdate(order, statusUpdateId) {
    try {
        var paymentInstruments = order.getPaymentInstruments().toArray().filter(function (instrument) {
            const paymentMethodId = instrument.getPaymentMethod();
            return orderHelper.getTransactionPaymentId(order, paymentMethodId) === statusUpdateId ||
                orderHelper.getTransactionOrderId(order, paymentMethodId) === statusUpdateId
        });

        var paymentInstrument = paymentInstruments.pop();
        if (paymentInstrument) {
            result = getPaymentOrOrder(order, paymentInstrument.getPaymentMethod());
            return paymentHelper.processPaymentResult(order, result.payment || result.order).url
        }
    } catch (e) {
        if (e.name === 'PaymentProviderException') throw e;
        throw ServiceException.from(e);
    }
}

/**
 *
 * @param {string} paymentId - paymentId
 * @returns {object}  - result of the cancel payment REST call
 * @throws {ServiceException}
 */
function cancelPayment(paymentId) {
    try {
        const paymentResult = MollieService.cancelPayment({
            paymentId: paymentId,
        });

        Transaction.wrap(function () {
            var historyItem = 'PAYMENT :: Canceling payment: ' + paymentResult.raw;
            orderHelper.addItemToOrderHistory(order, historyItem, true);
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
 * @param {string} cardToken - Mollie components card token
 * @returns {string} - redirect url
 * @throws {ServiceException}
 */
function createOrder(order, paymentMethod, cardToken) {
    try {
        var orderResult = MollieService.createOrder({
            orderId: order.orderNo,
            amount: order.getTotalGrossPrice(),
            productLineItems: order.getProductLineItems(),
            billingAddress: order.getBillingAddress(),
            methodId: paymentMethod.custom.molliePaymentMethodId,
            profile: order.getCustomer().getProfile(),
            totalGrossPrice: order.getTotalGrossPrice(),
            shipments: order.getShipments(),
            cardToken: cardToken
        });

        Transaction.wrap(function () {
            var historyItem = 'PAYMENT :: Create order payment: ' + orderResult.raw;
            orderHelper.addItemToOrderHistory(order, historyItem, true);
            orderHelper.setTransactionAPI(order, paymentMethod.getID(), config.getTransactionAPI().ORDER);
            orderHelper.setTransactionOrderId(order, paymentMethod.getID(), orderResult.order.id);
        });

        return orderResult;

    } catch (e) {
        if (e.name === 'PaymentProviderException') throw e;
        throw ServiceException.from(e);
    }
}


/**
 *
 * @param {string} orderId - orderId
 * @returns {object}  - result of the cancel order REST call
 * @throws {ServiceException}
 */
function cancelOrder(orderId) {
    try {
        const cancelResult = MollieService.cancelOrder({
            orderId: orderId,
        });

        Transaction.wrap(function () {
            var historyItem = 'PAYMENT :: Canceling order payment: ' + cancelResult.raw;
            orderHelper.addItemToOrderHistory(order, historyItem, true);
        });

        return cancelResult;
    } catch (e) {
        if (e.name === 'PaymentProviderException') throw e;
        throw ServiceException.from(e);
    }
}

/**
 * Cancels the mollie payment / order
 *
 * @param {dw.order.Order} order 
 * @param {string} paymentMethodId 
 * @return {void}
 */
function cancelPaymentOrOrder(order, paymentMethodId) {
    if (orderHelper.getTransactionAPI(order, paymentMethodId) === config.getTransactionAPI().ORDER) {
        var orderId = orderHelper.getTransactionOrderId(order, paymentMethodId);
        cancelOrder(orderId);
    } else {
        var paymentId = orderHelper.getTransactionPaymentId(order, paymentMethodId);
        cancelPayment(paymentId);
    }
}

/**
 * Get the mollie payment / order
 *
 * @param {dw.order.Order} order 
 * @param {string} paymentMethodId 
 * @return {void}
 */
function getPaymentOrOrder(order, paymentMethodId) {
    if (orderHelper.getTransactionAPI(order, paymentMethodId) === config.getTransactionAPI().ORDER) {
        var orderId = orderHelper.getTransactionOrderId(order, paymentMethodId);
        return getOrder(orderId);
    } else {
        var paymentId = orderHelper.getTransactionPaymentId(order, paymentMethodId);
        return getPayment(paymentId);
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
                        mollieMethod && mollieMethod.imageURL || URLUtils.staticURL('./images/mollieMethodImage.png')
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
 * @returns {object}  - result of the refund order REST call
 * @throws {ServiceException}
 */
function createRefund(order, paymentInstrument, refundAmount) {
    Transaction.begin();

    const refund = RefundMgr.createRefund(paymentInstrument.getPaymentTransaction().getTransactionID());

    try {
        refund.setOrderId(order.orderNo);
        refund.setAmount(refundAmount);
        refund.setCurrencyCode(paymentInstrument.getPaymentTransaction().getAmount().getCurrencyCode());

        var createRefundResult;
        if (orderHelper.getTransactionAPI(order, paymentInstrument.getPaymentMethod()) === config.getTransactionAPI().ORDER) {
            createRefundResult = MollieService.createOrderRefund({
                orderId: order.orderNo,
                amount: {
                    currency: refund.getCurrencyCode(),
                    value: refund.getAmount()
                }
            });
        } else {
            createRefundResult = MollieService.createPaymentRefund({
                paymentId: order.orderNo,
                amount: {
                    currency: refund.getCurrencyCode(),
                    value: refund.getAmount()
                }
            });
        }

        if (createRefundResult.isSuccessful()) {
            refund.setDate(refundOrderResult.timestamp.getTime());
            refund.setStatus(Refund.STATUS_REFUNDED);
            var historyItem = 'PAYMENT :: Processing ' + transaction.transactionType + ' Transaction :: ' + JSON.stringify(transaction);
            orderHelper.addItemToOrderHistory(order, historyItem, true);
        } else {
            throw new PaymentProviderException('Refund failed because of following status :: ' + transaction.toStatusString());
        }
        Transaction.commit();
        return createRefundResult;
    } catch (e) {
        var error = e;

        refund.setDate(new Calendar().getTime());
        refund.setStatus(Refund.STATUS_FAILED);

        orderHelper.addItemToOrderHistory(order, error.message, true);

        Transaction.commit();

        if (error.name === 'PaymentProviderException') throw error;
        throw ServiceException.from(error);
    }
}

/**
 *
 * @param {dw.order.Order} order - Order object
* @returns {object}  - result of the create shipment REST call
 * @throws {ServiceException}
 */
function createShipment(order) {
    try {
        const shipmentResult = MollieService.createShipment({
            orderId: orderHelper.getTransactionOrderId(order, null),
        });

        Transaction.wrap(function () {
            var historyItem = 'PAYMENT :: Create order shipment: ' + shipmentResult.raw;
            orderHelper.addItemToOrderHistory(order, historyItem, true);
        });

        return shipmentResult;
    } catch (e) {
        if (e.name === 'PaymentProviderException') throw e;
        throw ServiceException.from(e);
    }
}

module.exports = {
    getPayment: getPayment,
    createPayment: createPayment,
    getRedirectUrl: getRedirectUrl,
    handleStatusUpdate: handleStatusUpdate,
    cancelPayment: cancelPayment,
    getOrder: getOrder,
    createOrder: createOrder,
    cancelOrder: cancelOrder,
    cancelPaymentOrOrder: cancelPaymentOrOrder,
    getPaymentOrOrder: getPaymentOrOrder,
    getApplicablePaymentMethods: getApplicablePaymentMethods,
    createRefund: createRefund,
    createShipment: createShipment
}
