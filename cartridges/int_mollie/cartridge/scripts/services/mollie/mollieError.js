/**
 *
 * @class
 * @param {Object} mollieErrorExtraDetails - Mollie extra Error details Object
 */
function ErrorExtraDetails(mollieErrorExtraDetails) {
    var extra = mollieErrorExtraDetails || {};
    this.failureReason = extra.failureReason;
    this.failureMessage = extra.failureMessage;
}

/**
 *
 * @class
 * @param {Object} mollieError - Mollie Error Object
 */
function Error(mollieError) {
    var error = mollieError || {};
    this.title = error.title;
    this.status = error.status;
    this.detail = error.detail;
    this.field = error.field;
    this.extra = error.extra ? new ErrorExtraDetails(error.extra) : null;
}

module.exports = Error;
