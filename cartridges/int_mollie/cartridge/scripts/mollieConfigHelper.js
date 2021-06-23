'use strict';

var MollieServiceException = require('*/cartridge/scripts/exceptions/MollieServiceException');

/**
 * Returns preference
 * @param {array} preferences - array of preferences
 * @param {string} preferenceName - preference name
 * @param {boolean} throwError - throw error when site preference not exist
 * @returns {?} preference
 */
function getPreference(preferences, preferenceName, throwError) {
    var pref = preferences[preferenceName];
    if (throwError && typeof pref === 'undefined') throw new MollieServiceException('You must configure sitePreference by name ' + preferenceName + '.');
    return pref;
}

module.exports = {
    getPreference: getPreference
};
