'use strict';

function getPreference(preferences, preferenceName) {
    var pref = preferences[preferenceName];
    if (typeof pref === 'boolean') return pref;
    return pref;
};

module.exports = {
    getPreference: getPreference
};
