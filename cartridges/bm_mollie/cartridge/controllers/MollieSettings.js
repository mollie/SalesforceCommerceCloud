var Site = require('dw/system/Site');
var Transaction = require('dw/system/Transaction');
var renderTemplateHelper = require('*/cartridge/scripts/renderTemplateHelper');
var collections = require('*/cartridge/scripts/util/collections');
var paymentService = require('*/cartridge/scripts/payment/paymentService');
var config = require('*/cartridge/scripts/mollieConfig');

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
 * Render JSON as an output
 * @param {Object} data - Object to be turned into JSON
 * @param {Object} response - Response object
 * @returns {void}
 */
function json(data, response) {
    response.setContentType('application/json');
    response.writer.print(JSON.stringify(data, null, 2));
    response.setStatus(200);
}

function getMappedPreferences(preferences, molliePreferences) {
    var fieldSettings = JSON.parse(config.getCustomPageFieldSettings());
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

function getMappedPreferenceForPrefGroup(prefGroup, preferences) {
    var preferencesMeta = preferences.describe();
    var molliePreferenceGroup = collections.find(preferencesMeta.attributeGroups, function (attributeGroup) {
        return attributeGroup.ID === prefGroup.value;
    });

    return getMappedPreferences(preferences, molliePreferenceGroup.attributeDefinitions);
}

exports.Start = function () {
    var prefGroup = request.httpParameterMap.get('pref_group');
    var preferences = Site.getCurrent().getPreferences();

    renderTemplateHelper.renderTemplate('preferences/preferences_wrapper', {
        preferences: getMappedPreferenceForPrefGroup(prefGroup, preferences)
    });
};

exports.SavePreferences = function () {
    try {
        var preferences = Site.getCurrent().getPreferences();
        var paramNames = request.httpParameterMap.parameterNames;

        collections.forEach(paramNames, function (paramName) {
            var param = request.httpParameterMap.get(paramName);
            var paramValue = param.empty ? false : param.booleanValue || param.dateValue || param.doubleValue || param.intValue || param.value;
            if (paramValue !== (preferences.custom[paramName].value || preferences.custom[paramName])) {
                Transaction.wrap(function () {
                    preferences.custom[paramName] = paramValue;
                });
            }
        });

        json({
            error: false
        }, response);
    } catch (e) {
        json({
            error: true
        }, response);
    }
};

exports.TestApiKeyey = function () {
    var testApiKey = request.httpParameterMap.get('testApiKey');
    var liveApiKey = request.httpParameterMap.get('liveApiKey');

    var testApiKeysResult = paymentService.testApiKeys(testApiKey, liveApiKey);

    return json({
        resultTemplate: renderTemplateHelper.getRenderedHtml({
            testApiKeysResult: testApiKeysResult
        }, 'preferences/testApiKeyResult')
    }, response);
};

exports.Start.public = true;
exports.SavePreferences.public = true;
exports.TestApiKeyey.public = true;
