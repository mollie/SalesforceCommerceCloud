'use strict';

var server = require('server');

var OrderMgr = require('dw/order/OrderMgr');
var Order = require('dw/order/Order');
var URLUtils = require('dw/web/URLUtils');
var Resource = require('dw/web/Resource');
var paymentService = require('*/cartridge/scripts/payment/paymentService');
var MollieServiceException = require('*/cartridge/scripts/exceptions/MollieServiceException');
var orderHelper = require('*/cartridge/scripts/order/orderHelper');

/**
 * MolliePayment-RedirectSuccess : Handling of a successful payment. Redirects to order confirmation.
 * @name Mollie/MolliePayment-RedirectSuccess
 * @function
 * @memberof MolliePayment
 * @param {serverfunction} - get
 */
server.get('RedirectSuccess', function (req, res, next) {
    var orderId = req.querystring.orderId;
    var orderToken = req.querystring.orderToken;

    if (orderId && orderToken) {
        res.render('mollie/mollieRedirectTemplate', {
            continueUrl: URLUtils.url('Order-Confirm'),
            orderId: orderId,
            orderToken: orderToken
        });
    } else {
        res.redirect(URLUtils.home().toString());
    }
    return next();
});

/**
 * MolliePayment-Redirect : Handling of a payment hook.
 * @name Mollie/MolliePayment-Redirect
 * @function
 * @memberof MolliePayment
 * @param {middleware} - server.middleware.https
 * @param {serverfunction} - get
 */
server.get('Redirect', server.middleware.https, function (req, res, next) {
    try {
        var orderId = req.querystring.orderId;
        var orderToken = req.querystring.orderToken;
        var isCheckoutDevice = req.session.privacyCache.get('isCheckoutDevice');
        if (orderId && orderToken) {
            var order = orderId && OrderMgr.getOrder(orderId, orderToken);
            if (order) {
                var paymentDetails = orderHelper.getPaymentDetails(order);
                // QR code was used for payment
                if (paymentDetails && paymentDetails.qrCode && !isCheckoutDevice) {
                    var paymentStatus = order.getPaymentStatus().getValue();
                    res.render('mollie/mollieQrCodeRedirect', {
                        paid: paymentStatus === Order.PAYMENT_STATUS_PAID,
                        orderId: orderId
                    });
                } else {
                    req.session.privacyCache.set('isCheckoutDevice', false);
                    var url = paymentService.processPaymentRedirect(order);
                    res.redirect(url);
                }
                return next();
            }
        }
        res.redirect(URLUtils.home().toString());
    } catch (e) {
        var error = e;
        if (error.name === 'PaymentProviderException') throw error;
        throw MollieServiceException.from(error);
    }

    return next();
});

/**
 * MolliePayment-RenderQRCode : Render the QR code passing the correct parameters.
 * @name Mollie/MolliePayment-RenderQRCode
 * @function
 * @memberof MolliePayment
 * @param {middleware} - server.middleware.https
 * @param {serverfunction} - get
 */
server.get('RenderQRCode', server.middleware.https, function (req, res, next) {
    var orderId = req.querystring.orderId;
    var orderToken = req.querystring.orderToken;
    var order = OrderMgr.getOrder(orderId, orderToken);
    var paymentLink = orderHelper.getPaymentLink(order);
    var paymentDetails = orderHelper.getPaymentDetails(order);
    var qrCodeObject = paymentDetails && paymentDetails.qrCode;

    var qrCodeSrc = qrCodeObject && qrCodeObject.src;
    var qrCodeWidth = qrCodeObject && qrCodeObject.width;
    var qrCodeHeight = qrCodeObject && qrCodeObject.height;

    if (qrCodeSrc && qrCodeHeight && qrCodeWidth) {
        res.render('mollie/mollieQrCodeTemplate', {
            qrCodeSrc: qrCodeSrc,
            qrCodeHeight: qrCodeHeight,
            qrCodeWidth: qrCodeWidth,
            orderId: orderId,
            orderToken: orderToken,
            paymentLink: paymentLink
        });
    } else {
        res.redirect(URLUtils.home().toString());
    }

    return next();
});

/**
 * MolliePayment-WatchQRCode : Watch the order paid status to be able to continue with the checkout. If the order is paid, redirect. Otherwise try again.
 * @name Mollie/MolliePayment-WatchQRCode
 * @function
 * @memberof MolliePayment
 * @param {middleware} - server.middleware.https
 * @param {serverfunction} - get
 */
server.get('WatchQRCode', server.middleware.https, function (req, res, next) {
    var paymentHelper = require('*/cartridge/scripts/payment/paymentHelper');

    try {
        var orderId = req.querystring.orderId;
        var orderToken = req.querystring.orderToken;
        if (orderId && orderToken) {
            var order = orderId && OrderMgr.getOrder(orderId, orderToken);
            if (order) {
                var result = paymentHelper.processQR(order);
                res.json(result);
                return next();
            }
            res.setStatusCode(404);
            res.json({ error: Resource.msg('error.order.not.found', null, 'mollie') });
        } else {
            res.setStatusCode(400);
            res.json({ error: Resource.msg('error.missing.params', null, 'mollie') });
        }
    } catch (e) {
        res.setStatusCode(500);
        res.json({ error: e.message });
    }
    return next();
});

/**
 * MolliePayment-Hook :  Handling of a payment hook. Hook for handling Mollie update status call.
 * @name Mollie/MolliePayment-Hook
 * @function
 * @memberof MolliePayment
 * @param {middleware} - server.middleware.https
 * @param {returns} - json
 * @param {serverfunction} - post
 */
server.post('Hook', server.middleware.https, function (req, res, next) {
    try {
        var orderId = req.querystring.orderId;
        var orderToken = req.querystring.orderToken;
        var statusUpdateId = req.form && req.form.id;
        if (orderId && orderToken && statusUpdateId) {
            var order = orderId && OrderMgr.getOrder(orderId, orderToken);
            if (order) {
                if ((orderHelper.isMollieOrder(order) && !empty(orderHelper.getOrderId(order))) || !empty(orderHelper.getPaymentId(order))) {
                    paymentService.processPaymentUpdate(order, statusUpdateId);
                    res.json({ success: true });
                } else {
                    res.setStatusCode(425);
                    res.json({ success: false, error: Resource.msg('error.order.incorrect.status', null, 'mollie') });
                }
            } else {
                res.setStatusCode(404);
                res.json({ success: false, error: Resource.msg('error.order.not.found', null, 'mollie') });
            }
        } else {
            res.setStatusCode(400);
            res.json({ success: false, error: Resource.msg('error.missing.params', null, 'mollie') });
        }
    } catch (e) {
        res.setStatusCode(500);
        res.json({ success: false, error: e.message });
    }

    return next();
});

/**
 * MolliePayment-ApplePayValidateMerchant : Send the apple pay merchant validation to Mollie as descibed here in the documentation (https://docs.mollie.com/wallets/applepay-direct-integration)
 * @name Mollie/MolliePayment-ApplePayValidateMerchant
 * @function
 * @memberof MolliePayment
 * @param {serverfunction} - get
 */
server.post('ApplePayValidateMerchant', function (req, res, next) {
    try {
        var body = JSON.parse(req.body);
        var merchantSession = paymentService.validateMerchant(body.validationURL, body.hostname);
        res.json({ session: merchantSession });
    } catch (e) {
        res.setStatusCode(500);
        res.json({ success: false, error: e });
    }

    return next();
});

module.exports = server.exports();
