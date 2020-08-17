var URLUtils = require('dw/web/URLUtils');
var Logger = require('*/cartridge/scripts/utils/logger');
var mollieEntities = require('*/cartridge/scripts/services/mollie/mollieEntities');
var sfccEntities = require('*/cartridge/scripts/services/mollie/sfccEntities');

/**
 *
 *
 * @param {Object} params - params object
 * @returns {Object} payload - returns payload
 */
function payloadBuilder(params) {
    return {
        amount: new sfccEntities.Currency(params.totalGrossPrice),
        orderNumber: params.orderId,
        locale: request.getLocale(),
        redirectUrl: URLUtils.https('Payment-Redirect', 'id', params.orderId).toString(),
        webhookUrl: URLUtils.https('Payment-Hook').toString(),
        methodId: params.methodId,
        lines: params.productLineItems.toArray().map(function (productLineItem) {
            return new sfccEntities.ProductLineItem(productLineItem);
        }),
        billingAddress: new sfccEntities.Address(params.billingAddress, params.profile),
    };
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
