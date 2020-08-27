'use strict';

/**
 * Updates the payment information in checkout, based on the supplied order model
 * @param {Object} order - checkout model to use as basis of new truth
 */
function updatePaymentInformation(order) {
    // update payment details
    var $paymentSummary = $('.payment-details');
    var htmlToAppend = '';

    if (order.billing.payment && order.billing.payment.selectedPaymentInstruments &&
        order.billing.payment.selectedPaymentInstruments.length > 0) {
        htmlToAppend += '<span>' +
            order.billing.payment.selectedPaymentInstruments[0].paymentMethod +
            '</span>';
    }

    $paymentSummary.empty().append(htmlToAppend);
}

module.exports = {
    methods: {
        updatePaymentInformation: updatePaymentInformation
    }
};
