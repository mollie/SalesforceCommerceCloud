var MollieService = require('*/cartridge/scripts/services/mollieService');
const URLUtils = require('dw/web/URLUtils');

/**
 *
 * @param {Array} paymentMethods - list of payment methods
 * @returns {Array} - List of applicable payment methods
 * @throws {ServiceException}
 */
function getApplicablePaymentMethods(paymentMethods) {
    try {
        const methodResult = MollieService.getMethods();
        var methods = [];
        paymentMethods.toArray().forEach(function (method) {
            var mollieMethod = methodResult.methods.find(function (mollieMethod) {
                return mollieMethod.id === method.id;
            });

            if ((mollieMethod && mollieMethod.isEnabled()) || !mollieMethod) {
                methods.push({
                    ID: method.ID,
                    name: method.name,
                    image: (method.image) ? method.image.URL.toString() :
                        mollieMethod.imageURL || URLUtils.staticURL('./images/mollieMethodImage.png')
                });
            }
        });
        return methods;
    } catch (e) {
        if (e.name === 'PaymentProviderException') throw e;
        throw ServiceException.from(e);
    }
}

module.exports = {
    getApplicablePaymentMethods: getApplicablePaymentMethods
}