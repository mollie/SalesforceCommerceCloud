/**
 *
 * @description Set profile custom property
 * @param {dw.customer.Profile} profile - profile object
 * @param {Object} custom - custom
 */
function setProfileCustomProperty(profile, custom) {
    profile.custom[custom.key] = custom.value;
};

/**
 *
 * @description Get profile custom property
 * @param {dw.customer.Profile} profile - profile object
 * @param {Object} custom - custom
 * @returns {Object} - profile custom property
 */
function getProfileCustomProperty(profile, custom) {
    const customProperty = profile.custom[custom.key];
    return customProperty && customProperty.toString();
};

/**
 *
 *
 * @param {dw.customer.Profile} profile - CommerceCloud Profile object
 * @param {string} customerId - Mollie customer id
 * @returns {void}
 */
function setProfileCustomerId(profile, customerId) {
    setProfileCustomProperty(profile, { key: 'mollieCustomerId', value: new String(customerId).toString() });
}

/**
 *
 *
 * @param {dw.customer.Profile} profile - CommerceCloud Profile object
 * @returns {string} - customer id
 */
function getProfileCustomerId(profile) {
    return getProfileCustomProperty(profile, { key: 'mollieCustomerId' });
}

module.exports = {
    setProfileCustomerId: setProfileCustomerId,
    getProfileCustomerId: getProfileCustomerId
}