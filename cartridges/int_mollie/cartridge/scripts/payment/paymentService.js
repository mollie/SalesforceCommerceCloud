var MollieService = require('*/cartridge/scripts/services/mollieService');
var orderHelper = require('*/cartridge/scripts/order/orderHelper');
var config = require('*/cartridge/scripts/mollieConfig');
var sfccEntities = require('*/cartridge/scripts/services/mollie/sfccEntities');
var URLUtils = require('dw/web/URLUtils');
var ServiceException = require('*/cartridge/scripts/exceptions/ServiceException');
var Transaction = require('dw/system/Transaction');
var paymentHelper = require('*/cartridge/scripts/payment/paymentHelper');
var Calendar = require('dw/util/Calendar');

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
            amount: new sfccEntities.Currency(order.getTotalGrossPrice()),
            methodId: paymentMethod.custom.molliePaymentMethodId,
            cardToken: paymentData && paymentData.cardToken,
            issuer: paymentData && paymentData.issuer
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
 * @returns {string} - Redirect url
 * @throws {ServiceException}
 */
function getRedirectUrl(order) {
    try {
        if (orderHelper.isMollieOrder(order)) {
            var result = getOrder(orderHelper.getOrderId(order));
            return paymentHelper.processPaymentResult(order, result.order).url;
        } else {
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
 * @param {string} statusUpdateId - id of the order / payment to update
 * @returns {Object} - Redirect url
 * @throws {ServiceException}
 */
function handleStatusUpdate(order, statusUpdateId) {
    try {
        if (orderHelper.isMollieOrder(order) && 
            orderHelper.getOrderId(order) === statusUpdateId) {
            var result = getOrder(statusUpdateId);
            paymentHelper.processPaymentResult(order, result.order);
        } else {
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
        }
    } catch (e) {
        if (e.name === 'PaymentProviderException') throw e;
        throw ServiceException.from(e);
    }
}

/**
 *
 * @param {dw.order.Order} order - Order object
 * @param {string} paymentMethodId - paymentMethodId
 * @returns {object}  - result of the cancel payment REST call
 * @throws {ServiceException}
 */
function cancelPayment(order, paymentMethodId) {
    try {
        const paymentResult = MollieService.cancelPayment({
            paymentId: orderHelper.getPaymentId(order, paymentMethodId)
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
 * @param {object} paymentData - object containing method specific data
 * @returns {string} - redirect url
 * @throws {ServiceException}
 */
function createOrder(order, paymentMethod, paymentData) {
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
            cardToken: paymentData && paymentData.cardToken,
            issuer: paymentData && paymentData.issuer
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
        if (orderHelper.isMollieOrder(order)) {
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
 * @param {orderId} order - Order object
 * @param {objet} lines - lines
 * @returns {object}  - result of the create shipment REST call
 * @throws {ServiceException}
 */
function createShipment(order, lines) {
    try {
        const shipmentResult = MollieService.createShipment({
            orderId: orderHelper.getOrderId(order),
            lines: lines || []
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
    getApplicablePaymentMethods: getApplicablePaymentMethods,
    createRefund: createRefund,
    createShipment: createShipment
}
