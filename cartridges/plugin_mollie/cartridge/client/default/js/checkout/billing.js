'use strict';

var components = require('./components');
var applePay = require('./applePay');
var billing = require('base/checkout/billing');

const RETURNING_CUSTOMER = '.js-returning-customer';

/**
 * Updates the payment information in checkout, based on the supplied order model
 * @param {Object} data - data returned from controller
 */
function updatePaymentInformation(data) {
    if (data.order.paymentSummaryTemplate) {
        $('.js-payment-details').html(data.order.paymentSummaryTemplate);
    }
}

/**
 * On click 'Add payment'
 */
function addNewPaymentInstrument() {
    billing.addNewPaymentInstrument();
    $('.btn.add-payment').on('click', function (e) {
        $(RETURNING_CUSTOMER).val(false);
    });
}

/**
 * On click 'Back to saved payment'
 */
function cancelNewPayment() {
    billing.cancelNewPayment();
    $('.cancel-new-payment').on('click', function (e) {
        $(RETURNING_CUSTOMER).val(true);
    });
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
        addNewPaymentInstrument();
        cancelNewPayment();
        billing.paymentTabs();
        billing.handleCreditCardNumber();
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
    addNewPaymentInstrument();
    cancelNewPayment();
}

module.exports = {
    init: init,
    updatePaymentOptions: updatePaymentOptions,
    addNewPaymentInstrument: addNewPaymentInstrument,
    cancelNewPayment: cancelNewPayment,
    methods: {
        updatePaymentInformation: updatePaymentInformation
    }
};
