

const $mollieComponentsContainer = $('.js-mollie-components-container')
const mollie = Mollie($mollieComponentsContainer.attr('data-components-profile-id'), {
    locale: $mollieComponentsContainer.attr('data-components-locale'),
    testmode: $mollieComponentsContainer.attr('data-components-test-mode')
});

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

function init() {
    initMollieComponents();
    initEventListeners();
}

function initMollieComponents() {
    cardHolderComponent = mollie.createComponent('cardHolder');
    cardHolderComponent.mount(cardHolder);

    cardNumberComponent = mollie.createComponent('cardNumber');
    cardNumberComponent.mount(cardNumber);

    expiryDateComponent = mollie.createComponent('expiryDate');
    expiryDateComponent.mount(expiryDate);

    verificationCodeComponent = mollie.createComponent('verificationCode');
    verificationCodeComponent.mount(verificationCode);
}

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

function initEventListeners() {
    addInputEventListener(cardHolderComponent, cardHolder, cardHolderError);
    addInputEventListener(cardNumberComponent, cardNumber, cardNumberError);
    addInputEventListener(expiryDateComponent, expiryDate, expiryDateError);
    addInputEventListener(verificationCodeComponent, verificationCode, verificationCodeError);
}

async function setCardToken(callback) {
    const { token, error } = await mollie.createToken();
    $('#cardToken').val(token);
    callback(error)
}

module.exports = {
    init: init,
    setCardToken: setCardToken
};
