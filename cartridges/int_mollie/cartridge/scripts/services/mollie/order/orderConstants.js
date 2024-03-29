module.exports = {
    CREATE_ORDER: {
        method: 'POST',
        path: '/v2/orders',
        serviceName: 'Mollie.CreateOrder'
    },
    GET_ORDER: {
        method: 'GET',
        path: '/v2/orders/{orderId}',
        serviceName: 'Mollie.GetOrder'
    },
    CANCEL_ORDER: {
        method: 'DELETE',
        path: '/v2/orders/{orderId}',
        serviceName: 'Mollie.CancelOrder'
    },
    CANCEL_ORDER_LINE_ITEM: {
        method: 'DELETE',
        path: '/v2/orders/{orderId}/lines',
        serviceName: 'Mollie.CancelOrderLineItem'
    }
};
