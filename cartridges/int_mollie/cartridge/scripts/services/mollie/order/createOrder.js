var URLUtils = require('dw/web/URLUtils');
var Logger = require('*/cartridge/scripts/utils/logger');
var mollieEntities = require('*/cartridge/scripts/services/mollie/mollieEntities');
var sfccEntities = require('*/cartridge/scripts/services/mollie/sfccEntities');
var sfccEntities = require('*/cartridge/scripts/services/mollie/sfccEntities');

/**
 *
 *
 * @param {Object} params - params object
 * @returns {Object} payload - returns payload
 */
function payloadBuilder(params) {
    var test = {
        amount: new sfccEntities.Currency(params.totalGrossPrice),
        orderNumber: params.orderId,
        locale: request.getLocale(),
        redirectUrl: URLUtils.https('MolliePayment-Redirect', 'orderId', params.orderId).toString(),
        webhookUrl: URLUtils.https('MolliePayment-Hook', 'orderId', params.orderId).toString(),
        method: params.methodId,
        lines: params.productLineItems.toArray().map(function (productLineItem) {
            return new sfccEntities.ProductLineItem(productLineItem);
        }),
        billingAddress: new sfccEntities.Address(params.billingAddress, params.profile),
    };
    /*
    sku: productLineItem.getProductID(),
        name: productLineItem.getProductName(),
        quantity: productLineItem.getQuantityValue(),
        vatRate: productLineItem.getTaxRate() * 100,
        vatAmount: new Currency(productLineItem.getTax()),
        unitPrice: new Currency(productLineItem.getAdjustedGrossPrice().divide(productLineItem.getQuantityValue())),
        totalAmount: new Currency(productLineItem.getAdjustedGrossPrice()),
    */
    test.lines.push({
        name: 'shipping',
        quantity: 1,
        unitPrice: new sfccEntities.Currency(params.adjustedShippingTotalGrossPrice),
        totalAmount: new sfccEntities.Currency(params.adjustedShippingTotalGrossPrice),
        vatRate: "5",
        vatAmount: new sfccEntities.Currency(params.adjustedShippingTotalTax),
        type: 'shipping_fee'
    })
    Logger.error(this.serviceName + ' :: Service: ' + JSON.stringify(test));

    return test;
}

/**
 *
 *
 * @param {Object} result - Mollie Service Response
 * @returns {Object} response
 */
function responseMapper(result) {
    Logger.debug('MOLLIE :: CreateOrder: ' + JSON.stringify(result));
    if (!result || typeof result === 'string') {
        return {
            order: new mollieEntities.Order(),
            raw: result || null
        };
    }
    return {
        order: new mollieEntities.Order(result),
        raw: JSON.stringify(result)
    };
}

exports.payloadBuilder = payloadBuilder;
exports.responseMapper = responseMapper;
