'use strict';


/**
 * Check if browser supports Apple Pay
 */
function checkApplePaySupport() {
    console.log(window.ApplePaySession, window.ApplePaySession.canMakePayments())
    if (window.ApplePaySession &&
        window.ApplePaySession.canMakePayments()) {
            $('body').addClass('apple-pay-enabled');
            $('.js-apple-pay-content').removeClass('d-none');
    }
}

module.exports = {
    checkApplePaySupport: checkApplePaySupport
};
