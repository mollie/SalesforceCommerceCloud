var Site = require('dw/system/Site');
var Resource = require('dw/web/Resource');
var MollieServiceException = require('*/cartridge/scripts/exceptions/MollieServiceException');
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

var APPLE_PAY_DIRECT_PAYMENT_METHOD_ID = 'MOLLIE_APPLE_PAY_DIRECT';

var PLUGIN_VERSION = [
    'SFCC/' + Resource.msg('global.version.number', 'version', null),
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

    this.applePayDirectEnabled = mollieConfigHelper.getPreference(sitePreferences, 'mollieApplePayDirectEnabled', true);
    this.applePayDirectMerchantName = mollieConfigHelper.getPreference(sitePreferences, 'mollieApplePayDirectMerchantName', true);
    this.applePayDirectCountryCode = mollieConfigHelper.getPreference(sitePreferences, 'mollieApplePayDirectCountryCode', true);
    this.applePayDirectVerificationString = mollieConfigHelper.getPreference(sitePreferences, 'mollieApplePayDirectVerificationString', true);
    this.applePayDirectCartType = mollieConfigHelper.getPreference(sitePreferences, 'mollieApplePayDirectCartType', true);
    this.applePayDirectCartButtonStyle = mollieConfigHelper.getPreference(sitePreferences, 'mollieApplePayDirectCartButtonStyle', true);
    this.applePayDirectPdpType = mollieConfigHelper.getPreference(sitePreferences, 'mollieApplePayDirectPdpType', true);
    this.applePayDirectPdpButtonStyle = mollieConfigHelper.getPreference(sitePreferences, 'mollieApplePayDirectPdpButtonStyle', true);
    this.applePayDirectMerchantCapabilities = mollieConfigHelper.getPreference(sitePreferences, 'mollieApplePayDirectMerchantCapabilities', true);
    this.applePayDirectSupportedNetworks = mollieConfigHelper.getPreference(sitePreferences, 'mollieApplePayDirectSupportedNetworks', true);
    this.applePayDirectRequiredShippingContactFields = mollieConfigHelper.getPreference(sitePreferences, 'mollieApplePayDirectRequiredShippingContactFields', true);
    this.applePayDirectRequiredBillingContactFields = mollieConfigHelper.getPreference(sitePreferences, 'mollieApplePayDirectRequiredBillingContactFields', true);

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

    /**
     * Get the payment method ID which must be used to configure the Mollie Apple Pay Direct
     * @function
     * @name Config#getApplePayDirectPaymentMethodId
     * @return {string} APPLE_PAY_DIRECT_PAYMENT_METHOD_ID
     */
    this.getApplePayDirectPaymentMethodId = function () {
        return APPLE_PAY_DIRECT_PAYMENT_METHOD_ID;
    }

    /**
     * Is Apple Pay Direct Enabled
     * @function
     * @name Config#isApplePayDirectEnabled
     * @return {boolean} applePayDirectEnabled
     */
    this.isApplePayDirectEnabled = function () {
        return this.applePayDirectEnabled;
    };

    /**
     * Apple Pay Direct Country Code
     * @function
     * @name Config#getApplePayDirectCountryCode
     * @return {string} applePayEnabled
     */
    this.getApplePayDirectCountryCode = function () {
        return this.applePayDirectCountryCode;
    };

    /**
     * Is Apple Pay Direct Merchant Name
     * @function
     * @name Config#getApplePayDirectMerchantName
     * @return {string} applePayEnabled
     */
    this.getApplePayDirectMerchantName = function () {
        return this.applePayDirectMerchantName;
    };

    /**
     * Is Apple Pay Enabled
     * @function
     * @name Config#isApplePayEnabled
     * @return {string} applePayEnabled
     */
    this.getApplePayDirectVerificationString = function () {
        return this.applePayDirectVerificationString;
    };

    /**
     * Get Apple Pay Cart Button Style
     * @function
     * @name Config#getApplePayCartButtonStyle
     * @return {string} applePayCartButtonStyle
     */
    this.getApplePayDirectCartButtonStyle = function () {
        return this.applePayDirectCartButtonStyle.value;
    };

    /**
     * Get Apple Pay PDP Button Style
     * @function
     * @name Config#getApplePayPdpButtonStyle
     * @return {string} applePayPdpButtonStyle
     */
    this.getApplePayDirectPdpButtonStyle = function () {
        return this.applePayDirectPdpButtonStyle.value;
    };

    /**
     * Get Apple Pay Cart Button Type
     * @function
     * @name Config#getApplePayCartType
     * @return {string} applePayCartType
     */
    this.getApplePayDirectCartType = function () {
        return this.applePayDirectCartType.value;
    };

    /**
     * Get Apple Pay PDP Button Type
     * @function
     * @name Config#getApplePayPdpType
     * @return {string} applePayPdpType
     */
    this.getApplePayDirectPdpType = function () {
        return this.applePayDirectPdpType.value;
    };

    /**
     * Get Apple Pay Merchant Capabilities
     * @function
     * @name Config#getApplePayDirectMerchantCapabilities
     * @return {dw.value.EnumValue} applePayDirectMerchantCapabilities
     */
    this.getApplePayDirectMerchantCapabilities = function () {
        return this.applePayDirectMerchantCapabilities;
    };

    /**
     * Get Apple Pay Supported Networks
     * @function
     * @name Config#getApplePayDirectSupportedNetworks
     * @return {dw.value.EnumValue} applePayDirectSupportedNetworks
     */
    this.getApplePayDirectSupportedNetworks = function () {
        return this.applePayDirectSupportedNetworks;
    };

    /**
     * Get Apple Pay Required Shipping Contact Fields
     * @function
     * @name Config#getApplePayDirectRequiredShippingContactFields
     * @return {dw.value.EnumValue} applePayDirectRequiredShippingContactFields
     */
    this.getApplePayDirectRequiredShippingContactFields = function () {
        return this.applePayDirectRequiredShippingContactFields;
    };

    /**
     * Get Apple Pay Required Billing Contact Fields
     * @function
     * @name Config#getApplePayDirectRequiredBillingContactFields
     * @return {dw.value.EnumValue} applePayDirectRequiredBillingContactFields
     */
    this.getApplePayDirectRequiredBillingContactFields = function () {
        return this.applePayDirectRequiredBillingContactFields;
    };

    // #endregion
}

module.exports = new Config();
