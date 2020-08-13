module.exports = {
    CREATE_PAYMENT: {
        method: 'POST',
        path: '/v2/payments',
        serviceName: 'Mollie.CreatePayment'
    },
    GET_PAYMENT: {
        method: 'GET',
        path: 'v2/payments/{paymentId}',
        serviceName: 'Mollie.GetPayment'
    },
    UPDATE_PAYMENT: {
        method: 'PATCH',
        path: 'v2/payments/{paymentId}',
        serviceName: 'Mollie.UpdatePayment'
    },
    CANCEL_PAYMENT: {
        method: 'DELETE',
        path: 'v2/payments/{paymentId}',
        serviceName: 'Mollie.CancelPayment'
    }
};
