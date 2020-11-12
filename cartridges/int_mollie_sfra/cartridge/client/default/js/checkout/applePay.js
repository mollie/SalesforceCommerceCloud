'use strict';

const applePayContent = '.js-apple-pay-content';

/**
 * Check if browser supports Apple Pay
 */
function checkApplePaySupport() {
    if (window.ApplePaySession && window.ApplePaySession.canMakePayments()) {
        $(applePayContent).removeClass('d-none');
    }
}

/**
 * Initialize Apple Pay functions
 */
function init() {
    checkApplePaySupport();
}

module.exports = {
    init: init
};
