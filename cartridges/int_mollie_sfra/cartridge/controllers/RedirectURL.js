'use strict';

var server = require('server');
var config = require('*/cartridge/scripts/mollieConfig');
var page = module.superModule;

server.extend(page);

server.prepend('Start', function (req, res, next) {
    var URLRedirectMgr = require('dw/web/URLRedirectMgr');

    // Intercept the incoming path request
    if (URLRedirectMgr.getRedirectOrigin() === '/.well-known/apple-developer-merchantid-domain-association') {
        response.getWriter().print(config.getApplePayDirectVerificationString());
        return null;
    }

    return next();
});

module.exports = server.exports();
