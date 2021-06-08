'use strict';

var MollieServiceException = require('*/cartridge/scripts/exceptions/MollieServiceException');

/**
 * Returns preference
 * @param {array} preferences - array of preferences
 * @param {string} preferenceName - preference name
 * @returns {?} preference
 */
function getPreference(preferences, preferenceName) {
    var pref = preferences[preferenceName];
    if (!pref) throw new MollieServiceException('You must configure sitePreference by name ' + preferenceName + '.');
    return pref;
}

module.exports = {
    getPreference: getPreference
};
