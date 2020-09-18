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

var REFUND_STATUS = {
    NOTREFUNDED: 'REFUND_STATUS_NOTREFUNDED',
    PARTREFUNDED: 'REFUND_STATUS_PARTREFUNDED',
    REFUNDED: 'REFUND_STATUS_REFUNDED'
};

// Mollie Configuration
/**
 *
 * @class
 */
function Config() {
    var sitePreferences;
    var getPreferenceOrThrow = function (preferences, preferenceName) {
        var pref = preferences[preferenceName];
        if (typeof pref === 'boolean') return pref;
        if (!pref) throw new MollieServiceException('You must configure sitePreference by name ' + preferenceName + '.');
        return pref;
    };

    try {
        sitePreferences = Site.getCurrent().getPreferences().getCustom();
        this.siteId = Site.getCurrent().getID();
        this.siteName = Site.getCurrent().getName();
    } catch (e) {
        throw new MollieServiceException('SITE_PREFRENCES :: ' + e.message);
    }

    // #region GENERAL CONFIG
    this.enabledMode = getPreferenceOrThrow(sitePreferences, 'mollieEnabledMode');
    this.bearerTestToken = getPreferenceOrThrow(sitePreferences, 'mollieBearerTestToken');
    this.bearerToken = getPreferenceOrThrow(sitePreferences, 'mollieBearerToken');
    this.profileId = getPreferenceOrThrow(sitePreferences, 'mollieProfileId');
    this.defaultEnabledTransActionAPI = getPreferenceOrThrow(sitePreferences, 'mollieDefaultEnabledTransactionAPI');
    this.defaultOrderExpiryDays = getPreferenceOrThrow(sitePreferences, 'mollieDefaultOrderExpiryDays');
    this.enableSingleClickPayments = getPreferenceOrThrow(sitePreferences, 'mollieEnableSingleClickPayments');
    this.componentsEnabled = getPreferenceOrThrow(sitePreferences, 'mollieComponentsEnabled');
    this.logCategory = getPreferenceOrThrow(sitePreferences, 'mollieLogCategory');

    /**
     * Get SiteId
     * @function
     * @name Config#getSiteId
     * @return {string} siteId
     */
    this.getSiteId = function () {
        return this.siteId;
    };

    /**
     * Get SiteName
     * @function
     * @name Config#getSiteName
     * @return {string} siteName
     */
    this.getSiteName = function () {
        return this.siteName;
    };

    /**
     * Get Enabled mode
     * @function
     * @name Config#getBearerToken
     * @return {string} enabledMode
     */
    this.getEnabledMode = function () {
        return this.enabledMode;
    };

    /**
     * Get Enabled test mode
     * @function
     * @name Config#getBearerToken
     * @return {string} bearerToken
     */
    this.getBearerToken = function () {
        return this.enabledMode.value === 'TEST' ? this.bearerTestToken : this.bearerToken;
    };

    /**
     * Get components profile id
     * @function
     * @name Config#getProfileId
     * @return {Object} profileId
     */
    this.getProfileId = function () {
        return this.profileId;
    };

    /**
     * Get enabled transaction api (payment / order)
     * @function
     * @name Config#getDefaultEnabledTransactionAPI
     * @return {Object} Enabled transaction API
     */
    this.getDefaultEnabledTransactionAPI = function () {
        return this.defaultEnabledTransActionAPI;
    };

    /**
     * Get default expiry days
     * @function
     * @name Config#getDefaultOrderExpiryDays
     * @return {Object} defaultOrderExpiryDays
     */
    this.getDefaultOrderExpiryDays = function () {
        return this.defaultOrderExpiryDays;
    };

    /**
    * Get single click payments enabled
    * @function
    * @name Config#getEnableSingleClickPayments
    * @return {Object} enableSingleClickPayments
    */
    this.getEnableSingleClickPayments = function () {
        return this.enableSingleClickPayments;
    };

    /**
     * Get components enabled
     * @function
     * @name Config#getComponentsEnabled
     * @return {Object} componentsEnabled
     */
    this.getComponentsEnabled = function () {
        return this.componentsEnabled;
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
     * @return {Object} Transaction statuses
     */
    this.getTransactionStatus = function () {
        return TRANSACTION_STATUS;
    };

    /**
     * Get Transaction API constant
     * @function
     * @name Config#getTransactionAPI
     * @return {Object} Transaction API
     */
    this.getTransactionAPI = function () {
        return TRANSACTION_API;
    };

    /**
     * Get Refund status constant
     * @function
     * @name Config#getRefundStatus
     * @return {Object} Refund statuses
     */
    this.getRefundStatus = function () {
        return REFUND_STATUS;
    };

    // #endregion
}

module.exports = new Config();
