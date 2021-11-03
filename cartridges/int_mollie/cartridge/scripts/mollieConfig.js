var Site = require('dw/system/Site');
var Resource = require('dw/web/Resource');
var MollieServiceException = require('*/cartridge/scripts/exceptions/MollieServiceException');
var customPageFieldSettings = require('*/cartridge/scripts/customPageFieldSettings');
var mollieConfigHelper = require('*/cartridge/scripts/mollieConfigHelper');

var DEFAULT_ATTRIBUTE_VALUE = 'default';

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

var ENABLED_MODE = {
    TEST: 'TEST',
    LIVE: 'LIVE'
};


var PLUGIN_VERSION = [
    'SFCC/' + Resource.msg('global.version.number', 'version', null),
    'SFCCCertificationVersion/' + Resource.msg('mollie.version.certification.number', 'version', null),
    'MollieSFCC/' + Resource.msg('mollie.version.number', 'version', null),
    'uap/HFyJqxekGpwVPUzr'
];

// Mollie Configuration
/**
 *
 * @class
 */
function Config() {
    var sitePreferences;

    try {
        sitePreferences = Site.getCurrent().getPreferences().getCustom();
        this.siteId = Site.getCurrent().getID();
        this.siteName = Site.getCurrent().getName();
    } catch (e) {
        throw new MollieServiceException('SITE_PREFRENCES :: ' + e.message);
    }


    // #region GENERAL CONFIG
    this.enabledMode = mollieConfigHelper.getPreference(sitePreferences, 'mollieEnabledMode', true);
    this.bearerTestToken = mollieConfigHelper.getPreference(sitePreferences, 'mollieBearerTestToken', this.enabledMode === ENABLED_MODE.LIVE);
    this.bearerToken = mollieConfigHelper.getPreference(sitePreferences, 'mollieBearerToken', this.enabledMode === ENABLED_MODE.LIVE);
    this.profileId = mollieConfigHelper.getPreference(sitePreferences, 'mollieProfileId', true);
    this.defaultEnabledTransActionAPI = mollieConfigHelper.getPreference(sitePreferences, 'mollieDefaultEnabledTransactionAPI', true);
    this.defaultOrderExpiryDays = mollieConfigHelper.getPreference(sitePreferences, 'mollieDefaultOrderExpiryDays', true);
    this.enableSingleClickPayments = mollieConfigHelper.getPreference(sitePreferences, 'mollieEnableSingleClickPayments', true);
    this.componentsEnabled = mollieConfigHelper.getPreference(sitePreferences, 'mollieComponentsEnabled', true);
    this.enableQrCode = mollieConfigHelper.getPreference(sitePreferences, 'mollieEnableQrCode', false);
    this.logCategory = mollieConfigHelper.getPreference(sitePreferences, 'mollieLogCategory', false);
    this.customPageFieldSettings = customPageFieldSettings;

    this.getPluginVersion = function () {
        var version = PLUGIN_VERSION.join(' ');
        return version;
    };

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
     * @name Config#getEnabledMode
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
     * Get API key
     * @function
     * @name Config#getBearerTokenLive
     * @return {string} bearerToken
     */
    this.getBearerTokenLive = function () {
        return this.bearerToken;
    };

    /**
     * Get API key
     * @function
     * @name Config#getBearerTokenTest
     * @return {string} bearerToken
     */
    this.getBearerTokenTest = function () {
        return this.bearerTestToken;
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
     * Get QR codes enabled
     * @function
     * @name Config#getEnableQrCode
     * @return {Object} enableSingleClickPayments
     */
    this.getEnableQrCode = function () {
        return this.enableQrCode;
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
    * Get LogCategory
    * @function
    * @name Config#getLogCategory
    * @return {string} logCategory
    */
    this.getCustomPageFieldSettings = function () {
        return this.customPageFieldSettings;
    };

    /**
     * Get attribute default value
     * @function
     * @name Config#getDefaultAttributeValue
     * @return {Object} Transaction statuses
     */
    this.getDefaultAttributeValue = function () {
        return DEFAULT_ATTRIBUTE_VALUE;
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
