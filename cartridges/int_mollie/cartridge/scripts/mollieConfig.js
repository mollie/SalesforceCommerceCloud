var Site = require('dw/system/Site');
var MollieServiceException = require('*/cartridge/scripts/exceptions/MollieServiceException');

var TRANSACTION_STATUS = {
    OPEN: 'open',
    CREATED: 'created',
    PENDING: 'pending',
    AUTHORIZED: 'authorized',
    PAID: 'paid',
    SHIPPING: 'shipping',
    COMPLETED: 'completed',
    EXPIRED: 'expired',
    CANCELED: 'canceled',
    FAILED: 'failed'
};

var TRANSACTION_API = {
    PAYMENT: 'payment',
    ORDER: 'order'
};

// Mollie Configuration
/**
 *
 * @class
 */
function Config() {
    var sitePreferences;
    var getPreferenceOrThrow = function (preferences, preferenceName) {
        const pref = preferences[preferenceName];
        if (typeof pref === 'boolean') return pref;
        if (!pref) throw new MollieServiceException('You must configure sitePreference by name ' + preferenceName + '.');
        return pref;
    };

    try {
        sitePreferences = Site.getCurrent().getPreferences().getCustom();
        this.siteId = Site.getCurrent().getID();
    } catch (e) {
        throw new MollieServiceException('SITE_PREFRENCES :: ' + e.message);
    }

    // #region GENERAL CONFIG
    this.bearerToken = getPreferenceOrThrow(sitePreferences, 'mollieBearerToken');
    this.enabledTransActionAPI = getPreferenceOrThrow(sitePreferences, 'mollieEnabledTransactionAPI');
    this.logCategory = getPreferenceOrThrow(sitePreferences, 'mollieLogCategory');
    this.componentsEnabled = getPreferenceOrThrow(sitePreferences, 'mollieComponentsEnabled');
    this.componentsEnableTestMode = getPreferenceOrThrow(sitePreferences, 'mollieComponentsEnableTestMode');
    this.componentsProfileId = getPreferenceOrThrow(sitePreferences, 'mollieComponentsProfileId');
    this.orderDefaultExpiryDays = getPreferenceOrThrow(sitePreferences, 'mollieOrderDefaultExpiryDays');
    this.enableSingleClickPayments = getPreferenceOrThrow(sitePreferences, 'mollieEnableSingleClickPayments');

    /**
     * Get SiteId
     * @function
     * @name Config#getSiteId
     * @return {string} paymentSecurityLevel
     */
    this.getSiteId = function () {
        return this.siteId;
    };

    /**
     * Get Bearer Token
     * @function
     * @name Config#getBearerToken
     * @return {string} bearerToken
     */
    this.getBearerToken = function () {
        return this.bearerToken;
    };

    /**
     * Get Transaction Status constant
     * @function
     * @name Config#getTransactionStatus
     * @return {Object} Transaction Statuses
     */
    this.getTransactionStatus = function () {
        return TRANSACTION_STATUS;
    };

    /**
     * Get enabled transaction api (payment / order)
     * @function
     * @name Config#getOrderType
     * @return {Object} Order Types
     */
    this.getEnabledTransactionAPI = function () {
        return this.enabledTransActionAPI.value;
    };

    /**
     * Get default expiry days
     * @function
     * @name Config#getOrderType
     * @return {Object} Order Types
     */
    this.getOrderDefaultExpiryDays = function () {
        return this.orderDefaultExpiryDays;
    };

    /**
     * Get LogCategory
     * @function
     * @name Config#getLogCategory
     * @return {string} logCategory
     */
    this.getLogCategory = function () {
        return this.logCategory;
    };

    /**
     * Get components enabled
     * @function
     * @name Config#getOrderType
     * @return {Object} Order Types
     */
    this.getComponentsEnabled = function () {
        return this.componentsEnabled;
    };

    /**
     * Get components enabled test mode
     * @function
     * @name Config#getOrderType
     * @return {Object} Order Types
     */
    this.getComponentsEnableTestMode = function () {
        return this.componentsEnableTestMode;
    };

    /**
     * Get components profile id
     * @function
     * @name Config#getOrderType
     * @return {Object} Order Types
     */
    this.getComponentsProfileId = function () {
        return this.componentsProfileId;
    };

    /**
     * Get single click payments enabled
     * @function
     * @name Config#getOrderType
     * @return {Object} Order Types
     */
    this.getEnableSingleClickPayments = function () {
        return this.enableSingleClickPayments;
    };

    /**
     * Get Transaction API constant
     * @function
     * @name Config#getOrderType
     * @return {Object} Order Types
     */
    this.getTransactionAPI = function () {
        return TRANSACTION_API;
    };

    // #endregion
}

module.exports = new Config();
