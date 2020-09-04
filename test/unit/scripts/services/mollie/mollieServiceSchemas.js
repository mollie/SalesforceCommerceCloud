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

const lines = {
    lines: {
        type: 'array',
        items: {
            type: 'object',
            required: ['id']
        }
    }
}

exports.createPayment = {
    required: ['amount', 'description'],
    properties: Object.assign({}, amount)
}

exports.createOrderRefund = {
    required: ['lines'],
    properties: Object.assign({}, lines)
};


exports.createPaymentRefund = {
    required: ['amount'],
    properties: Object.assign({}, amount)
};

exports.getPayment = empty;
exports.cancelPayment = empty;
exports.getMethod = empty;
exports.getMethods = empty;
exports.createShipment = empty;
