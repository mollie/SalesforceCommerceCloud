module.exports = {
    CREATE_PAYMENT: {
        method: 'POST',
        path: '/v2/payments',
        serviceName: 'Mollie.CreatePayment'
    },
    GET_PAYMENT: {
        method: 'GET',
        path: '/v2/payments/{paymentId}',
        serviceName: 'Mollie.GetPayment'
    },
    CANCEL_PAYMENT: {
        method: 'DELETE',
        path: '/v2/payments/{paymentId}',
        serviceName: 'Mollie.CancelPayment'
    }
};
