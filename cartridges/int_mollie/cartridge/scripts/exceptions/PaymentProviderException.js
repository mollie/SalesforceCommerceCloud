const MollieServiceException = require('./MollieServiceException');

var convertToPaymentProviderExceptionStackTrace = function (stackTrace) {
    return ('' + stackTrace).replace(/^MollieServiceException/, 'PaymentProviderException');
};

/**
 *
 * @class PaymentProviderException
 * @param {string} message - Error message
 * @param {string|Object} [errorDetail] - Detail on an error (string or object)
 */
function PaymentProviderException(message, errorDetail) {
    MollieServiceException.call(this, message, errorDetail);
    this.name = 'PaymentProviderException';
    this.stack = convertToPaymentProviderExceptionStackTrace(this.stack);
}

module.exports = PaymentProviderException;
