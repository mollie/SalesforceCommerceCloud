module.exports = {
    checkApplePaySupport: function () {
        if (window.ApplePaySession && window.ApplePaySession.canMakePayments()) {
            $('.js-apple-pay-button').removeClass('d-none');
        }
    }
}