var URLUtils = require('dw/web/URLUtils');
var Logger = require('*/cartridge/scripts/utils/logger');
var entities = require('*/cartridge/scripts/services/mollie/mollieEntities');

/**
 *
 *
 * @param {Object} params - params object
 * @returns {Object} payload - returns payload
 */
function payloadBuilder(params) {
    return {
        amount: {
            currency: params.currency,
            value: params.value
        },
        description: 'Order description',
        redirectUrl: URLUtils.https('Payment-Redirect', 'id', params.orderId).toString(),
        webhookUrl: URLUtils.https('Payment-Hook').toString(),
        locale: request.getLocale(),
        method: params.method,
        metadata: {
            orderId: params.orderId
        }
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
            payment: new entities.Payment(),
            raw: result || null
        };
    }
    return {
        payment: new entities.Payment(result),
        raw: JSON.stringify(result)
    };
}

exports.payloadBuilder = payloadBuilder;
exports.responseMapper = responseMapper;
