const { stubs } = testHelpers;
const Ajv = require('ajv');
const ajv = new Ajv({ allErrors: true });
const validate = ajv.compile(require('../mollieServiceSchemas').createCustomer);

const customerStub = stubs.sandbox.stub();

const proxyquire = require('proxyquire').noCallThru().noPreserveCache();
const createCustomer = proxyquire(`${base}/int_mollie/cartridge/scripts/services/mollie/customer/createCustomer`, {
    '*/cartridge/scripts/utils/logger': stubs.loggerMock,
    '*/cartridge/scripts/services/mollie/mollieResponseEntities': {
        Customer: customerStub
    }
});

describe('mollie/createCustomer', () => {
    before(function () { stubs.init(); });
    afterEach(function () { stubs.reset(); });
    after(function () { stubs.restore(); });

    context('#payloadBuilder', () => {
        beforeEach(() => {
            this.customer = {
                firstName: faker.lorem.word(),
                lastName: faker.lorem.word(),
                email: faker.lorem.word()
            };
            this.profileStub = new stubs.dw.ProfileMock();
            this.profileStub.getFirstName.returns(this.customer.firstName);
            this.profileStub.getLastName.returns(this.customer.lastName);
            this.profileStub.getEmail.returns(this.customer.email);
            this.params = {
                profile: this.profileStub
            };
        });

        it('builds a correct payload', () => {
            const payload = createCustomer.payloadBuilder(this.params);
            validate(payload);
            expect(validate(payload)).to.be.eql(true, JSON.stringify(validate.errors));
        });
    });

    context('#responseMapper', () => {
        it('returns a parsed response object', () => {
            const result = { Customer: 'value' };
            const response = createCustomer.responseMapper(result);
            expect(response.raw).to.eql(JSON.stringify(result));
            expect(customerStub).to.have.been.calledOnce()
                .and.to.have.been.calledWithExactly(result);
        });

        it('handles result without expected properties', () => {
            let response = createCustomer.responseMapper({});
            expect(response).to.eql({ customer: {}, raw: JSON.stringify({}) });
        });

        it('handles a null or undefined result', () => {
            let response = createCustomer.responseMapper(null);
            expect(response).to.eql({ customer: {}, raw: null });

            response = createCustomer.responseMapper();
            expect(response).to.eql({ customer: {}, raw: null });
        });

        it('handles a string result', () => {
            const response = createCustomer.responseMapper('string');
            expect(response).to.eql({ customer: {}, raw: 'string' });
        });
    });
});
