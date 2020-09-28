var request = require('request-promise');
const config = require('../config');

describe('Mollie payment controller tests', () => {
    context('Mollie hook', () => {
        it('should reject a GET request', () => {
            return request({
                url: config.baseUrl + 'Mollie-Payment',
                method: 'GET',
                rejectUnauthorized: false,
                resolveWithFullResponse: true
            }).then(function (response) {
                assert.equal(response.statusCode, 500, 'Should return a 500 response statusCode');
            }).catch(function (err) {
                assert.equal(err.statusCode, 500, 'Should return a 500 response statusCode');
            });
        });

        it('Should return a 500 response statusCode when request is missing params', () => {
            return request({
                url: config.baseUrl + 'Mollie-Payment',
                method: 'POST',
                json: true
            }).then(function (response) {
                assert.equal(response.statusCode, 500, 'Should return a 500 response statusCode');
            }).catch(function (err) {
                assert.equal(err.statusCode, 500, 'Should return a 500 response statusCode');
            });
        });

        it('Should return a 500 response statusCode when order is not found', () => {
            return request({
                url: config.baseUrl + 'Mollie-Payment?orderId=JB007',
                method: 'POST',
                json: true,
                formData: {
                    id: 'tr_04566'
                }
            }).then(function (response) {
                assert.equal(response.statusCode, 500, 'Should return a 500 response statusCode');
            }).catch(function (err) {
                assert.equal(err.statusCode, 500, 'Should return a 500 response statusCode');
            });
        });
    });
});