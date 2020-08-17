module.exports = {
    CREATE_PAYMENT_REFUND: {
        method: 'POST',
        path: '/v2/payments/${paymentId}/refunds',
        serviceName: 'Mollie.CreatePaymentRefund'
    },
    CREATE_ORDER_REFUND: {
        method: 'POST',
        path: '/v2/orders/${orderId}/refunds',
        serviceName: 'Mollie.CreateOrderRefund'
    }
};
