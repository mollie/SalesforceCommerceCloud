var Status = require('dw/system/Status');
var PaymentMgr = require('dw/order/PaymentMgr');
var config = require('*/cartridge/scripts/mollieConfig');

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
