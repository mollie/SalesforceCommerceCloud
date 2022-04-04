/* global fetch, CustomEvent */
if (window.dw && window.dw.applepay && window.ApplePaySession && window.ApplePaySession.canMakePayments() && typeof fetch === 'function') {
    (function (config, location, ApplePaySession) {
        /** Used version of ApplePaySession */
        var APPLE_PAY_VERSION = 1;

        /** CSS class name indicating an element was processed by a directive */
        var CLASS_PROCESSED = 'dw-apple-pay-processed';

        /** Name of the SKU element attribute indicating add to basket */
        var ATTR_SKU = 'sku';

        /** Left hand side of cookie indicating to update the Apple Pay request. */
        var UPDATE_REQUEST_COOKIE_LHS = '; dwapupreq=';

        /** Map of Demandware status names to Apple Pay status codes */
        var STATUSES = {
            Failure: ApplePaySession.STATUS_FAILURE,
            InvalidBillingPostalAddress: ApplePaySession.STATUS_INVALID_BILLING_POSTAL_ADDRESS,
            InvalidShippingPostalAddress: ApplePaySession.STATUS_INVALID_SHIPPING_POSTAL_ADDRESS,
            InvalidShippingContact: ApplePaySession.STATUS_INVALID_SHIPPING_CONTACT,
            PINRequired: ApplePaySession.STATUS_PIN_REQUIRED,
            PINIncorrect: ApplePaySession.STATUS_PIN_INCORRECT,
            PINLockout: ApplePaySession.STATUS_PIN_LOCKOUT
        };

        if (location.protocol !== 'https:' || !ApplePaySession.supportsVersion(APPLE_PAY_VERSION)) {
            return;
        }
        var action = config.action;
        var inject = config.inject;

        /** Last value of the cookie indicating to update the Apple Pay request. */
        var lastUpdateRequestCookie;

        /** URL to which to redirect if the Apple Pay session is aborted. */
        var redirect;

        /** Latest Apple Pay request data to use to create a session. */
        var request;

        /** Request object that gets updated with new data from server responses. */
        var updatedRequest;

        /** Current Apple Pay session. */
        var session;

        function hasClass(element, className) {
            return (' ' + element.className + ' ').replace(/[\t\r\n\f]/g, ' ').indexOf(' ' + className + ' ') > -1;
        }

        function mapStatus(status) {
            if (status && STATUSES[status]) {
                return STATUSES[status];
            }
            return ApplePaySession.STATUS_FAILURE;
        }

        function handleResponse(response) {
            return response.json()
                .then(function (json) {
                    if (response.status >= 200 && response.status < 300) {
                        // Return success JSON response
                        return json;
                    }

                    // Throw error with response status
                    var err = new Error(json ? json.status : 'Request error');
                    err.response = json;
                    throw err;
                });
        }

        function postJson(url, data) {
            var json = data;
            if (typeof data === 'object') {
                json = JSON.stringify(data);
            } else if (typeof data !== 'string') {
                throw new Error('Data must be an object or a JSON string.');
            }
            return fetch(url, {
                method: 'POST',
                credentials: 'include',
                headers: {
                    'Content-Type': 'application/json',
                    'Accept': 'application/json'
                },
                body: json
            }).then(handleResponse);
        }

        function getJson(url) {
            return fetch(url, {
                credentials: 'include',
                headers: {
                    'Accept': 'application/json'
                }
            }).then(handleResponse);
        }

        /* Filter out properties that are not from Event prototype,
         * and include all others as ownProperty to a new object.
         * @param {Event} e
         * @return {Object} object with relevant properties as ownProperty
         */
        function filterEvent(e) {
            var filteredEvent = {};
            for (var prop in e) {
                /* global Event */
                if (!Event.prototype.hasOwnProperty(prop)) {
                    filteredEvent[prop] = e[prop];
                }
            }
            return filteredEvent;
        }

        /**
         * On successful creation of an order, submit it through a form
         * @param {String} formAction URL to which to POST form to
         */
        function submitOrder(formAction) {
            var form = document.createElement('form');
            form.action = formAction;
            form.method = 'post';

            document.body.appendChild(form);
            form.submit();
        }

        function doRedirect () {
            if (redirect) {
                // Redirect to last responded redirect
                location.href = redirect;
            }
        }

        function dispatchEvent(event) {
            if (!event || !event.name) {
                return;
            }
            document.body.dispatchEvent(new CustomEvent(event.name, {
                bubbles: true,
                detail: event.detail
            }));
        }

        function processServerResponse(response) {
            if (!response) {
                return;
            }
            // redirect could be an empty string
            if (typeof response.redirect !== 'undefined') {
                // set redirect URL
                redirect = response.redirect;
            }
            dispatchEvent(response.event);
        }

        function oncancelHandler(e) {
            setSession(null);

            postJson(action.cancel, {}).then(function (response) {
                processServerResponse(response);
                doRedirect();
            }, function (error) {
                processServerResponse(error.response);
                doRedirect();
            }).catch(function (err) {
                console.error(err);
            });
        }

        function onpaymentauthorizedHandler(e) {
            postJson(action.onpaymentauthorized, filterEvent(e)).then(function (response) {
                session.completePayment(ApplePaySession.STATUS_SUCCESS);
                processServerResponse(response);
                setSession(null);
                submitOrder(response.redirect);
            }, function (error) {
                session.completePayment(mapStatus(error.message));
                processServerResponse(error.response);
                doRedirect();
            }).catch(function (err) {
                console.error(err);
            });
        }

        function onpaymentmethodselectedHandler(e) {
            postJson(action.onpaymentmethodselected, filterEvent(e)).then(function (response) {
                // update updatedRequest with new server response
                updatedRequest = Object.assign(updatedRequest, response);
                session.completePaymentMethodSelection(response.total, response.lineItems);
                processServerResponse(response);
            }, function (error) {
                // No way to communicate error status on this event to Apple Pay
                session.completePaymentMethodSelection(
                    updatedRequest.total, updatedRequest.lineItems);
                processServerResponse(error.response);
            }).catch(function (err) {
                console.error(err);
            });
        }

        function onshippingcontactselectedHandler(e) {
            postJson(action.onshippingcontactselected, filterEvent(e)).then(function (response) {
                // update updatedRequest with new server response
                updatedRequest = Object.assign(updatedRequest, response);
                session.completeShippingContactSelection(ApplePaySession.STATUS_SUCCESS,
                    response.shippingMethods, response.total, response.lineItems);
                processServerResponse(response);
            }, function (error) {
                session.completeShippingContactSelection(mapStatus(error.message),
                    [], updatedRequest.total, updatedRequest.lineItems);
                processServerResponse(error.response);
            }).catch(function (err) {
                console.error(err);
            });
        }

        function onshippingmethodselectedHandler(e) {
            postJson(action.onshippingmethodselected, filterEvent(e)).then(function (response) {
                // update updatedRequest with new server response
                updatedRequest = Object.assign(updatedRequest, response);
                session.completeShippingMethodSelection(ApplePaySession.STATUS_SUCCESS,
                    response.total, response.lineItems);
                processServerResponse(response);
            }, function (error) {
                session.completeShippingMethodSelection(mapStatus(error.message),
                    updatedRequest.total, updatedRequest.lineItems);
                processServerResponse(error.response);
            }).catch(function (err) {
                console.error(err);
            });
        }

        function onvalidatemerchantHandler(e) {
            postJson(action.onvalidatemerchant, Object.assign(filterEvent(e), {
                hostname: window.location.hostname
            })).then(function (response) {
                session.completeMerchantValidation(response.session);
            }, function (error) {
                session.abort();
            }).catch(function (err) {
                console.error(err);
            });
        }

        function setSession(s) {
            if (session) {
                session.oncancel = null;
                session.onpaymentauthorized = null;
                session.onpaymentmethodselected = null;
                session.onshippingcontactselected = null;
                session.onshippingmethodselected = null;
                session.onvalidatemerchant = null;
            }

            session = s;

            if (session) {
                session.oncancel = oncancelHandler;
                session.onpaymentauthorized = onpaymentauthorizedHandler;
                session.onpaymentmethodselected = onpaymentmethodselectedHandler;
                session.onshippingcontactselected = onshippingcontactselectedHandler;
                session.onshippingmethodselected = onshippingmethodselectedHandler;
                session.onvalidatemerchant = onvalidatemerchantHandler;
            }
        }

        /**
         * Begins the ApplePaySession.
         */
        function createSession() {
            // fake the total amount to make it a valid request
            // if the basket is empty.
            // @TODO some basic addition should be calculated instead
            // to reflect a more reasonable amount
            // this relies on the SKU price to be available on render
            if (parseFloat(request.total.amount) === 0) {
                request.total.amount = '0.01';
            }
            setSession(new ApplePaySession(APPLE_PAY_VERSION, request));
            session.begin();

            // set updatedRequest to request
            updatedRequest = Object.assign({}, request);
        }

        /**
         * Prepares an Apple Pay basket, optionally
         * containing exclusively the product with the given SKU to buy.
         * @param {String} [sku] SKU of product to buy
         */
        function prepareBasket(sku) {
            postJson(action.prepareBasket, {
                sku: sku
            }).then(function (response) {
                processServerResponse(response);
            }, function (error) {
                try {
                    session.abort();
                } catch (e) {
                    // Swallow an error if Apple Pay throws when aborting session
                    console.error(e);
                }
                processServerResponse(error.response);
                doRedirect();
            }).catch(function (err) {
                console.error(err);
            });
        }

        function validateInject(element, directive) {
            if (element.hasAttribute(ATTR_SKU)) {
                // No minimum total price required to inject for add to cart
                return !!request;
            }

            // Inject only if request total price is positive
            return request && request.total && request.total.amount &&
                parseFloat(request.total.amount) > 0;
        }

        function createButton(element, directive) {
            // Create button element
            var button = document.createElement('button');
            button.type = 'button';

            // Compose button class name
            var className = '';
            if (directive.css) {
                className += directive.css;
            }

            // Copy attributes to button
            if (directive.copy) {
                if (element.getAttribute(ATTR_SKU)) {
                    button.setAttribute(ATTR_SKU, element.getAttribute(ATTR_SKU));
                }
                if (element.className) {
                    className += ' ' + element.className;
                }
                if (element.id) {
                    var id = element.id;
                    element.id = '';
                    button.id = id;
                }
            }

            if (className) {
                button.className = className;
            }

            // Dynamically style the button
            if (directive.style) {
                var styleElement;
                if (directive.style.ref === 'this') {
                    // Style reference is same element
                    styleElement = element;
                } else if (directive.style.ref) {
                    // Query style reference element
                    styleElement = document.querySelector(directive.style.ref);
                }

                if (styleElement && directive.style.attr && 'getComputedStyle' in window) {
                    // Copy declared style attributes to button
                    var computedStyle = window.getComputedStyle(styleElement);
                    var style = '';
                    for (var i = 0; i < directive.style.attr.length; i++) {
                        style += directive.style.attr[i] + ':' + computedStyle.getPropertyValue(directive.style.attr[i]) + ';';
                    }
                    button.style = style;
                }
            }

            // Add button click handler
            button.onclick = function () {
                // Create Apple Pay basket
                prepareBasket(button.getAttribute(ATTR_SKU));

                // Create Apple Pay session synchronously
                createSession();

                // Quit further event handling
                return false;
            };

            return button;
        }

        function process(element, directive) {
            if (hasClass(element, CLASS_PROCESSED)) {
                // Element has already been processed
                return;
            }

            if (!validateInject(element, directive)) {
                // Element is not valid for this directive
                return;
            }

            // Create button for element
            var button = createButton(element, directive);

            // Execute action for button
            switch (directive.action) {
                case 'after':
                    element.parentNode.appendChild(button, element.nextSibling);
                    break;
                case 'before':
                    element.parentNode.insertBefore(button, element);
                    break;
                case 'replace':
                    element.parentNode.insertBefore(button, element);
                    element.parentNode.removeChild(element);
                    break;
                case 'append':
                    element.appendChild(button);
                    break;
            }

            // Mark element as processed
            element.className += ' ' + CLASS_PROCESSED;
        }

        function processDirectives() {
            if (!request) {
                // Quit processing without a valid request
                return;
            }

            var directive, elements;
            for (var i = 0; i < inject.directives.length; i++) {
                directive = inject.directives[i];
                elements = document.querySelectorAll(directive.query);
                if (elements && elements.length > 0) {
                    for (var j = 0; j < elements.length; j++) {
                        process(elements[j], directive);
                    }
                }
            }

            if (inject.directives.length) {
                // Repeat processing in one second
                setTimeout(processDirectives, 1000);
            }
        }

        /**
         * Retrieves Apple Pay request info from the server.
         */
        function getRequest() {
            getJson(action.getRequest).then(function (response) {
                request = Object.assign({}, response.request);
                processDirectives();
                processServerResponse(response);
            }).catch(function (err) {
                console.error(err);
                processServerResponse(error.response);
            });
        }

        function getUpdateRequestCookie () {
            var cookie = '; ' + (document.cookie || '') + '; ';
            var start = cookie.indexOf(UPDATE_REQUEST_COOKIE_LHS);
            if (start < 0) {
                return '';
            }

            start += UPDATE_REQUEST_COOKIE_LHS.length;
            return cookie.substring(start, cookie.indexOf('; ', start));
        }

        function pollCookies() {
            var value = getUpdateRequestCookie();
            if (value && value !== lastUpdateRequestCookie) {
                lastUpdateRequestCookie = value;
                getRequest();
            }
        }

        // Kick off XHR to get initial Apple Pay request
        getRequest();

        // Poll for cookie to update Apple Pay request
        lastUpdateRequestCookie = getUpdateRequestCookie();
        setInterval(pollCookies, 200);
    })(window.dw.applepay, window.location, window.ApplePaySession);
}

