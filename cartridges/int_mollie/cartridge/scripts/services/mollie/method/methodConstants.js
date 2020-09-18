module.exports = {
    GET_METHODS: {
        method: 'GET',
        path: '/v2/methods?include=issuers&includeWallets=applepay&orderLineCategories=eco,meal,gift&amount[value]={amount}&amount[currency]={currency}&resource={resource}&billingCountry={billingCountry}',
        serviceName: 'Mollie.GetMethods'
    },
    GET_METHOD: {
        method: 'GET',
        path: '/v2/methods/{methodId}',
        serviceName: 'Mollie.GetMethod'
    }
};