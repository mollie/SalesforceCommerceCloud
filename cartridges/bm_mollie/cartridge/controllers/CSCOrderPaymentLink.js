var HookMgr = require('dw/system/HookMgr');
var OrderMgr = require('dw/order/OrderMgr');
var Order = require('dw/order/Order');
var Transaction = require('dw/system/Transaction');
var Logger = require('*/cartridge/scripts/utils/logger');
var orderHelper = require('*/cartridge/scripts/order/orderHelper');
var paymentService = require('*/cartridge/scripts/payment/paymentService');
var MollieServiceException = require('*/cartridge/scripts/exceptions/MollieServiceException');
var PaymentMgr = require('dw/order/PaymentMgr');
var renderTemplate = require('*/cartridge/scripts/helpers/renderTemplateHelper').renderTemplate;

var isLinkAllowed = function (order) {
    if (!order) return false;
    var orderStatus = order.status.value;
    return orderStatus === Order.ORDER_STATUS_CREATED
        || orderStatus === Order.ORDER_STATUS_CANCELLED
        || orderStatus === Order.ORDER_STATUS_FAILED;
};

var undoFailOrCancelOrder = function (order) {
    if (!order) return false;
    var orderStatus = order.status.value;
    var result;
    if (orderStatus === Order.ORDER_STATUS_CANCELLED || orderStatus === Order.ORDER_STATUS_FAILED) {
        Transaction.wrap(function () {
            result = orderHelper.undoFailOrCancelOrder(order, 'PAYMENT :: Reopening order because of requesting link');
        });
    }

    return { error: result && result.isError() };
};

var sendPaymentLink = function (order, email, paymentLink) {
    var hookName = 'mollie.send.payment.link';

    if (!HookMgr.hasHook(hookName)) throw new MollieServiceException('Hook ' + hookName + ' not supported.');

    return HookMgr.callHook(
        hookName,
        'sendPaymentLink',
        order,
        email,
        paymentLink
    );
};

exports.Start = function () {
    var orderNo = request.httpParameterMap.get('order_no').stringValue;
    var order = OrderMgr.getOrder(orderNo);
    var paymentLink;
    if (!isLinkAllowed(order) || undoFailOrCancelOrder(order).error) {
        renderTemplate('order/payment/link/order_payment_link_not_available.isml');
        return;
    } else if (orderHelper.isMollieOrder(order)) {
        var getOrderResult = paymentService.getOrder(orderHelper.getOrderId(order));
        paymentLink = getOrderResult.order.links.checkout.href;
    } else {
        var mollieInstruments = orderHelper.getMolliePaymentInstruments(order);
        var lastMollieInstrument = mollieInstruments.pop();
        if (lastMollieInstrument) {
            var paymentMethodId = lastMollieInstrument.getPaymentMethod();
            var getPaymentResult = paymentService.getPayment(orderHelper.getPaymentId(order, paymentMethodId));
            if (getPaymentResult.payment.links.checkout.href) {
                paymentLink = getPaymentResult.payment.links.checkout.href;
            } else {
                var paymentMethod = PaymentMgr.getPaymentMethod(paymentMethodId);
                var createPaymentresult = paymentService.createPayment(order, paymentMethod);
                paymentLink = createPaymentresult.payment.links.checkout.href;
            }
        }
    }
    if (paymentLink) {
        renderTemplate('order/payment/link/order_payment_link_send.isml', {
            paymentLink: paymentLink,
            orderId: orderNo,
            email: order.customer.profile.email
        });
    } else {
        renderTemplate('order/payment/link/order_payment_link_not_available.isml');
    }
};

exports.SendMail = function () {
    var paymentLink = request.httpParameterMap.get('paymentLink').stringValue;
    var orderId = request.httpParameterMap.get('orderId').stringValue;
    var email = request.httpParameterMap.get('email').stringValue;
    var order = OrderMgr.getOrder(orderId);
    var viewParams = {
        success: true,
        orderId: orderId
    };

    try {
        sendPaymentLink(order, email, paymentLink);
        Logger.debug('PAYMENT :: Sending link ' + paymentLink + ' for order: ' + orderId + '.');
    } catch (e) {
        Logger.error('PAYMENT :: ERROR :: Error while sending link: ' + paymentLink + ' for order: ' + orderId + '.' + e.message);
        viewParams.success = false;
        viewParams.errorMessage = e.message;
    }

    renderTemplate('order/payment/shipment/order_payment_link_confirmation.isml', viewParams);
};

exports.Start.public = true;
exports.SendMail.public = true;
