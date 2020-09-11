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
    this.enableTestMode = getPreferenceOrThrow(sitePreferences, 'mollieEnableTestMode');
    this.bearerToken = getPreferenceOrThrow(sitePreferences, 'mollieBearerToken');
    this.bearerTestToken = getPreferenceOrThrow(sitePreferences, 'mollieBearerTestToken');
    this.defaultEnabledTransActionAPI = getPreferenceOrThrow(sitePreferences, 'mollieDefaultEnabledTransactionAPI');
    this.defaultOrderExpiryDays = getPreferenceOrThrow(sitePreferences, 'mollieDefaultOrderExpiryDays');
    this.enableSingleClickPayments = getPreferenceOrThrow(sitePreferences, 'mollieEnableSingleClickPayments');
    this.componentsEnabled = getPreferenceOrThrow(sitePreferences, 'mollieComponentsEnabled');
    this.componentsProfileId = getPreferenceOrThrow(sitePreferences, 'mollieComponentsProfileId');
    this.logCategory = getPreferenceOrThrow(sitePreferences, 'mollieLogCategory');

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
     * Get Enabled test mode
     * @function
     * @name Config#getBearerToken
     * @return {string} bearerToken
     */
    this.getEnableTestMode = function () {
        return this.enableTestMode ;
    };

    /**
     * Get Enabled test mode
     * @function
     * @name Config#getBearerToken
     * @return {string} bearerToken
     */
    this.getBearerToken = function () {
        return this.enableTestMode ? this.bearerTestToken : this.bearerToken;
    };

    /**
     * Get enabled transaction api (payment / order)
     * @function
     * @name Config#getOrderType
     * @return {Object} Order Types
     */
    this.getDefaultEnabledTransactionAPI = function () {
        return this.defaultEnabledTransActionAPI;
    };

    /**
     * Get default expiry days
     * @function
     * @name Config#getOrderType
     * @return {Object} Order Types
     */
    this.getDefaultOrderExpiryDays = function () {
        return this.defaultOrderExpiryDays;
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
     * Get components enabled
     * @function
     * @name Config#getOrderType
     * @return {Object} Order Types
     */
    this.getComponentsEnabled = function () {
        return this.componentsEnabled;
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
     * Get LogCategory
     * @function
     * @name Config#getLogCategory
     * @return {string} logCategory
     */
    this.getLogCategory = function () {
        return this.logCategory;
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
