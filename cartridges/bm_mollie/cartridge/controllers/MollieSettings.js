var Site = require('dw/system/Site');
var Transaction = require('dw/system/Transaction');
var renderTemplateHelper = require('*/cartridge/scripts/renderTemplateHelper');
var collections = require('*/cartridge/scripts/util/collections');
var paymentService = require('*/cartridge/scripts/payment/paymentService');
var config = require('*/cartridge/scripts/mollieConfig');
var server = require('server');
var csrfProtection = require('*/cartridge/scripts/middleware/csrf');

var valueTypeCodeMapping = {
    8: 'checkbox',
    6: 'date',
    11: 'datetime',
    12: 'email',
    31: 'select',
    33: 'select',
    5: 'text',
    9: 'number',
    2: 'number',
    13: 'password',
    10: 'number',
    3: 'text',
    4: 'text'
};

/**
 *
 * @param {string} preferences - preferences
 * @param {string} molliePreferences - preferences
 * @returns {Array}  - Array containing mapped preferences
 * @throws {MollieServiceException}
 */
function getMappedPreferences(preferences, molliePreferences) {
    var fieldSettings = config.getCustomPageFieldSettings();
    return collections.map(molliePreferences, function (preference) {
        return {
            ID: preference.ID,
            displayName: preference.displayName,
            defaultValue: preference.defaultValue,
            description: fieldSettings[preference.ID] && fieldSettings[preference.ID].description,
            mandotory: preference.mandatory,
            selectedValue: preferences.getCustom()[preference.ID],
            inputType: valueTypeCodeMapping[preference.valueTypeCode],
            values: collections.map(preference.values, function (value) {
                return {
                    displayValue: value.displayValue,
                    value: value.value
                };
            })
        };
    });
}

/**
 *
 * @param {Object} prefGroup - prefGroup
 * @param {Object} preferences - preferences
 * @returns {Array}  - Array containing mapped preferences for given preference group
 * @throws {MollieServiceException}
 */
function getMappedPreferenceForPrefGroup(prefGroup, preferences) {
    var preferencesMeta = preferences.describe();
    var molliePreferenceGroup = collections.find(preferencesMeta.attributeGroups, function (attributeGroup) {
        return attributeGroup.ID === prefGroup.value;
    });

    return getMappedPreferences(preferences, molliePreferenceGroup.attributeDefinitions);
}

server.get('Start', csrfProtection.generateToken, function (req, res, next) {
    var prefGroup = request.httpParameterMap.get('pref_group');
    var preferences = Site.getCurrent().getPreferences();

    res.render('preferences/preferences_wrapper', {
        preferences: getMappedPreferenceForPrefGroup(prefGroup, preferences)
    });
    return next();
});

server.post('SavePreferences',
    server.middleware.https,
    csrfProtection.validateAjaxRequest,
    function (req, res, next) {
        try {
            var preferences = Site.getCurrent().getPreferences();
            var paramNames = request.httpParameterMap.parameterNames;

            collections.forEach(paramNames, function (paramName) {
                var param = request.httpParameterMap.get(paramName);
                var paramValue = param.empty ? false : param.booleanValue || param.dateValue || param.doubleValue || param.intValue || param.value;
                if (paramName !== 'csrf_token' && (!preferences.custom[paramName] || (paramValue !== (preferences.custom[paramName].value || preferences.custom[paramName])))) {
                    Transaction.wrap(function () {
                        preferences.custom[paramName] = paramValue;
                    });
                }
            });

            res.json({
                error: false
            });
        } catch (e) {
            res.json({
                errorMsg: e.message,
                error: true
            });
        }
        return next();
    });

server.post('TestApiKeyey', function (req, res, next) {
    var testApiKey = request.httpParameterMap.get('testApiKey');
    var liveApiKey = request.httpParameterMap.get('liveApiKey');

    var testApiKeysResult = paymentService.testApiKeys(testApiKey, liveApiKey);

    res.json({
        resultTemplate: renderTemplateHelper.getRenderedHtml({
            testApiKeysResult: testApiKeysResult
        }, 'preferences/testApiKeyResult')
    });
    return next();
});

module.exports = server.exports();
