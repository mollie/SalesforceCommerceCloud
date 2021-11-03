var convertToMollieServiceExceptionStackTrace = function (error) {
    Error.captureStackTrace(error);
    return ('' + error.stack).replace(/^Error/, 'MollieServiceException');
};

/**
 *
 * @class MollieServiceException
 * @param {string} message - Error message
 * @param {string|Object} [errorDetail] - Detail on an error (string or object)
 */
function MollieServiceException(message, errorDetail) {
    var error = new Error();
    this.message = message;
    this.errorDetail = errorDetail || null;
    this.name = 'MollieServiceException';
    this.stack = convertToMollieServiceExceptionStackTrace(error);
}

MollieServiceException.prototype = Object.create(Error.prototype);

MollieServiceException.from = function (error) {
    var exception = new MollieServiceException(error.message, error.errorDetail);
    if (error.stack) {
        exception.stack = convertToMollieServiceExceptionStackTrace(error);
    }
    return exception;
};

module.exports = MollieServiceException;
