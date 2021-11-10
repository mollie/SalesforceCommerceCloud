var ServiceRegistry = require('dw/svc/LocalServiceRegistry');
var Logger = require('*/cartridge/scripts/utils/logger');
var PaymentProviderException = require('*/cartridge/scripts/exceptions/PaymentProviderException');
var MollieRequest = require('*/cartridge/scripts/services/mollie/mollieRequest');
var config = require('*/cartridge/scripts/mollieConfig');

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

    this.configureService = function (svc, parameters) {
        var serviceCredentials = svc.getConfiguration().getCredential();
        this.replaceParams(parameters);
        this.appendParams(parameters);
        svc.setURL(serviceCredentials.getURL() + this.path);
        svc.setRequestMethod(this.method);
        svc.addHeader('Accept', 'application/json; charset=utf-8');
        svc.addHeader('content-type', 'application/json');
        svc.addHeader('Authorization', 'Bearer ' + (parameters.bearerToken || config.getBearerToken()));
        svc.addHeader('User-Agent', config.getPluginVersion());
        return svc;
    };

    this.replaceParams = function (parameters) {
        if (parameters.paymentId) {
            this.path = this.path
                .replace('{paymentId}', parameters.paymentId);
        }

        if (parameters.orderId) {
            this.path = this.path
                .replace('{orderId}', parameters.orderId);
        }

        if (parameters.methodId) {
            this.path = this.path
                .replace('{methodId}', parameters.methodId);
        }

        if (parameters.amount) {
            this.path = this.path
                .replace('{amount}', parameters.amount);
        }

        if (parameters.billingCountry) {
            this.path = this.path
                .replace('{billingCountry}', parameters.billingCountry);
        }

        if (parameters.currency) {
            this.path = this.path
                .replace('{currency}', parameters.currency);
        }

        if (parameters.resource) {
            this.path = this.path
                .replace('{resource}', parameters.resource);
        }
    };

    this.addSeperator = function (url) {
        return url + (url.indexOf('?') !== -1 ? '&' : '?');
    };

    this.appendParams = function (parameters) {
        if (parameters.embed) {
            this.path = this.addSeperator(this.path);
            this.path = this.path + 'embed=' + parameters.embed;
        }

        if (parameters.orderLineCategories) {
            this.path = this.addSeperator(this.path);
            this.path = this.path + 'orderLineCategories=' + parameters.orderLineCategories;
        }

        if (parameters.includeQrCode) {
            this.path = this.addSeperator(this.path);
            this.path = this.path + 'include=details.qrCode';
        }
    };

    this.createRequest = function createRequest(svc, parameters) {
        this.configureService(svc, parameters);
        var request = new MollieRequest(this.payloadBuilder(parameters));
        var requestBody = request.toString();
        return requestBody;
    };

    this.filterLogMessage = function (msg) {
        return msg && msg.replace(/"[^"@]+@/g, '"*****@');
    };

    this.parseResponse = function (svc, client) {
        var response;

        try {
            response = JSON.parse(client.getText());
        } catch (e) {
            response = client.getText();
        }

        Logger.debug('MOLLIE :: ' + this.serviceName + ' : ' + client.getText());
        return this.responseMapper(response);
    };

    this.execute = function (parameters) {
        var service = ServiceRegistry.createService(this.serviceName, {
            createRequest: this.createRequest.bind(this),
            parseResponse: this.parseResponse.bind(this),
            filterLogMessage: this.filterLogMessage.bind(this)
        });
        Logger.debug(this.serviceName + ' :: Service: ' + JSON.stringify(service));

        var result = service.call(parameters);

        if (result.isOk()) {
            return result.object;
        }

        /**
         *  Check more on general error handling here: https://docs.mollie.com/overview/handling-errors
         *  Check more on Mollie Components error handling here: https://docs.mollie.com/components/handling-errors
         */

        var errorMessageObject = JSON.parse(result.errorMessage);
        var MollieError = require('*/cartridge/scripts/services/mollie/mollieError');
        var mollieError = new MollieError(errorMessageObject);
        throw new PaymentProviderException(result.error, mollieError, !!mollieError.extra);
    };
}

module.exports = Mollie;
