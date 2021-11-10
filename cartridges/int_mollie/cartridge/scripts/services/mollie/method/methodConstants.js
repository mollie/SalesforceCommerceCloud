module.exports = {
    GET_METHODS: {
        method: 'GET',
        path: '/v2/methods?resource={resource}',
        serviceName: 'Mollie.GetMethods'
    },
    GET_METHODS_WITH_PARAMS: {
        method: 'GET',
        path: '/v2/methods?resource={resource}&include=issuers&includeWallets=applepay&amount[value]={amount}&amount[currency]={currency}&billingCountry={billingCountry}',
        serviceName: 'Mollie.GetMethods'
    },
    GET_METHOD: {
        method: 'GET',
        path: '/v2/methods/{methodId}',
        serviceName: 'Mollie.GetMethod'
    }
};
