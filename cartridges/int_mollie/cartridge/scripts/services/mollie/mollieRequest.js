/**
 *
 * @class
 * @param {Object} payload - request payload
 */
function MollieRequest(payload) {
    this.payload = payload;
    this.toString = function () {
        return JSON.stringify(this.payload);
    };
}

module.exports = MollieRequest;
