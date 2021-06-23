'use strict';

var server = require('server');

var HookMgr = require('dw/system/HookMgr');
var OrderMgr = require('dw/order/OrderMgr');
var Order = require('dw/order/Order');
var Transaction = require('dw/system/Transaction');
var PaymentMgr = require('dw/order/PaymentMgr');
var Logger = require('*/cartridge/scripts/utils/logger');
var orderHelper = require('*/cartridge/scripts/order/orderHelper');
var paymentService = require('*/cartridge/scripts/payment/paymentService');
var MollieServiceException = require('*/cartridge/scripts/exceptions/MollieServiceException');
var csrfProtection = require('*/cartridge/scripts/middleware/csrf');

/**
 * Checks if send payment link is allowed
 * @param {dw.order.Order} order - order
 * @returns {boolean} - link is allowed?
 */
function isLinkAllowed(order) {
    if (!order) return false;
    var orderStatus = order.status.value;
    return orderStatus === Order.ORDER_STATUS_CREATED
        || orderStatus === Order.ORDER_STATUS_CANCELLED
        || orderStatus === Order.ORDER_STATUS_FAILED;
}

/**
 * Undo fail or cancel order
 * @param {dw.order.Order} order - order
 * @returns {Object} - JSON
 */
function undoFailOrCancelOrder(order) {
    if (!order) return false;
    var orderStatus = order.status.value;
    var result;
    if (orderStatus === Order.ORDER_STATUS_CANCELLED || orderStatus === Order.ORDER_STATUS_FAILED) {
        Transaction.wrap(function () {
            result = orderHelper.undoFailOrCancelOrder(order, 'PAYMENT :: Reopening order because of requesting link');
        });
    }

    return { error: result && result.isError() };
}

/**
 * Send payment link
 * @param {dw.order.Order} order - order
 * @param {string} email - email
 * @param {string} paymentLink - order
 * @return {MollieServiceException} - exception
 */
function sendPaymentLink(order, email, paymentLink) {
    var hookName = 'mollie.send.payment.link';

    if (!HookMgr.hasHook(hookName)) throw new MollieServiceException('Hook ' + hookName + ' not supported.');

    return HookMgr.callHook(
        hookName,
        'sendPaymentLink',
        order,
        email,
        paymentLink
    );
}

/**
 * CSCOrderPaymentLink-Start : Renders the payment link page
 * @name Mollie/CSCOrderPaymentLink-Start
 * @function
 * @memberof CSCOrderPaymentLink
 * @param {middleware} - csrfProtection.generateToken
 * @param {renders} - html
 * @param {serverfunction} - get
 */
server.get('Start', csrfProtection.generateToken, function (req, res, next) {
    var orderNo = request.httpParameterMap.get('order_no').stringValue;
    var order = OrderMgr.getOrder(orderNo);
    var paymentLink;
    if (!isLinkAllowed(order) || undoFailOrCancelOrder(order).error) {
        res.render('order/payment/link/order_payment_link_not_available.isml');
        return next();
    } else if (orderHelper.isMollieOrder(order)) {
        var getOrderResult = paymentService.getOrder(orderHelper.getOrderId(order));
        paymentLink = getOrderResult.order.links.checkout.href;
    } else {
        var mollieInstruments = orderHelper.getMolliePaymentInstruments(order);
        var lastMollieInstrument = mollieInstruments.pop();
        if (lastMollieInstrument) {
            var paymentMethodId = lastMollieInstrument.getPaymentMethod();
            var molliePaymentId = orderHelper.getPaymentId(order, paymentMethodId);
            var getPaymentResult;
            if (molliePaymentId) {
                getPaymentResult = paymentService.getPayment(molliePaymentId);
            }
            if (getPaymentResult && getPaymentResult.payment.links.checkout.href) {
                paymentLink = getPaymentResult.payment.links.checkout.href;
            } else {
                var paymentMethod = PaymentMgr.getPaymentMethod(paymentMethodId);
                var locale = getPaymentResult ? getPaymentResult.payment.locale : order.customerLocaleID;
                var createPaymentresult = paymentService.createPayment(order, paymentMethod, { locale: locale });
                paymentLink = createPaymentresult.payment.links.checkout.href;
            }
        }
    }
    if (paymentLink) {
        res.render('order/payment/link/order_payment_link_send.isml', {
            paymentLink: paymentLink,
            orderId: orderNo,
            email: order.customer.profile ? order.customer.profile.email : order.customerEmail
        });
    } else {
        res.render('order/payment/link/order_payment_link_not_available.isml');
    }
    return next();
});

/**
 * CSCOrderPaymentLink-SendMail : Sends email to customer
 * @name Mollie/CSCOrderPaymentLink-SendMail
 * @function
 * @memberof CSCOrderPaymentLink
 * @param {middleware} - csrfProtection.validateRequest
 * @param {renders} - html
 * @param {serverfunction} - post
 */
server.post('SendMail', csrfProtection.validateRequest, function (req, res, next) {
    var paymentLink = request.httpParameterMap.get('paymentLink').stringValue;
    var orderId = request.httpParameterMap.get('orderId').stringValue;
    var email = request.httpParameterMap.get('email').stringValue;
    var order = OrderMgr.getOrder(orderId);
    var viewParams = {
        success: true,
        orderId: orderId,
        paymentLink: paymentLink
    };

    try {
        sendPaymentLink(order, email, paymentLink);
        Logger.debug('PAYMENT :: Sending link ' + paymentLink + ' for order: ' + orderId + '.');
    } catch (e) {
        Logger.error('PAYMENT :: ERROR :: Error while sending link: ' + paymentLink + ' for order: ' + orderId + '.' + e.message);
        viewParams.success = false;
        viewParams.errorMessage = e.message;
    }

    res.render('order/payment/link/order_payment_link_confirmation.isml', viewParams);
    return next();
});

module.exports = server.exports();
