'use strict';


/**
 * Check if browser supports Apple Pay
 */
function checkApplePaySupport() {
    if (window.ApplePaySession && window.ApplePaySession.canMakePayments()) {
        $('body').addClass('apple-pay-enabled');
        $('.js-apple-pay-content').removeClass('d-none');
    }
}

module.exports = {
    checkApplePaySupport: checkApplePaySupport
};
