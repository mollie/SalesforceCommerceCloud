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
        description: "Order: " + params.orderId,
        redirectUrl: URLUtils.https('Payment-Redirect', 'id', params.orderId).toString(),
        webhookUrl: URLUtils.https('Payment-Hook').toString(),
        locale: request.getLocale(),
        method: params.methodId,
    };
}

/**
 *
 *
 * @param {Object} result - Mollie Service Response
 * @returns {Object} response
 */
function responseMapper(result) {
    Logger.debug('MOLLIE :: CreatePayment: ' + JSON.stringify(result));
    if (!result || typeof result === 'string') {
        return {
            payment: new mollieEntities.Payment(),
            raw: result || null
        };
    }
    return {
        payment: new mollieEntities.Payment(result),
        raw: JSON.stringify(result)
    };
}

exports.payloadBuilder = payloadBuilder;
exports.responseMapper = responseMapper;
