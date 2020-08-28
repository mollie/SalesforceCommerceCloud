var HookMgr = require('dw/system/HookMgr');
var PaymentMgr = require('dw/order/PaymentMgr');
var BasketMgr = require('dw/order/BasketMgr');
var OrderMgr = require('dw/order/OrderMgr');
var URLUtils = require('dw/web/URLUtils');
var Transaction = require('dw/system/Transaction');
var Order = require('dw/order/Order');
var ServiceException = require('*/cartridge/scripts/exceptions/ServiceException');
var Logger = require('*/cartridge/scripts/utils/logger');
var orderHelper = require('*/cartridge/scripts/order/orderHelper');

// Require and extend
var COHelpers = require('*/cartridge/scripts/utils/superModule')(module);

/**
 * handles the payment authorization for each payment instrument
 * @param {dw.order.Order} order - the order object
 * @param {string} orderNumber - The order number for the order
 * @returns {Object} an error object
 */
COHelpers.handlePayments = function (order, orderNumber) {
    try {
        if (order.totalNetPrice.getValue() === 0) throw new ServiceException('Order has netPrice of 0');

        var paymentInstruments = order.getPaymentInstruments();

        if (paymentInstruments.length === 0) throw new ServiceException('No paymentInstruments provided');

        // DO NOT DO ANYTHING WITH OTHER PAYMENT INSTRUMENTS AT THE MOMENT
        const mollieInstruments = orderHelper.getMolliePaymentInstruments(order);

        if (mollieInstruments.length !== 1) throw new ServiceException('Expected exactly 1 Mollie Payment Instrument');

        var paymentInstrument = mollieInstruments.pop();
        var paymentMethodID = paymentInstrument.getPaymentMethod();
        var paymentProcessor = PaymentMgr.getPaymentMethod(paymentMethodID).getPaymentProcessor();
        var hookName = 'app.payment.processor.' + paymentProcessor.getID().toLowerCase();

        if (!HookMgr.hasHook(hookName)) throw new ServiceException('Hook ' + hookName + ' not supported.');

        const authorizationResult = HookMgr.callHook(
            hookName,
            'Authorize',
            orderNumber,
            paymentInstrument,
            paymentProcessor
        );

        if (authorizationResult.error) throw new ServiceException('Authorization hook failed');

        return authorizationResult;
    } catch (e) {
        Logger.debug('PAYMENT :: ERROR :: ' + e.message);
        Transaction.wrap(function () { OrderMgr.failOrder(order); });
        if (e.name === 'ServiceException') return { continueUrl: URLUtils.url('Checkout-Begin').toString() };
        return { error: true };
    }
}

/**
 *
 *
 * @param {orderNumber} orderNumber - Order Id
 * @returns {boolean} Order exists?
 */
COHelpers.orderExists = function (orderNumber) {
    return OrderMgr.getOrder(orderNumber) !== null;
}

/**
 * Restores a basket based on the last created order that has not been paid.
 * @param {string} lastOrderNumber - orderId of last order in session
 * @returns {void}
 */
COHelpers.restoreOpenOrder = function (lastOrderNumber) {
    var currentBasket = BasketMgr.getCurrentBasket();

    if (!currentBasket || currentBasket.getProductLineItems().length === 0) {
        if (lastOrderNumber) {
            var order = OrderMgr.getOrder(lastOrderNumber);
            if (order && Number(order.getStatus()) === Order.ORDER_STATUS_CREATED) {
                Transaction.wrap(function () {
                    OrderMgr.failOrder(order);
                });
            }
        }
    }
}

module.exports = COHelpers;
