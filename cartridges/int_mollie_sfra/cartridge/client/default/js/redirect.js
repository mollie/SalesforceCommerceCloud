'use strict';

/**
 * Redirects the customer to the order confirm page
 */
function redirect() {
    const $redirectForm = $('.js-mollie-redirect-form');
    if ($redirectForm.length) {
        $.spinner().start();
        $redirectForm.submit();
    }
}

/**
 * Initialize redirect functions
 */
function init() {
    redirect();
}

$(document).ready(function () {
    init();
});
