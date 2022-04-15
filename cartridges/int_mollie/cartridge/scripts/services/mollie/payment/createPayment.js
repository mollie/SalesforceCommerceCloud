var URLUtils = require('dw/web/URLUtils');
var Logger = require('*/cartridge/scripts/utils/logger');
var mollieResponseEntities = require('*/cartridge/scripts/services/mollie/mollieResponseEntities');
var mollieRequestEntities = require('*/cartridge/scripts/services/mollie/mollieRequestEntities');

/**
 *
 *
 * @param {Object} params - params object
 * @returns {Object} payload - returns payload
 */
function payloadBuilder(params) {
    var payload = {
        amount: new mollieRequestEntities.Currency(params.totalGrossPrice),
        description: params.description,
        redirectUrl: URLUtils.https('MolliePayment-Redirect', 'orderId', params.orderId, 'orderToken', params.orderToken).toString(),
        webhookUrl: URLUtils.https('MolliePayment-Hook', 'orderId', params.orderId, 'orderToken', params.orderToken).toString(),
        locale: params.locale || request.getLocale(),
        method: params.methodId
    };

    if (params.cardToken) {
        payload.cardToken = params.cardToken;
    }
    if (params.applePayPaymentToken) {
        payload.applePayPaymentToken = JSON.stringify(params.applePayPaymentToken);
    }
    if (params.issuer) {
        payload.issuer = params.issuer;
    }
    if (params.customerId) {
        payload.customerId = params.customerId;
    }


    return payload;
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
            payment: new mollieResponseEntities.Payment(),
            raw: result || null
        };
    }
    return {
        payment: new mollieResponseEntities.Payment(result),
        raw: JSON.stringify(result)
    };
}

exports.payloadBuilder = payloadBuilder;
exports.responseMapper = responseMapper;
