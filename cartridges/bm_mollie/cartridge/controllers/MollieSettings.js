'use strict';

var server = require('server');

var Site = require('dw/system/Site');
var Transaction = require('dw/system/Transaction');
var collections = require('*/cartridge/scripts/util/collections');
var paymentService = require('*/cartridge/scripts/payment/paymentService');
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
    4: 'textarea'
};

/**
 * Get mapped preferences
 * @param {string} preferences - preferences
 * @param {string} molliePreferences - preferences
 * @returns {Array}  - Array containing mapped preferences
 * @throws {MollieServiceException}
 */
function getMappedPreferences(preferences, molliePreferences) {
    return collections.map(molliePreferences, function (preference) {
        var selectedValue = preferences.getCustom()[preference.ID];
        return {
            ID: preference.ID,
            displayName: preference.displayName,
            defaultValue: preference.defaultValue,
            mandatory: preference.mandatory,
            selectedValue: selectedValue,
            inputType: valueTypeCodeMapping[preference.valueTypeCode],
            multiValueType: preference.multiValueType,
            values: collections.map(preference.values, function (value) {
                var isSelected;
                if (preference.multiValueType) {
                    isSelected = selectedValue.filter(function (selectedVal) {
                        return selectedVal.value === value.value;
                    }).length > 0;
                } else {
                    isSelected = selectedValue.value === value.value;
                }
                return {
                    displayValue: value.displayValue,
                    value: value.value,
                    selected: isSelected
                };
            })
        };
    });
}

/**
 * Get mapped preferences for preference group
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

/**
 * MollieSettings-Start : Renders the Mollie preference page
 * @name Mollie/MollieSettings-Start
 * @function
 * @memberof MollieSettings
 * @param {middleware} - csrfProtection.generateToken
 * @param {renders} - html
 * @param {serverfunction} - get
 */
server.get('Start', csrfProtection.generateToken, function (req, res, next) {
    var pageTitle = request.httpParameterMap.get('page_title');
    var prefGroup = request.httpParameterMap.get('pref_group');
    var preferences = Site.getCurrent().getPreferences();

    res.render('preferences/preferences_wrapper', {
        pageTitle: pageTitle,
        prefGroup: prefGroup,
        preferences: getMappedPreferenceForPrefGroup(prefGroup, preferences)
    });
    return next();
});

/**
 * MollieSettings-SavePreferences : Handle save preferences
 * @name Mollie/MollieSettings-SavePreferences
 * @function
 * @memberof MollieSettings
 * @param {middleware} - csrfProtection.validateAjaxRequest
 * @param {renders} - html
 * @param {serverfunction} - post
 */
server.post('SavePreferences',
    server.middleware.https,
    csrfProtection.validateAjaxRequest,
    function (req, res, next) {
        try {
            var preferences = Site.getCurrent().getPreferences();
            var prefGroup = request.httpParameterMap.get('pref_group');
            var mappedPreferences = getMappedPreferenceForPrefGroup(prefGroup, preferences);
            var paramNames = request.httpParameterMap.parameterNames;

            collections.forEach(paramNames, function (paramName) {
                var mappedPreference = mappedPreferences.find(function (currentMappedPref) {
                    return currentMappedPref.ID === paramName;
                });
                if (paramName !== 'csrf_token' && paramName !== 'pref_group' && paramName !== 'page_title') {
                    var param = request.httpParameterMap.get(paramName);
                    // var preference = preferences.custom[paramName];

                    if (mappedPreference.multiValueType) {
                        var paramValues = param.stringValues || param.values;
                        if (mappedPreference !== null) {
                            Transaction.wrap(function () {
                                preferences.custom[paramName] = paramValues;
                            });
                        }
                    } else {
                        var paramValue = param.booleanValue || param.dateValue || param.doubleValue || param.intValue || param.value;
                        if (mappedPreference !== null) {
                            Transaction.wrap(function () {
                                switch (paramValue) {
                                    case 'checked':
                                        preferences.custom[paramName] = true;
                                        break;
                                    case 'unchecked':
                                        preferences.custom[paramName] = false;
                                        break;
                                    default:
                                        preferences.custom[paramName] = paramValue;
                                        break;
                                }
                            });
                        }
                    }
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

/**
 * MollieSettings-TestApiKey : Handle test api key request
 * @name Mollie/MollieSettings-TestApiKey
 * @function
 * @memberof MollieSettings
 * @param {renders} - html
 * @param {serverfunction} - post
 */
server.post('TestApiKey', function (req, res, next) {
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
