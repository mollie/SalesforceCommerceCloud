const proxyquire = require('proxyquire').noCallThru().noPreserveCache();
const { stubs } = testHelpers;

const Mollie = proxyquire(`${base}/int_mollie/cartridge/scripts/services/mollie/Mollie`, {
    'dw/svc/LocalServiceRegistry': stubs.dw.localServiceRegistryMock,
    '*/cartridge/scripts/utils/logger': stubs.loggerMock,
    '*/cartridge/scripts/exceptions/PaymentProviderException': stubs.serviceExceptionMock,
    '*/cartridge/scripts/services/mollie/mollieRequest': stubs.mollieRequest,
    '*/cartridge/scripts/services/mollieService': stubs.mollieServiceMock,
    '*/cartridge/scripts/mollieConfig': stubs.configMock
});

describe('services/Mollie', () => {
    const configuration = {
        serviceName: faker.lorem.word(),
        method: 'POST',
        path: faker.internet.url()
    };

    before(() => stubs.init());
    afterEach(() => stubs.reset());
    after(() => stubs.restore());
    beforeEach(() => {
        this.mollie = new Mollie(configuration);
    });

    it('is initialised with a configuration', () => {
        expect(this.mollie.serviceName).to.eql(configuration.serviceName);
        expect(this.mollie.path).to.eql(configuration.path);
        expect(this.mollie.method).to.eql(configuration.method);
    });

    it('has addPayloadBuilder', () => {
        this.mollie.addPayloadBuilder('builder');
        expect(this.mollie.payloadBuilder).to.eql('builder');
    });

    it('has addResponseMapper', () => {
        this.mollie.addResponseMapper('mapper');
        expect(this.mollie.responseMapper).to.eql('mapper');
    });

    it('configures a service', () => {
        const fakeURL = faker.internet.url();
        const credentials = {
            getURL: stubs.sandbox.stub()
        };
        const getCredentialStub = stubs.sandbox.stub();
        const service = {
            getConfiguration: () => ({
                getCredential: getCredentialStub.returns(credentials)
            }),
            setURL: stubs.sandbox.stub(),
            setRequestMethod: stubs.sandbox.stub(),
            addHeader: stubs.sandbox.stub()
        };
        const parameters = {
            orderId: faker.random.number(),
            methodId: faker.random.number()
        };
        const bearer = faker.random.number;

        credentials.getURL.returns(fakeURL);
        stubs.configMock.getBearerToken.returns(bearer);
        const svc = this.mollie.configureService(service, parameters);

        expect(service.getConfiguration().getCredential).to.have.been.calledOnce();
        expect(credentials.getURL).to.have.been.calledOnce();
        expect(service.setURL).to.have.been.calledOnce()
            .and.to.have.been.calledWithExactly(fakeURL + configuration.path);
        expect(service.setRequestMethod).to.have.been.calledOnce()
            .and.to.have.been.calledWithExactly(configuration.method);
        expect(service.addHeader).to.have.been.called(4)
            .and.to.have.been.calledWithExactly('content-type', 'application/json')
            .and.to.have.been.calledWithExactly('Accept', 'application/json; charset=utf-8')
            .and.to.have.been.calledWithExactly('Authorization', 'Bearer ' + bearer);
        expect(svc).to.eql(service);
    });

    it('creates a request', () => {
        const service = {
            addHeader: stubs.sandbox.stub()
        };
        const parameters = {
            orderId: faker.random.number(),
            methodId: faker.random.number()
        };

        const payload = {
            payload: [1, 2, 3]
        };
        const request = {
            payload: {
                hello: 'world'
            },
            toString: () => JSON.stringify(this.payload)
        };
        stubs.mollieRequest.returns(request);

        this.mollie.configureService = stubs.sandbox.stub();
        this.mollie.payloadBuilder = stubs.sandbox.stub();
        this.mollie.payloadBuilder.returns(payload);

        const requestBody = this.mollie.createRequest(service, parameters);

        expect(this.mollie.configureService).to.have.been.calledOnce()
            .and.to.have.been.calledWithExactly(service, parameters);
        expect(this.mollie.payloadBuilder).to.have.been.calledOnce()
            .and.to.have.been.calledWithExactly(parameters);
        expect(stubs.mollieRequest).to.have.been.calledOnce()
            .and.to.have.been.calledWithExactly(payload);

        expect(requestBody).to.eql(request.toString());
    });

    context('#parseResponse', () => {
        it('parses a success response consisting of an object', () => {
            const client = {
                statusCode: 200,
                getText: () => JSON.stringify({ hello: 'world' })
            };
            this.mollie.responseMapper = stubs.sandbox.stub();
            this.mollie.responseMapper.returns('parsedResponse');
            const response = this.mollie.parseResponse({}, client);

            expect(this.mollie.responseMapper).to.have.been.calledOnce()
                .and.to.have.been.calledWith(JSON.parse(client.getText()));
            expect(response).to.eql('parsedResponse');
        });
        it('parses a success response consisting of string', () => {
            const client = {
                statusCode: 200,
                getText: () => 'hello world'
            };
            this.mollie.responseMapper = stubs.sandbox.stub();
            this.mollie.responseMapper.returns(client.getText());
            const response = this.mollie.parseResponse({}, client);

            expect(this.mollie.responseMapper).to.have.been.calledOnce()
                .and.to.have.been.calledWith(client.getText());
            expect(response).to.eql(client.getText());
        });

        it('parses an errorResponse', () => {
            const client = {
                statusCode: 400,
                getText: () => JSON.stringify({ ErrorName: 'Error', ErrorMessage: 'Something went wrong' })
            };
            this.mollie.responseMapper = stubs.sandbox.stub();

            this.mollie.parseResponse({}, client);

            expect(this.mollie.responseMapper).to.have.been.calledOnce()
                .and.to.have.been.calledWithExactly(JSON.parse(client.getText()));
        });

        it('parses an errorResponse that is a string', () => {
            const client = {
                statusCode: 400,
                getText: () => 'An error occured'
            };
            this.mollie.responseMapper = stubs.sandbox.stub();

            this.mollie.parseResponse({}, client);

            expect(this.mollie.responseMapper).to.have.been.calledOnce()
                .and.to.have.been.calledWithExactly(client.getText());
        });
    });

    it('creates and executes a service', () => {
        const parameters = 'parameters';
        const createRequest = stubs.sandbox.stub();
        const parseResponse = stubs.sandbox.stub();
        const serviceStub = stubs.sandbox.stub();
        serviceStub.returns({
            object: 'obj',
            isOk: () => true
        });
        stubs.dw.localServiceRegistryMock.createService.returns(serviceStub);
        this.mollie.createRequest = createRequest;
        this.mollie.parseResponse = parseResponse;

        this.mollie.execute(parameters);

        expect(stubs.dw.localServiceRegistryMock.createService).to.have.been.calledOnce()
            .and.to.have.been.calledWith(configuration.serviceName);
    });
});
