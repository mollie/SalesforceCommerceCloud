
const mollie = Mollie('pfl_T35kcJ5Hkg', { locale: 'nl_NL', testmode: true });

module.exports = {
    initMollieComponents: function () {
        var cardHolder = mollie.createComponent('cardHolder');
        cardHolder.mount('#card-holder');

        var cardNumber = mollie.createComponent('cardNumber');
        cardNumber.mount('#card-number');

        var expiryDate = mollie.createComponent('expiryDate');
        expiryDate.mount('#expiry-date');

        var verificationCode = mollie.createComponent('verificationCode');
        verificationCode.mount('#verification-code');
    },
    addInputEventListeners: function () {
        
    }
};
