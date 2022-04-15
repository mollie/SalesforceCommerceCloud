'use strict';
/* global ApplePaySession */

const UPDATE_REQUEST_COOKIE_LHS = '; dwapupreq=';
const AppleSessionService = require('./applePaySessionService');
const appleSessionVersion = require('./applePaySession').getApplePayVersion();

let lastUpdateRequestCookie;
let appleSessionService;

/**
 * Get the request cookie for an update
 * @returns {string} cookie
 */
function getUpdateRequestCookie() {
    const cookie = '; ' + (document.cookie || '') + '; ';
    let start = cookie.indexOf(UPDATE_REQUEST_COOKIE_LHS);
    if (start < 0) {
        return '';
    }

    start += UPDATE_REQUEST_COOKIE_LHS.length;
    return cookie.substring(start, cookie.indexOf('; ', start));
}

/**
 * Get the updateRequest cookie, if this value is empty. Request a new apple session
 */
function pollCookies() {
    const value = getUpdateRequestCookie();
    if (value && value !== lastUpdateRequestCookie) {
        lastUpdateRequestCookie = value;
        appleSessionService.getRequest();
    }
}

module.exports = {
    onCreateApplePayButton: () => {
        $(document).on('applepay:createbutton', function (e, data) {
            const { $container, productData } = data;
            const productId = productData && productData.productId;
            const productReadyToOrder = productData && productData.productReadyToOrder;
            const productAvailable = productData && productData.productAvailable;
            const isPDP = !!productId;

            const $paymentButtons = $container.find('.cart-and-ipay, .checkout-and-applepay');
            let $applePay = $paymentButtons.find('.apple-pay');

            // Show Apple Pay unless defined otherwise
            let applepayEnabled = true;
            if (typeof $paymentButtons.data('applepay-enabled') !== 'undefined') {
                applepayEnabled = $paymentButtons.data('applepay-enabled');
            }

            if (applepayEnabled && (!isPDP || (isPDP && productReadyToOrder))) {
                if ($applePay.length !== 0 && productId) {
                    // Set SKU if button exists
                    $applePay.attr('sku', productId);
                } else if ($applePay.length === 0) {
                    // Append Apple Pay Button
                    const locale = $paymentButtons.data('locale');
                    const applepayType = $paymentButtons.data('applepay-type') || 'buy';
                    const applepayButtonStyle = $paymentButtons.data('applepay-buttonstyle') || 'black';
                    const applePayButtonSuffix = (isPDP) ? 'pdp' : 'cart';

                    $paymentButtons.prepend(`
                        <div class="col-sm-12">
                            <apple-pay-button 
                                class="apple-pay apple-pay-${applePayButtonSuffix}" 
                                buttonstyle="${applepayButtonStyle}" 
                                type="${applepayType}" 
                                locale="${locale}" 
                                ${(isPDP) ? 'sku="' + productId + '"' : ''}
                            >
                            </apple-pay-button>
                        </div>
                    `);

                    $applePay = $paymentButtons.find('apple-pay-button');
                }

                $applePay.off('click');
                $applePay.click(function () {
                    if (!isPDP || (isPDP && productAvailable)) {
                        const sku = $(this).attr('sku');
                        appleSessionService.prepareBasket(sku);
                        appleSessionService.createSession();
                    } else {
                        $container.find('.product-availability').addClass('text-red');
                    }
                    return false;
                });
            } else {
                $applePay.parent().remove();
            }
        });
    },
    init: () => {
        $(document).on('applepay:init', function (e, data) {
            const { $container, productData } = data;

            if (location.protocol !== 'https:' || !ApplePaySession.supportsVersion(appleSessionVersion)) {
                return;
            }

            const applePayEnabled = window.dw && window.dw.applepay && window.ApplePaySession && window.ApplePaySession.canMakePayments() && typeof fetch === 'function';
            if (applePayEnabled) {
                $(document).trigger('applepay:createbutton', {
                    $container,
                    productData
                });

                appleSessionService = new AppleSessionService();
                appleSessionService.getRequest();

                // Poll for cookie to update Apple Pay request
                lastUpdateRequestCookie = getUpdateRequestCookie();
                setInterval(pollCookies, 200);
            }
        });
    },
    initPDP: function () {
        const $productDetailContainer = $('.product-detail');

        if ($productDetailContainer.length !== 0) {
            const $productAvailability = $productDetailContainer.find('.product-availability');
            $(document).trigger('applepay:init', {
                $container: $productDetailContainer,
                productData: {
                    productId: $productDetailContainer.data('pid'),
                    productReadyToOrder: $productAvailability.data('ready-to-order') || false,
                    productAvailable: $productAvailability.data('available') || false
                }
            });
        }

        $('body').on('product:updateAddToCart', function (e, response) {
            $(document).trigger('applepay:createbutton', {
                $container: response.$productContainer,
                productData: {
                    productId: response.product.id,
                    productReadyToOrder: response.product.readyToOrder,
                    productAvailable: response.product.available
                }
            });
        });
    },
    initCart: function () {
        const $cartCheckoutButtons = $('.cart');

        if ($cartCheckoutButtons.length !== 0) {
            $(document).trigger('applepay:init', {
                $container: $cartCheckoutButtons
            });
        }

        // Select the node that will be observed for mutations
        const $minicart = $('.minicart');

        if ($minicart.length !== 0) {
            // Configure observer
            const observer = new MutationObserver(function () {
                $(document).trigger('applepay:createbutton', {
                    $container: $minicart.find('.checkout-continue')
                });
            });

            // Initialize observer
            observer.observe($minicart[0], {
                attributes: true,
                childList: true,
                subtree: true
            });
        }
    }
};
