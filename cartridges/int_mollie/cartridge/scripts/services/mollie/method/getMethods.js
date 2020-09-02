var Logger = require('*/cartridge/scripts/utils/logger');
var mollieResponseEntities = require('*/cartridge/scripts/services/mollie/mollieResponseEntities');

/**
 *
 * @returns {Object} payload - returns payload
 */
function payloadBuilder() {
    return {};
}

/**
 *
 *
 * @param {Object} result - Mollie Service Response
 * @returns {Object} response
 */
function responseMapper(result) {
    Logger.debug('MOLLIE :: GetMethods: ' + JSON.stringify(result));
    if (!result || typeof result === 'string') {
        return {
            methods: [],
            raw: result || null
        };
    }
    return {
        methods: result._embedded ?
            result._embedded.methods.map(function (method) {
                return new mollieResponseEntities.Method(method);
            }) : [],
        raw: JSON.stringify(result)
    };
}

exports.payloadBuilder = payloadBuilder;
exports.responseMapper = responseMapper;
