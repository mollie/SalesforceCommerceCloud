/* global ApplePaySession */

'use strict';

// const applePayButton = '.js-apple-pay-button';
const applePayContent = '.js-apple-pay-content';

/**
 * Check if browser supports Apple Pay
 */
function checkApplePaySupport() {
    if (window.ApplePaySession && window.ApplePaySession.canMakePayments()) {
        $(applePayContent).removeClass('d-none');
    }
}

/*
function onClickApplePay() {
    $(document).on('click', applePayButton, function () {

        var request = {};
        var session = new ApplePaySession(9, request);

        var url = $(this).attr('data-continue-url');
        session.onvalidatemerchant = function (event) {
            $.ajax({
                url: url,
                type: 'post',
                dataType: 'json',
                data: JSON.stringify({ validationURL: event.validationURL }),
                success: function (data) {
                    session.completeMerchantValidation(data.paymentSession);
                },
                error: function (err) {
                    console.log(JSON.stringify(err));
                }
            });
        };

        session.begin();
    });
}
*/

/**
 * Initialize Apple Pay functions
 */
function init() {
    checkApplePaySupport();
    // onClickApplePay();
}

module.exports = {
    init: init,
    checkApplePaySupport: checkApplePaySupport
};