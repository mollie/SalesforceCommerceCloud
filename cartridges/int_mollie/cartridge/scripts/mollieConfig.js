var Site = require('dw/system/Site');
var ServiceException = require('*/cartridge/scripts/exceptions/ServiceException');

var TRANSACTION_STATUS = {
    OPEN: "open",
    CREATED: "created",
    PENDING: "pending",
    AUTHORIZED: "authorized",
    PAID: "paid",
    SHIPPING: "shipping",
    COMPLETED: "completed",
    EXPIRED: "expired",
    CANCELED: "canceled",
    FAILED: "failed"
}

var TRANSACTION_API = {
    PAYMENT: "payment",
    ORDER: "order"
};

var TRANSACTION_CATEGORY = {
    MEAL: "meal",
    ECO: "eco",
    GIFT: "gift"
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
        if(typeof pref === "boolean") return pref
        if (!pref) throw new ServiceException('You must configure sitePreference by name ' + preferenceName + '.');
        return pref;
    };

    try {
        sitePreferences = Site.getCurrent().getPreferences().getCustom();
        this.siteId = Site.getCurrent().getID();
    } catch (e) {
        throw new ServiceException('SITE_PREFRENCES :: ' + e.message);
    }

    //#region GENERAL CONFIG
    this.bearerToken = getPreferenceOrThrow(sitePreferences, 'mollieBearerToken');
    this.enabledTransActionAPI = getPreferenceOrThrow(sitePreferences, 'mollieEnabledTransactionAPI');

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
    }

    /**
     * Get enabled transaction api (payment / order)
     * @function
     * @name Config#getOrderType
     * @return {Object} Order Types
     */
    this.getEnabledTransactionAPI = function () {
        return this.enabledTransActionAPI;
    }

    /**
     * Get Transaction API constant
     * @function
     * @name Config#getOrderType
     * @return {Object} Order Types
     */
    this.getTransactionAPI = function () {
        return TRANSACTION_API;
    }

    /**
     * Get Transaction Category constant
     * @function
     * @name Config#getOrderType
     * @return {Object} Order Types
     */
    this.getTransactionCategory = function () {
        return TRANSACTION_CATEGORY;
    }

    //#endregion
}

module.exports = new Config();
