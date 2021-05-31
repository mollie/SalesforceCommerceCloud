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
            }).then(function (response) {
                assert.equal(response.statusCode, 500, 'Should return a 500 response statusCode');
            }).catch(function (err) {
                assert.equal(err.statusCode, 500, 'Should return a 500 response statusCode');
            });
        });

        it('Should return a 400 response statusCode when request is missing form data', () => {
            return request({
                url: config.baseUrl + 'MolliePayment-Hook',
                method: 'POST',
                json: true
            }).then(function (response) {
                assert.equal(response.success, false, 'Should return success false');
                assert.equal(response.statusCode, 500, 'Should return a 500 response statusCode');
            }).catch(function (err) {
                assert.equal(err.statusCode, 500, 'Should return a 500 response statusCode');
            });
        });

        it('Should return a error response when order is not found', () => {
            return request({
                url: config.baseUrl + 'MolliePayment-Hook',
                method: 'POST',
                json: true,
                formData: {
                    orderId: 'MOLLIE_12345',
                    orderToken: 'TOKEN',
                    statusUpdateId: 'TEST'
                }
            }).then(function (response) {
                assert.equal(response.success, false, 'Should return success false');
                assert.equal(response.statusCode, 404, 'Should return a 404 response statusCode');
            }).catch(function (err) {
                assert.equal(err.statusCode, 500, 'Should return a 500 response statusCode');
            });
        });
    });
});
