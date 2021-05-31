'use strict';

/**
 * Returns preference
 * @param {array} preferences - array of preferences
 * @param {string} preferenceName - preference name
 * @returns {?} preference
 */
function getPreference(preferences, preferenceName) {
    return preferences[preferenceName];
}

module.exports = {
    getPreference: getPreference
};
