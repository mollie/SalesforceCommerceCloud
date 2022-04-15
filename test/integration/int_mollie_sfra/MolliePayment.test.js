var request = require('request-promise');
const config = require('../config');

describe('MolliePayment controller tests', () => {
    context('MolliePayment-Hook', () => {
        it('Should reject a GET request', () => {
            return request({
                url: config.baseUrl + 'MolliePayment-Hook',
                method: 'GET',
                rejectUnauthorized: false,
                resolveWithFullResponse: true
            }).catch(function (err) {
                assert.equal(err.statusCode, 500, 'Should return a 500 response statusCode');
            });
        });

        it('Should return a 400 response statusCode when request is missing form data or querystring', () => {
            return request({
                url: config.baseUrl + 'MolliePayment-Hook',
                method: 'POST',
                json: true
            }).catch(function (err) {
                assert.equal(err.statusCode, 400, 'Should return a 400 response statusCode');
            });
        });

        it('Should return a error response when order is not found', () => {
            return request({
                url: config.baseUrl + 'MolliePayment-Hook',
                method: 'POST',
                json: true,
                qs: {
                    orderId: 'MOLLIE_12345',
                    orderToken: 'TOKEN'
                },
                formData: {
                    id: 'TEST'
                }
            }).catch(function (err) {
                assert.equal(err.statusCode, 404, 'Should return a 404 response statusCode');
            });
        });
    });

    context('MolliePayment-WatchQRCode', () => {
        it('Should reject a POST request', () => {
            return request({
                url: config.baseUrl + 'MolliePayment-WatchQRCode',
                method: 'POST',
                rejectUnauthorized: false,
                resolveWithFullResponse: true
            }).catch(function (err) {
                assert.equal(err.statusCode, 500, 'Should return a 500 response statusCode');
            });
        });

        it('Should return a 400 response statusCode when request is missing querystring', () => {
            return request({
                url: config.baseUrl + 'MolliePayment-WatchQRCode',
                method: 'GET',
                json: true
            }).catch(function (err) {
                assert.equal(err.statusCode, 400, 'Should return a 400 response statusCode');
            });
        });

        it('Should return a error response when order is not found', () => {
            return request({
                url: config.baseUrl + 'MolliePayment-WatchQRCode',
                method: 'GET',
                json: true,
                qs: {
                    orderId: 'MOLLIE_12345',
                    orderToken: 'TOKEN'
                }
            }).catch(function (err) {
                assert.equal(err.statusCode, 404, 'Should return a 404 response statusCode');
            });
        });
    });

    context('MolliePayment-ApplePayValidateMerchant', () => {
        it('Should return a error response when order is not found', () => {
            return request({
                url: config.baseUrl + 'MolliePayment-ApplePayValidateMerchant',
                method: 'POST',
                rejectUnauthorized: false,
                resolveWithFullResponse: true
            }).catch(function (err) {
                assert.equal(err.statusCode, 500, 'Should return a 500 response statusCode');
            });
        });
    });
});
