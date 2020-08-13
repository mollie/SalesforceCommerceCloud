var convertToServiceExceptionStackTrace = function (stackTrace) {
    return ('' + stackTrace).replace(/^Error/, 'ServiceException');
};

/**
 *
 * @class ServiceException
 * @param {string} message - Error message
 * @param {string|Object} [errorDetail] - Detail on an error (string or object)
 */
function ServiceException(message, errorDetail) {
    this.message = message;
    this.errorDetail = errorDetail || null;
    this.name = 'ServiceException';
    this.stack = convertToServiceExceptionStackTrace(new Error().stack);
}

ServiceException.prototype = Object.create(Error.prototype);

ServiceException.from = function (error) {
    var exception = new ServiceException(error.message, error.errorDetail);
    if (error.stack) {
        exception.stack = convertToServiceExceptionStackTrace(error.stack);
    }
    return exception;
};

module.exports = ServiceException;
