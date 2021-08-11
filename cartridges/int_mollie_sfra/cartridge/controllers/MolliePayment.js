'use strict';

var server = require('server');
var paymentService = require('*/cartridge/scripts/payment/paymentService');
var OrderMgr = require('dw/order/OrderMgr');
var MollieServiceException = require('*/cartridge/scripts/exceptions/MollieServiceException');
var URLUtils = require('dw/web/URLUtils');
var Resource = require('dw/web/Resource');

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
        res.render('mollieRedirectTemplate', {
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
        if (orderId && orderToken) {
            var order = orderId && OrderMgr.getOrder(orderId, orderToken);
            if (order) {
                var url = paymentService.processPaymentUpdate(order);
                res.redirect(url);
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
    var qrCodeSrc = req.querystring.src;
    var qrCodeWidth = req.querystring.w;
    var qrCodeHeight = req.querystring.h;

    var orderId = req.querystring.orderId;
    var orderToken = req.querystring.orderToken;

    if (qrCodeSrc && qrCodeHeight && qrCodeWidth) {
        res.render('mollieQrCodeTemplate', {
            qrCodeSrc: qrCodeSrc,
            qrCodeHeight: qrCodeHeight,
            qrCodeWidth: qrCodeWidth,
            orderId: orderId,
            orderToken: orderToken
        });
    } else {
        res.redirect(URLUtils.home().toString());
    }


    return next();
});

/**
 * MolliePayment-RedirectQRCode : Render the QR code passing the correct parameters.
 * @name Mollie/MolliePayment-Redirect
 * @function
 * @memberof MolliePayment
 * @param {middleware} - server.middleware.https
 * @param {serverfunction} - get
 */
server.get('RedirectQRCodeSuccess', server.middleware.https, function (req, res, next) {
    var orderId = req.querystring.orderId;

    if (orderId) {
        res.render('mollieQrCodeRedirect', {
            orderId: orderId
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
    var Order = require('dw/order/Order');

    var orderId = req.session.privacyCache.get('orderId');
    var order = orderId && OrderMgr.getOrder(orderId);
    var orderToken = order.getOrderToken();

    // TODO: Check if MolliePaymentStatus is populated before hook. React accordingly on that status

    if (order.getPaymentStatus().getValue() === Order.PAYMENT_STATUS_PAID) {
        res.json({
            paidStatus: true,
            continueUrl: URLUtils.https('MolliePayment-Redirect', 'orderId', orderId, 'orderToken', orderToken).toString()
        });
    } else {
        res.json({
            paidStatus: false
        });
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
                paymentService.processPaymentUpdate(order, statusUpdateId);
                res.json({ success: true });
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

module.exports = server.exports();
