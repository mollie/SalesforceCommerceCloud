var MollieServiceException = require('./MollieServiceException');

var convertToPaymentProviderExceptionStackTrace = function (error) {
    return ('' + error.stack).replace(/^MollieServiceException/, 'PaymentProviderException');
};

/**
 *
 * @class PaymentProviderException
 * @param {string} message - Error message
 * @param {string|Object} [errorDetail] - Detail on an error (string or object)
 * @param {string} cardAuthError - Indicated if the error given is a credit card authorisation error
 */
function PaymentProviderException(message, errorDetail, cardAuthError) {
    MollieServiceException.call(this, message, errorDetail);
    this.name = 'PaymentProviderException';
    this.stack = convertToPaymentProviderExceptionStackTrace(this);
    this.isCardAuthError = !!cardAuthError;
}

module.exports = PaymentProviderException;
