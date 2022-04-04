'use strict';
/* global ApplePaySession */
const APPLE_PAY_VERSION = 12;

module.exports = class AppleSession {
    constructor(appleSessionService) {
        this.session = null;
        this.appleSessionService = appleSessionService;
        if (parseFloat(this.appleSessionService.request.total.amount) === 0) {
            this.appleSessionService.request.total.amount = '0.01';
        }
        this.setSession(new ApplePaySession(APPLE_PAY_VERSION, this.appleSessionService.request));
        this.session.appleSessionService = appleSessionService;
        this.session.begin();
    }

    setSession(s) {
        if (this.session) {
            this.session.oncancel = null;
            this.session.onpaymentauthorized = null;
            this.session.onvalidatemerchant = null;
            this.session.onpaymentmethodselected = null;
            this.session.onshippingcontactselected = null;
            this.session.onshippingmethodselectede = null;
        }

        this.session = s;

        if (this.session) {
            this.session.oncancel = this.appleSessionService.oncancelHandler;
            this.session.onpaymentauthorized = this.appleSessionService.onpaymentauthorizedHandler;
            this.session.onvalidatemerchant = this.appleSessionService.onvalidatemerchantHandler;
            this.session.onpaymentmethodselected = this.appleSessionService.onpaymentmethodselectedHandler;
            this.session.onshippingcontactselected = this.appleSessionService.onshippingcontactselectedHandler;
            this.session.onshippingmethodselected = this.appleSessionService.onshippingmethodselectedHandler;
        }
    }

    static getApplePayVersion() {
        return APPLE_PAY_VERSION;
    }
};
