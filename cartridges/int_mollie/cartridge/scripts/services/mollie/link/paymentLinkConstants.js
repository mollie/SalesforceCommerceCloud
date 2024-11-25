module.exports = {
    CREATE_PAYMENT_LINK: {
        method: 'POST',
        path: '/v2/payment-links',
        serviceName: 'Mollie.CreatePaymentLink'
    },
    GET_PAYMENT_FROM_LINK: {
        method: 'GET',
        path: '/v2/payment-links/{paymentId}/payments?limit=1',
        serviceName: 'Mollie.GetPaymentFromPaymentLink'
    }
};
