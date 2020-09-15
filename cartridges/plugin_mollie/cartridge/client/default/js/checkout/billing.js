'use strict';

var components = require('./components');
var applePay = require('./applePay');
var billing = require('base/checkout/billing');

/**
 * Updates the payment information in checkout, based on the supplied order model
 * @param {Object} data - data returned from controller
 */
function updatePaymentInformation(data) {
    if (data.paymentSummaryTemplate) {
        $('.js-payment-details').html(data.paymentSummaryTemplate);
    }
}

/**
 * Updates the payment options based on the supplied rendered template response
 * @param {Object} data - data returned from controller
 */
function updatePaymentOptions(data) {
    const $mollieComponentsContainer = '.js-mollie-components-container';
    if (data.paymentOptionsTemplate) {
        if ($($mollieComponentsContainer).length) {
            components.unmountMollieComponents();
        }
        $('.js-payment-options').replaceWith(data.paymentOptionsTemplate);
        billing.addNewPaymentInstrument();
        billing.cancelNewPayment();
        billing.paymentTabs();
        applePay.checkApplePaySupport();
        if ($($mollieComponentsContainer).length) {
            components.mountMollieComponents();
            components.initEventListeners();
        }
    }
}

/**
 * Handles billing country change
 */
function onBillingCountryChange() {
    $(document).on('change', '.billingCountry, #billingAddressSelector', function () {
        var billingAddressForm = $('#dwfrm_billing .billing-address-block :input').serialize();
        $('body').trigger('checkout:disableButton', '.next-step-button button');
        $.ajax({
            url: $('.js-payment-options').attr('data-method-url'),
            method: 'POST',
            data: billingAddressForm,
            success: function (data) {
                $('body').trigger('checkout:enableButton', '.next-step-button button');
                updatePaymentOptions(data);
            },
            error: function () {
                $('body').trigger('checkout:enableButton', '.next-step-button button');
            }
        });
    });
}

/**
 * Init billing functions
 */
function init() {
    onBillingCountryChange();
}

module.exports = {
    init: init,
    updatePaymentOptions: updatePaymentOptions,
    methods: {
        updatePaymentInformation: updatePaymentInformation
    }
};
