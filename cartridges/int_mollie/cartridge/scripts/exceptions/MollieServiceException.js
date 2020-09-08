var convertToMollieServiceExceptionStackTrace = function (stackTrace) {
    return ('' + stackTrace).replace(/^Error/, 'MollieServiceException');
};

/**
 *
 * @class MollieServiceException
 * @param {string} message - Error message
 * @param {string|Object} [errorDetail] - Detail on an error (string or object)
 */
function MollieServiceException(message, errorDetail) {
    this.message = message;
    this.errorDetail = errorDetail || null;
    this.name = 'MollieServiceException';
    this.stack = convertToMollieServiceExceptionStackTrace(new Error().stack);
}

MollieServiceException.prototype = Object.create(Error.prototype);

MollieServiceException.from = function (error) {
    var exception = new MollieServiceException(error.message, error.errorDetail);
    if (error.stack) {
        exception.stack = convertToMollieServiceExceptionStackTrace(error.stack);
    }
    return exception;
};

module.exports = MollieServiceException;
