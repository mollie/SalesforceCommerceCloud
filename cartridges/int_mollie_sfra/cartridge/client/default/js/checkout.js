'use strict';

var processInclude = require('base/util');

$(document).ready(function () {
    processInclude(require('./checkout/checkout'));
    processInclude(require('./checkout/qrcode'));
    processInclude(require('./checkout/applePay'));
    require('./checkout/billing').init();
});
