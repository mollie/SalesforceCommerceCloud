'use strict';

var orderHelper = require('*/cartridge/scripts/order/orderHelper');

var base = module.superModule;

/**
 * Order class that represents the current order
 * @param {dw.order.LineItemCtnr} lineItemContainer - Current users's basket/order
 * @param {Object} options - The current order's line items
 * @param {Object} options.config - Object to help configure the orderModel
 * @param {string} options.config.numberOfLineItems - helps determine the number of lineitems needed
 * @param {string} options.countryCode - the current request country code
 * @constructor
 */
function OrderModel(lineItemContainer, options) {
    base.apply(this, [lineItemContainer, options]);

    // Contains info like payment reference
    this.paymentDetails = orderHelper.getPaymentDetails(lineItemContainer);
}

module.exports = OrderModel;
