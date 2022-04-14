var Status = require('dw/system/Status');
var PaymentMgr = require('dw/order/PaymentMgr');
var config = require('*/cartridge/scripts/mollieConfig');

/**
 * Update the getRequest hook so merchantName, countryCode, merchantCapabilities,
 * supportedNetworks, requiredShippingContactFields and requiredBillingContactFields
 * are using the correct data
 * @param {dw.order.Basket} basket - The basket for the Apple Pay request
 * @param {Object} request - The Apple Pay payment request object
 */
exports.getRequest = function (basket, request) {
    session.custom.applepaysession = true;   // eslint-disable-line

    request.merchantName = config.getApplePayDirectMerchantName(); // eslint-disable-line
    request.countryCode = config.getApplePayDirectCountryCode(); // eslint-disable-line

    request.merchantCapabilities = config.getApplePayDirectMerchantCapabilities().map(function (merchantCapability) { // eslint-disable-line
        return merchantCapability.getValue();
    });
    request.supportedNetworks = config.getApplePayDirectSupportedNetworks().map(function (supportedNetwork) { // eslint-disable-line
        return supportedNetwork.getValue();
    });
    request.requiredShippingContactFields = config.getApplePayDirectRequiredShippingContactFields().map(function (requiredShippingContactField) { // eslint-disable-line
        return requiredShippingContactField.getValue();
    });
    request.requiredBillingContactFields = config.getApplePayDirectRequiredBillingContactFields().map(function (requiredBillingContactField) { // eslint-disable-line
        return requiredBillingContactField.getValue();
    });
};

/**
 * Update the authorizeOrderPayment hook to authorize the apple pay payment
 * @param {dw.order.Order} order - The order paid using Apple Pay
 * @param {Object} event - ApplePayPaymentAuthorizedEvent object
 * @returns {dw.extensions.applepay.ApplePayHookResult} status - a non-null status ends the hook execution
 */
exports.authorizeOrderPayment = function (order, event) {
    var Resource = require('dw/web/Resource');
    var HookMgr = require('dw/system/HookMgr');
    var checkoutHelpers = require('*/cartridge/scripts/checkout/checkoutHelpers');

    var mollieApplePayMethodID = config.getApplePayDirectPaymentMethodId();
    var processor = PaymentMgr.getPaymentMethod(mollieApplePayMethodID).getPaymentProcessor();

    // check to make sure there is a payment processor
    if (!processor) {
        throw new Error(Resource.msg(
            'error.payment.processor.missing',
            'checkout',
            null
        ));
    }

    var authResult;
    if (HookMgr.hasHook('app.payment.processor.' + processor.ID.toLowerCase())) {
        authResult = HookMgr.callHook('app.payment.processor.' + processor.ID.toLowerCase(),
            'Handle',
            order,
            event
        );
    } else {
        authResult = HookMgr.callHook('app.payment.processor.default', 'Handle');
    }

    if (authResult.error) {
        return new Status(Status.ERROR);
    }

    var handleResult = checkoutHelpers.handlePayments(order, order.orderNo);

    if (handleResult.error) {
        return new Status(Status.ERROR);
    }

    return new Status(Status.OK);
};

/**
 * Update the placeOrder hook to have the user redirected to the Order Confirm Page
 * @param {dw.order.Order} order - The order paid using Apple Pay
 * @param {Object} event - ApplePayPaymentAuthorizedEvent object
 * @returns {dw.extensions.applepay.ApplePayHookResult} status - a non-null status ends the hook execution
 */
exports.placeOrder = function (order) {
    var URLUtils = require('dw/web/URLUtils');
    var ApplePayHookResult = require('dw/extensions/applepay/ApplePayHookResult');
    var url = URLUtils.url('Order-Confirm', 'orderID', order.orderNo, 'orderToken', order.getOrderToken());
    return new ApplePayHookResult(new Status(Status.OK), url);
};
