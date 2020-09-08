'use strict';

/**
 * Check if browser supports Apple Pay
 */
function checkApplePaySupport() {
    if (window.ApplePaySession && window.ApplePaySession.canMakePayments()) {
        $('.js-apple-pay-button').removeClass('d-none');
    }
}

/**
 * Initialize Apple Pay functions
 */
function init() {
    checkApplePaySupport();
}

module.exports = {
    init: init,
    checkApplePaySupport: checkApplePaySupport
};
