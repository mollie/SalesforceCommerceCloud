var MollieService = require('*/cartridge/scripts/services/mollieService');
var orderHelper = require('*/cartridge/scripts/order/orderHelper');
var config = require('*/cartridge/scripts/mollieConfig');
var sfccEntities = require('*/cartridge/scripts/services/mollie/sfccEntities');

/**
 *
 * @param {dw.order.Order} order - Order object
 * @param {dw.order.PaymentMethod} paymentMethod - Order paymentMethod
 * @returns {string} - Redirect url
 * @throws {ServiceException}
 */
function createPayment(order, paymentMethod) {
    try {
        const paymentResult = MollieService.createPayment({
            orderId: order.orderNo,
            amount: new sfccEntities.Currency(order.getTotalGrossPrice()),
            methodId: paymentMethod.custom.molliePaymentMethodId
        });

        Transaction.wrap(function () {
            var historyItem = 'PAYMENT :: Create payment: ' + paymentResult.raw;
            orderHelper.addItemToOrderHistory(order, historyItem, true);
            orderHelper.setTransactionAPI(order, null, config.getTransactionAPI().PAYMENT);
        });

        return paymentResult.payment.links.checkout.link.href;
    } catch (e) {
        if (e.name === 'PaymentProviderException') throw e;
        throw ServiceException.from(e);
    }
}

/**
 *
 * @param {string} paymentId - paymentId
 * @returns {Object} - Redirect url
 * @throws {ServiceException}
 */
function handlePaymentUpdate(paymentId) {
    try {
        const paymentResult = MollieService.getPayment({
            paymentId: paymentId,
        });

        return paymentHelper.processPaymentResult(order, paymentResult.payment).url;
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
 * @param {dw.order.Order} order - Order object
 * @param {dw.order.PaymentMethod} paymentMethod - Order paymentMethod
 * @returns {string} - redirect url
 * @throws {ServiceException}
 */
function createOrder(order, paymentMethod) {
    try {
        const orderResult = MollieService.createPayment({
            orderId: order.orderNo,
            amount: order.getTotalGrossPrice(),
            productLineItems: order.getProductLineItems(),
            billingAddress: order.getBillingAddress(),
            methodId: paymentMethod.custom.molliePaymentMethodId,
            profile: order.getProfile(),
            totalGrossPrice: order.getTotalGrossPrice(),
        });

        Transaction.wrap(function () {
            var historyItem = 'PAYMENT :: Create order payment: ' + orderResult.raw;
            orderHelper.addItemToOrderHistory(order, historyItem, true);
            orderHelper.setTransactionAPI(order, null, config.getTransactionAPI().ORDER);
        });

        return orderResult.order.links.checkout.link.href;
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
            var historyItem = 'PAYMENT :: Canceling order payment: ' + orderResult.raw;
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
 * @return {void}
 */
function cancelPaymentOrOrder(order) {
    if (getTransactionAPI(order, null) === config.getTransactionAPI().ORDER) {
        var orderId = orderHelper.getTransactionOrderId(order, null);
        cancelOrder(orderId);
    } else {
        var paymentId = orderHelper.getTransactionPaymentId(order, null);
        cancelPayment(paymentId);
    }
}

/**
 * Get the mollie payment / order
 *
 * @param {dw.order.Order} order 
 * @return {void}
 */
function getPaymentOrOrder(order) {
    if (getTransactionAPI(order, null) === config.getTransactionAPI().ORDER) {
        var orderId = orderHelper.getTransactionOrderId(order, null);
        return getOrder(orderId);
    } else {
        var paymentId = orderHelper.getTransactionPaymentId(order, null);
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
        const methodResult = MollieService.getMethods();
        var methods = [];
        paymentMethods.toArray().forEach(function (method) {
            var mollieMethod = methodResult.methods.find(function (mollieMethod) {
                return mollieMethod.id === method.custom.molliePaymentMethodId;
            });

            if ((mollieMethod && mollieMethod.isEnabled()) || !mollieMethod) {
                methods.push({
                    ID: method.ID,
                    name: method.name,
                    image: (method.image) ? method.image.URL.toString() :
                        mollieMethod.imageURL || URLUtils.staticURL('./images/mollieMethodImage.png')
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
        if (getTransactionAPI(order, null) === config.getTransactionAPI().ORDER) {
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
    createPayment: createPayment,
    handlePaymentUpdate: handlePaymentUpdate,
    cancelPayment: cancelPayment,
    createOrder: createOrder,
    cancelOrder: cancelOrder,
    cancelPaymentOrOrder: cancelPaymentOrOrder,
    getPaymentOrOrder: getPaymentOrOrder,
    getApplicablePaymentMethods: getApplicablePaymentMethods,
    createRefund: createRefund,
    createShipment: createShipment
}
