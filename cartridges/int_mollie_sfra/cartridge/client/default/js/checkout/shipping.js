'use strict';

var base = require('base/checkout/shipping');
var billing = require('./billing');

/**
* Handle response from the server for valid or invalid form fields.
* @param {Object} defer - the deferred object which will resolve on success or reject.
* @param {Object} data - the response data with the invalid form fields or
*  valid model data.
*/
function shippingFormResponse(defer, data) {
    base.methods.shippingFormResponse(defer, data);
    billing.updatePaymentOptions(data);
}

module.exports = {
    methods: {
        shippingFormResponse: shippingFormResponse
    }
};
