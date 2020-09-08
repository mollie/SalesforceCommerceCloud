/* global Mollie */
/* eslint new-cap: [2, {"capIsNewExceptions": ["Mollie"]}]*/

'use strict';

var mollie;
const $mollieComponentsContainer = $('.js-mollie-components-container');

var cardHolderComponent;
const cardHolder = '#card-holder';
const cardHolderError = '#card-holder-error';

var cardNumberComponent;
const cardNumber = '#card-number';
const cardNumberError = '#card-number-error';

var expiryDateComponent;
const expiryDate = '#expiry-date';
const expiryDateError = '#expiry-date-error';

var verificationCodeComponent;
const verificationCode = '#verification-code';
const verificationCodeError = '#verification-code-error';


/**
 * Initialize Mollie components
 */
function initMollieComponents() {
    mollie = Mollie($mollieComponentsContainer.attr('data-components-profile-id'), {
        locale: $mollieComponentsContainer.attr('data-components-locale'),
        testmode: $mollieComponentsContainer.attr('data-components-test-mode')
    });

    cardHolderComponent = mollie.createComponent('cardHolder');
    cardHolderComponent.mount(cardHolder);

    cardNumberComponent = mollie.createComponent('cardNumber');
    cardNumberComponent.mount(cardNumber);

    expiryDateComponent = mollie.createComponent('expiryDate');
    expiryDateComponent.mount(expiryDate);

    verificationCodeComponent = mollie.createComponent('verificationCode');
    verificationCodeComponent.mount(verificationCode);
}

/**
 * Add event listener to Mollie component input
 * @param {Object} component - mollie component
 * @param {string} componentId - Id of component
 * @param {Object} errorId - Id of error field
 */
function addInputEventListener(component, componentId, errorId) {
    var $cardHolderComponent = $(componentId);
    var $errorElement = $(errorId);
    component.addEventListener('change', event => {
        if (event.error && event.touched) {
            $cardHolderComponent.addClass('is-invalid');
            $errorElement.text(event.error);
        } else {
            $cardHolderComponent.removeClass('is-invalid');
            $errorElement.text('');
        }
    });
}

/**
 * Initialize Mollie components event listeners for input fields
 */
function initEventListeners() {
    addInputEventListener(cardHolderComponent, cardHolder, cardHolderError);
    addInputEventListener(cardNumberComponent, cardNumber, cardNumberError);
    addInputEventListener(expiryDateComponent, expiryDate, expiryDateError);
    addInputEventListener(verificationCodeComponent, verificationCode, verificationCodeError);
}

/**
 * Async function that creates card token stores it in a hidden input field
 */
async function setCardToken() {
    const { token, error } = await mollie.createToken();
    $('#cardToken').val(token);
    if (error) {
        throw new Error(error.message);
    }
    return token;
}

/**
 * Initialize mollie components when needed
 */
function init() {
    if ($('.js-mollie-components-container').length) {
        initMollieComponents();
        initEventListeners();
    }
}

module.exports = {
    init: init,
    setCardToken: setCardToken
};
