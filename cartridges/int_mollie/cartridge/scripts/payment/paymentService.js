var MollieService = require('*/cartridge/scripts/services/mollieService');
var orderHelper = require('*/cartridge/scripts/order/orderHelper');
var config = require('*/cartridge/scripts/mollieConfig');
var URLUtils = require('dw/web/URLUtils');
var MollieServiceException = require('*/cartridge/scripts/exceptions/MollieServiceException');
var Transaction = require('dw/system/Transaction');
var paymentHelper = require('*/cartridge/scripts/payment/paymentHelper');

/**
 *
 * @param {string} paymentId - paymentId
 * @returns {Object} - result of the get payment REST call
 * @throws {MollieServiceException}
 */
function getPayment(paymentId) {
    try {
        return MollieService.getPayment({
            paymentId: paymentId
        });
    } catch (e) {
        if (e.name === 'PaymentProviderException') throw e;
        throw MollieServiceException.from(e);
    }
}

/**
 *
 * @param {string} orderId - orderId
 * @returns {Object} - result of the get order REST call
 * @throws {MollieServiceException}
 */
function getOrder(orderId) {
    try {
        return MollieService.getOrder({
            orderId: orderId
        });
    } catch (e) {
        if (e.name === 'PaymentProviderException') throw e;
        throw MollieServiceException.from(e);
    }
}


/**
 *
 * @param {dw.order.Order} order - Order object
 * @param {dw.order.PaymentMethod} paymentMethod - Order paymentMethod
 * @param {Object} paymentData - object containing method specific data
 * @returns {Object} - result of the create payment REST call
 * @throws {MollieServiceException}
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
        throw MollieServiceException.from(e);
    }
}

/**
 *
 * @param {dw.order.Order} order - Order object
 * @param {string} statusUpdateId - id of the order / payment to update
 * @returns {string} - Redirect url
 * @throws {MollieServiceException}
 */
function processPaymentUpdate(order, statusUpdateId) {
    try {
        var url;
        if (orderHelper.isMollieOrder(order) &&
            (!statusUpdateId || orderHelper.getOrderId(order) === statusUpdateId)) {
            var getOrderResult = getOrder(orderHelper.getOrderId(order));
            url = paymentHelper.processPaymentResult(order, getOrderResult.order).url;
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
            var getPaymentResult = getPayment(orderHelper.getPaymentId(order));
            url = paymentHelper.processPaymentResult(order, getPaymentResult.payment).url;
        }
        return url;
    } catch (e) {
        if (e.name === 'PaymentProviderException') throw e;
        throw MollieServiceException.from(e);
    }
}

/**
 *
 * @param {string} paymentId - paymentMethodId
 * @returns {Object} - result of the cancel payment REST call
 * @throws {MollieServiceException}
 */
function cancelPayment(paymentId) {
    try {
        const paymentResult = MollieService.cancelPayment({
            paymentId: paymentId
        });

        return paymentResult;
    } catch (e) {
        if (e.name === 'PaymentProviderException') throw e;
        throw MollieServiceException.from(e);
    }
}

/**
 *
 * @param {dw.order.Order} order - Order object
 * @param {dw.order.PaymentMethod} paymentMethod - Order paymentMethod
 * @param {Object} paymentData - object containing method specific data
 * @returns {Object} - result of the create order REST call
 * @throws {MollieServiceException}
 */
function createOrder(order, paymentMethod, paymentData) {
    try {
        var orderResult = MollieService.createOrder({
            orderId: order.orderNo,
            productLineItems: order.getProductLineItems(),
            billingAddress: order.getBillingAddress(),
            paymentMethod: paymentMethod,
            email: order.getCustomer().getProfile() ? order.getCustomer().getProfile().getEmail() : order.getCustomerEmail(),
            totalGrossPrice: order.getTotalGrossPrice(),
            shipments: order.getShipments(),
            priceAdjustments: order.getPriceAdjustments(),
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
        throw MollieServiceException.from(e);
    }
}

/**
 *
 * @param {dw.order.Order} order - Order object
 * @returns {Object} - result of the cancel order REST call
 * @throws {MollieServiceException}
 */
function cancelOrder(order) {
    try {
        const cancelResult = MollieService.cancelOrder({
            orderId: orderHelper.getOrderId(order)
        });

        return cancelResult;
    } catch (e) {
        if (e.name === 'PaymentProviderException') throw e;
        throw MollieServiceException.from(e);
    }
}

/**
 *
 * @param {dw.order.Order} order - Order object
 * @param {Array} lines - lines to cancel
 * @returns {Object}  - result of the cancel order line REST call
 * @throws {MollieServiceException}
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
        throw MollieServiceException.from(e);
    }
}

/**
 *
 * @param {Array} paymentMethods - list of payment methods
 * @param {dw.order.Basket} currentBasket - the target Basket object
 * @param {string} countryCode - the associated Site countryCode
 * @returns {Array} - List of applicable payment methods
 * @throws {MollieServiceException}
 */
function getApplicablePaymentMethods(paymentMethods, currentBasket, countryCode) {
    try {
        var methodResult = MollieService.getMethods({
            amount: currentBasket.adjustedMerchandizeTotalGrossPrice.value,
            currency: currentBasket.adjustedMerchandizeTotalGrossPrice.currencyCode,
            resource: config.getEnabledTransactionAPI().value === config.getTransactionAPI().PAYMENT ? 'payments' : 'orders',
            billingCountry: currentBasket.billingAddress ? currentBasket.billingAddress.countryCode.value : countryCode
        });

        var methods = [];
        paymentMethods.toArray().forEach(function (method) {
            var molliePaymentMethod = methodResult.methods.filter(function (mollieMethod) {
                return mollieMethod.id === method.custom.molliePaymentMethodId;
            })[0];

            if (molliePaymentMethod || !method.custom.molliePaymentMethodId) {
                methods.push({
                    ID: method.ID,
                    name: method.name,
                    image: (method.image) ? method.image.URL.toString() :
                        (molliePaymentMethod && molliePaymentMethod.imageURL) || URLUtils.staticURL('./images/mollieMethodImage.png'),
                    issuers: molliePaymentMethod && molliePaymentMethod.issuers
                });
            }
        });
        return methods;
    } catch (e) {
        if (e.name === 'PaymentProviderException') throw e;
        throw MollieServiceException.from(e);
    }
}

/**
 *
 * @param {dw.order.Order} order - order object
 * @param {objeect} lines - object containing lines
 * @returns {Object}  - result of the create order refund REST call
 * @throws {MollieServiceException}
 */
function createOrderRefund(order, lines) {
    try {
        return MollieService.createOrderRefund({
            orderId: orderHelper.getOrderId(order),
            lines: lines || []
        });
    } catch (e) {
        if (e.name === 'PaymentProviderException') throw e;
        throw MollieServiceException.from(e);
    }
}

/**
 *
 * @param {string} paymentId - payment id
 * @param {number} amount - amount to refund
 * @returns {Object}  - result of the create payment refund REST call
 * @throws {MollieServiceException}
 */
function createPaymentRefund(paymentId, amount) {
    try {
        return MollieService.createPaymentRefund({
            paymentId: paymentId,
            amount: amount
        });
    } catch (e) {
        if (e.name === 'PaymentProviderException') throw e;
        throw MollieServiceException.from(e);
    }
}

/**
 *
 * @param {orderId} order - Order object
 * @param {objet} lines - lines
 * @returns {Object}  - result of the create shipment REST call
 * @throws {MollieServiceException}
 */
function createShipment(order, lines) {
    try {
        return MollieService.createShipment({
            orderId: orderHelper.getOrderId(order),
            lines: lines || []
        });
    } catch (e) {
        if (e.name === 'PaymentProviderException') throw e;
        throw MollieServiceException.from(e);
    }
}

/**
 *
 * @param {dw.customer.Profile} profile - Profile object
 * @returns {Object}  - result of the create customer REST call
 * @throws {MollieServiceException}
 */
function createCustomer(profile) {
    try {
        return MollieService.createCustomer({
            profile: profile
        });
    } catch (e) {
        if (e.name === 'PaymentProviderException') throw e;
        throw MollieServiceException.from(e);
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
};
