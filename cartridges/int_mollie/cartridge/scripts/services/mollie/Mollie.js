const ServiceRegistry = require('dw/svc/LocalServiceRegistry');
const Logger = require('*/cartridge/scripts/utils/logger');
const PaymentProviderException = require('*/cartridge/scripts/exceptions/PaymentProviderException');
const MollieRequest = require('*/cartridge/scripts/services/mollie/mollieRequest');
const config = require('*/cartridge/scripts/config');

/**
 *
 * @class
 * @param {Object} configuration - configuration object
 */
function Mollie(configuration) {
    this.serviceName = configuration.serviceName;
    this.method = configuration.method;
    this.path = configuration.path;
    this.payloadBuilder = null;
    this.responseMapper = null;

    this.addPayloadBuilder = function (payloadBuilder) {
        this.payloadBuilder = payloadBuilder;
    };

    this.addResponseMapper = function (responseMapper) {
        this.responseMapper = responseMapper;
    };

    this.configureService = function (svc) {
        var serviceCredentials = svc.getConfiguration().getCredential();
        svc.setURL(serviceCredentials.getURL() + this.path);
        svc.setRequestMethod(this.method);
        svc.addHeader('Accept', 'application/json; charset=utf-8');
        svc.addHeader('content-type', 'application/json');
        return svc;
    };

    this.setBearerToken = function (svc) {
        svc.addHeader('Authorization', config.getBearerToken());
    };

    this.replaceOrderId = function (parameters) {
        if (parameters.orderId) {
            this.path = this.path
                .replace("{paymentId}", parameters.paymentId);
        }
    }

    this.createRequest = function createRequest(svc, parameters) {
        this.configureService(svc);
        this.setBearerToken(svc);
        this.replaceOrderId(parameters);
        var request = new MollieRequest(this.payloadBuilder(parameters));
        var requestBody = JSON.stringify(request);
        Logger.debug(this.serviceName + ' :: RequestBody: ' + requestBody);
        return requestBody;
    };

    this.parseResponse = function (svc, client) {
        var response;

        try {
            response = JSON.parse(client.getText());
        } catch (e) {
            response = client.getText();
        }

        if (client.statusCode === 200) {
            return this.responseMapper(response);
        }

        var error = {
            name: typeof response === 'string' ? response : response.ErrorName,
            message: typeof response === 'string' ? null : response.ErrorMessage
        };

        throw new PaymentProviderException(error.name, error.message);
    };

    this.execute = function (parameters) {
        var service = ServiceRegistry.createService(this.serviceName, {
            createRequest: this.createRequest.bind(this),
            parseResponse: this.parseResponse.bind(this)
        });
        var result = service.call(parameters);

        if (result.isOk()) {
            return result.object;
        }

        try {
            response = JSON.parse(result.getErrorMessage());
        } catch (e) {
            response = result.getErrorMessage();
        }

        var error = {
            name: typeof response === 'string' ? response : response.ErrorName,
            message: typeof response === 'string' ? null : response.ErrorMessage
        };

        throw new PaymentProviderException(error.name, error.message);
    };
}

module.exports = Mollie;
