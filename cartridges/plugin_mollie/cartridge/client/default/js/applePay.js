
const applePayButton = '.js-apple-pay-button-with-text';

function init() {
    checkApplePayStatus();
    onClickApplePay();
}

function checkApplePayStatus() {
    if (window.ApplePaySession) {
        var canMakePayments = ApplePaySession.canMakePayments();
        if (canMakePayments) {
            $(applePayButton).removeClass('d-none');
        }
    }
}

function onClickApplePay() {
    $(document).on('click', '.js-apple-pay-button-with-text', function () {
        var request = {
            countryCode: 'NL',
            currencyCode: 'EUR',
            supportedNetworks: ["amex", "maestro", "masterCard", "visa", "vPay"],
            merchantCapabilities: ['supports3DS'],
            total: { label: 'Mollie shop', amount: '35.00' },
        }
        var session = new ApplePaySession(9, request);

        var url = $(this).attr('data-continue-url');
        session.onvalidatemerchant = function (event) {
            console.log('hallo');
            $.ajax({
                url: url,
                type: 'post',
                dataType: 'json',
                data: JSON.stringify({ validationURL: event.validationURL }),
                success: function (data) {
                    session.completeMerchantValidation(result);
                },
                error: function (err) {
                    console.log(JSON.stringify(err));
                }
            });
        };

        session.begin();
    });
}

$(document).ready(function () {
    init()
});