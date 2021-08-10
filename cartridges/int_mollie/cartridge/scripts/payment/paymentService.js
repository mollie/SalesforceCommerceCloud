var Transaction = require('dw/system/Transaction');
var Resource = require('dw/web/Resource');
var MollieService = require('*/cartridge/scripts/services/mollieService');
var orderHelper = require('*/cartridge/scripts/order/orderHelper');
var config = require('*/cartridge/scripts/mollieConfig');
var MollieServiceException = require('*/cartridge/scripts/exceptions/MollieServiceException');
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
            paymentId: paymentId,
            embed: 'payments.details'
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
            orderId: orderId,
            embed: 'payments.details'
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
        var paymentDescription = orderHelper.getMappedPaymentDescription(order, paymentMethod) || Resource.msgf('order.details.description', 'mollie', null, order.orderNo);
        var paymentResult = MollieService.createPayment({
            orderId: order.orderNo,
            orderToken: order.orderToken,
            totalGrossPrice: order.getTotalGrossPrice(),
            methodId: paymentMethod.custom.molliePaymentMethodId,
            cardToken: paymentData && paymentData.cardToken,
            issuer: paymentData && paymentData.issuer,
            customerId: paymentData && paymentData.customerId,
            description: paymentDescription,
            locale: paymentData && paymentData.locale
        });

        Transaction.wrap(function () {
            var historyItem = 'PAYMENT :: Created payment with id: ' + paymentResult.payment.id;
            orderHelper.addItemToOrderHistory(order, historyItem, true);
            orderHelper.setUsedTransactionAPI(order, config.getTransactionAPI().PAYMENT);
            orderHelper.setPaymentId(order, paymentMethod.getID(), paymentResult.payment.id);
            orderHelper.setPaymentDescription(order, paymentMethod.getID(), paymentDescription);
            orderHelper.setPaymentDetails(order, paymentMethod.getID(), paymentResult.payment.details);
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
        var paymentService = require('*/cartridge/scripts/payment/paymentService');
        var url;
        if (orderHelper.isMollieOrder(order) &&
            (!statusUpdateId || orderHelper.getOrderId(order) === statusUpdateId)) {
            var getOrderResult = paymentService.getOrder(orderHelper.getOrderId(order));
            url = paymentHelper.processPaymentResult(order, getOrderResult.order).url;
        } else if (!statusUpdateId || orderHelper.getPaymentId(order) === statusUpdateId) {
            var getPaymentResult = paymentService.getPayment(orderHelper.getPaymentId(order));
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
        var paymentResult = MollieService.cancelPayment({
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
            orderToken: order.orderToken,
            productLineItems: order.getProductLineItems(),
            billingAddress: order.getBillingAddress(),
            paymentMethod: paymentMethod,
            email: order.getCustomer().getProfile() ? order.getCustomer().getProfile().getEmail() : order.getCustomerEmail(),
            totalGrossPrice: order.getTotalGrossPrice(),
            shipments: order.getShipments(),
            priceAdjustments: order.getPriceAdjustments(),
            cardToken: paymentData && paymentData.cardToken,
            issuer: paymentData && paymentData.issuer,
            customerId: paymentData && paymentData.customerId,
            orderLineCategory: paymentMethod.custom.mollieProductCategory,
            embed: 'payments.details'
        });

        Transaction.wrap(function () {
            var historyItem = 'PAYMENT :: Created order payment with id: ' + orderResult.order.id;
            orderHelper.addItemToOrderHistory(order, historyItem, true);
            orderHelper.setUsedTransactionAPI(order, config.getTransactionAPI().ORDER);
            orderHelper.setOrderId(order, orderResult.order.id);

            if (orderResult.order.payments && orderResult.order.payments[0]) {
                orderHelper.setPaymentDetails(order, paymentMethod.getID(), orderResult.order.payments[0].details);
            }
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
        var cancelResult = MollieService.cancelOrder({
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
        var cancelResult = MollieService.cancelOrderLineItem({
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
 * @param {dw.order.Basket} currentBasket - the target Basket object
 * @param {string} countryCode - the associated Site countryCode
 * @returns {Object} - result of the get methods REST call
 * @throws {MollieServiceException}
 */
function getMethods(currentBasket, countryCode) {
    try {
        return MollieService.getMethodsWithParams({
            amount: currentBasket.adjustedMerchandizeTotalGrossPrice.value.toFixed(2),
            currency: currentBasket.adjustedMerchandizeTotalGrossPrice.currencyCode,
            billingCountry: currentBasket.billingAddress ? currentBasket.billingAddress.countryCode.value : countryCode,
            orderLineCategories: orderHelper.getOrderLineCategories(currentBasket)
        });
    } catch (e) {
        if (e.name === 'PaymentProviderException') throw e;
        throw MollieServiceException.from(e);
    }
}

/**
 *
 * @param {dw.order.Order} order - order object
 * @param {objeect} lines - object containing lines
 * @returns {Object} - result of the create order refund REST call
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

/**
 * @param {string} testApiKey - testApiKey
 * @param {string} liveApiKey - liveApiKey
 * @returns {Object}  - result of getMethod calls
 * @throws {MollieServiceException}
 */
function testApiKeys(testApiKey, liveApiKey) {
    var liveResult;
    var testResult;
    try {
        liveResult = MollieService.getMethods({
            bearerToken: liveApiKey
        });
    } catch (e) {
        liveResult = {
            error: true
        };
    }

    try {
        testResult = MollieService.getMethods({
            bearerToken: testApiKey
        });
    } catch (e) {
        testResult = {
            error: true
        };
    }

    return {
        liveResult: liveResult,
        testResult: testResult
    };
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
    getMethods: getMethods,
    createPaymentRefund: createPaymentRefund,
    createOrderRefund: createOrderRefund,
    createShipment: createShipment,
    createCustomer: createCustomer,
    testApiKeys: testApiKeys
};
