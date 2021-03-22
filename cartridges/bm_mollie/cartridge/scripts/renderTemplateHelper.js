var ISML = require('dw/template/ISML');
var Logger = require('*/cartridge/scripts/utils/logger');
var base = require('*/cartridge/scripts/utils/superModule')(module);

/**
 * Renders the given template with the passed viewParams
 * @param {string} templateName - name of template
 * @param {Object} viewParams - viewParams object
 */
base.renderTemplate = function (templateName, viewParams) {
    try {
        ISML.renderTemplate(templateName, viewParams);
    } catch (e) {
        Logger.error('Error while rendering template ' + templateName);
        throw e;
    }
};

module.exports = base;
