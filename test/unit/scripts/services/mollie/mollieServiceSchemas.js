const empty = {
    required: [],
    properties: Object.assign({})
};

const amount = {
    amount: {
        type: 'object',
        required: ['value', 'currency'],
        properties: {
            value: {
                type: 'string'
            },
            currency: {
                type: 'string',
                examples: ['EUR']
            }
        }
    }
};

exports.createPaymentRefund = {
    required: ['amount'],
    properties: Object.assign({}, amount)
};

exports.getMethod = empty;
exports.getMethods = empty;
exports.createShipment = empty;
