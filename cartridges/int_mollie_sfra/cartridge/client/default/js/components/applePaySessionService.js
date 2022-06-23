'use strict';
/* global ApplePaySession Event */
/* eslint no-console: ["error", { allow: ["warn", "error"] }] */

const httpUtils = require('../utils/http');

const ACTION = window.dw.applepay && window.dw.applepay.action;
const AppleSession = require('./applePaySession');


/** Map Apple Pay Session statusses
 * @param {string} status - status to be mapped
 * @returns {number} AppleSession status
 */
function mapStatus(status) {
    const STATUSES = {
        Failure: ApplePaySession.STATUS_FAILURE,
        InvalidBillingPostalAddress: ApplePaySession.STATUS_INVALID_BILLING_POSTAL_ADDRESS,
        InvalidShippingPostalAddress: ApplePaySession.STATUS_INVALID_SHIPPING_POSTAL_ADDRESS,
        InvalidShippingContact: ApplePaySession.STATUS_INVALID_SHIPPING_CONTACT,
        PINRequired: ApplePaySession.STATUS_PIN_REQUIRED,
        PINIncorrect: ApplePaySession.STATUS_PIN_INCORRECT,
        PINLockout: ApplePaySession.STATUS_PIN_LOCKOUT
    };
    if (status && STATUSES[status]) {
        return STATUSES[status];
    }
    return ApplePaySession.STATUS_FAILURE;
}

/** Filter out properties that are not from Event prototype,
 * and include all others as ownProperty to a new object.
 * @param {Event} e - Event that needs to be filtered
 * @return {Object} object with relevant properties as ownProperty
 */
function filterEvent(e) {
    const filteredEvent = {};
    for (let prop in e) { // eslint-disable-line
        if (!Event.prototype.hasOwnProperty(prop)) { // eslint-disable-line
            filteredEvent[prop] = e[prop];
        }
    }
    return filteredEvent;
}

module.exports = class AppleSessionService {
    constructor() {
        this.request = null;
        this.merchantName = null;
        this.updatedRequest = null;
        this.appleSession = null;
    }

    createSession() {
        this.appleSession = new AppleSession(this);
        this.updatedRequest = Object.assign({}, this.request);
    }

    getRequest() {
        const self = this;
        httpUtils.getJson(ACTION.getRequest).then(function (response) {
            self.merchantName = response.request.merchantName;
            self.request = Object.assign({}, response.request);
            httpUtils.processServerResponse(response);
        }).catch(function (err) {
            console.error(err);
            httpUtils.processServerResponse(err.response);
        });
    }

    prepareBasket(sku) {
        const self = this;
        httpUtils.postJson(ACTION.prepareBasket, {
            sku: sku
        }).then(function (response) {
            httpUtils.processServerResponse(response);
        }, function (error) {
            try {
                self.appleSession.session.abort();
            } catch (e) {
                console.error(e);
            }
            httpUtils.processServerResponse(error.response);
            httpUtils.doRedirect();
        }).catch(function (err) {
            console.error(err);
        });
    }

    submitForm(formAction) {
        // Initialize full POST action url + seperate params
        const formActionUrl = new URL(formAction, window.location.origin);
        const params = new URLSearchParams(formActionUrl.search);

        // Create the form
        const form = document.createElement('form');

        // Construct Order ID input for POST submit and delete the query param from the url
        const orderIdInput = document.createElement('input');
        orderIdInput.type = 'hidden';
        orderIdInput.name = 'orderID';
        orderIdInput.value = params.get(orderIdInput.name);
        formActionUrl.searchParams.delete(orderIdInput.name);
        form.appendChild(orderIdInput);

        // Construct Order Token input for POST submit and delete the query param from the url
        const orderTokenInput = document.createElement('input');
        orderTokenInput.type = 'hidden';
        orderTokenInput.name = 'orderToken';
        orderTokenInput.value = params.get(orderTokenInput.name);
        formActionUrl.searchParams.delete(orderTokenInput.name);
        form.appendChild(orderTokenInput);

        // Complete the form setup + submit form
        form.action = formActionUrl.toString();
        form.method = 'post';
        document.body.appendChild(form);
        form.submit();
    }

    onvalidatemerchantHandler(e) {
        const session = this;
        ACTION.onvalidatemerchant = $('.cart-and-ipay, .checkout-and-applepay').data('onvalidatemerchant');
        httpUtils.postJson(ACTION.onvalidatemerchant, Object.assign(filterEvent(e), {
            hostname: window.location.hostname
        })).then(function (response) {
            session.completeMerchantValidation(response.session.payment);
        }, function () {
            session.abort();
        }).catch(function (err) {
            console.error(err);
        });
    }

    onpaymentauthorizedHandler(e) {
        const session = this;
        httpUtils.postJson(ACTION.onpaymentauthorized, filterEvent(e)).then(function (response) {
            session.completePayment(ApplePaySession.STATUS_SUCCESS);
            httpUtils.processServerResponse(response);
            session.appleSessionService.appleSession.setSession(null);
            session.appleSessionService.submitForm(response.redirect);
        }, function (error) {
            session.completePayment(mapStatus(error.message));
            httpUtils.processServerResponse(error.response);
            httpUtils.doRedirect();
        }).catch(function (err) {
            console.error('err', err);
        });
    }

    oncancelHandler() {
        this.appleSessionService.appleSession.setSession(null);
        httpUtils.postJson(ACTION.cancel, {}).then(function (response) {
            httpUtils.processServerResponse(response);
            httpUtils.doRedirect();
        }, function (error) {
            httpUtils.processServerResponse(error.response);
            httpUtils.doRedirect();
        }).catch(function (err) {
            console.error(err);
        });
    }

    onpaymentmethodselectedHandler(e) {
        const session = this;
        const updatedRequest = session.appleSessionService.updatedRequest;
        httpUtils.postJson(ACTION.onpaymentmethodselected, filterEvent(e)).then(function (response) {
            response.total.label = session.appleSessionService.merchantName; // eslint-disable-line
            session.appleSessionService.updatedRequest = Object.assign(updatedRequest, response);
            session.completePaymentMethodSelection(response.total, response.lineItems);
            httpUtils.processServerResponse(response);
        }, function (error) {
            session.completePaymentMethodSelection(updatedRequest.total, updatedRequest.lineItems);
            httpUtils.processServerResponse(error.response);
        }).catch(function (err) {
            console.error(err);
        });
    }

    onshippingcontactselectedHandler(e) {
        const session = this;
        const updatedRequest = session.appleSessionService.updatedRequest;
        httpUtils.postJson(ACTION.onshippingcontactselected, filterEvent(e)).then(function (response) {
            response.total.label = session.appleSessionService.merchantName; // eslint-disable-line
            session.appleSessionService.updatedRequest = Object.assign(updatedRequest, response);
            session.completeShippingContactSelection(ApplePaySession.STATUS_SUCCESS, response.shippingMethods, response.total, response.lineItems);
            httpUtils.processServerResponse(response);
        }, function (error) {
            session.completeShippingContactSelection(mapStatus(error.message), [], updatedRequest.total, updatedRequest.lineItems);
            httpUtils.processServerResponse(error.response);
        }).catch(function (err) {
            console.error(err);
        });
    }

    onshippingmethodselectedHandler(e) {
        const session = this;
        const updatedRequest = session.appleSessionService.updatedRequest;
        httpUtils.postJson(ACTION.onshippingmethodselected, filterEvent(e)).then(function (response) {
            response.total.label = session.appleSessionService.merchantName; // eslint-disable-line
            session.appleSessionService.updatedRequest = Object.assign(updatedRequest, response);
            session.completeShippingMethodSelection(ApplePaySession.STATUS_SUCCESS, response.total, response.lineItems);
            httpUtils.processServerResponse(response);
        }, function (error) {
            session.completeShippingMethodSelection(mapStatus(error.message), updatedRequest.total, updatedRequest.lineItems);
            httpUtils.processServerResponse(error.response);
        }).catch(function (err) {
            console.error(err);
        });
    }
};
