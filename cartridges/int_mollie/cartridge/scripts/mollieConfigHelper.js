'use strict';

var MollieServiceException = require('*/cartridge/scripts/exceptions/MollieServiceException');

function getPreference(preferences, preferenceName) {
    var pref = preferences[preferenceName];
    if (typeof pref === 'boolean') return pref;
    if (!pref) throw new MollieServiceException('You must configure sitePreference by name ' + preferenceName + '.');
    return pref;
};

module.exports = {
    getPreference: getPreference
};
