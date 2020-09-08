var ISML = require('dw/template/ISML');
var Logger = require('*/cartridge/scripts/utils/logger');

/**
 * Renders the given template with the passed viewParams
 * @param {string} templateName - name of template
 * @param {Object} viewParams - viewParams object
 */
function renderTemplate(templateName, viewParams) {
    try {
        ISML.renderTemplate(templateName, viewParams);
    } catch (e) {
        Logger.error('Error while rendering template ' + templateName);
        throw e;
    }
}

module.exports = {
    renderTemplate: renderTemplate
};
