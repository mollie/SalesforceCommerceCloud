'use strict';

var processInclude = require('base/util');

$(document).ready(function () {
    processInclude(require('./checkout/checkout'));
    processInclude(require('./checkout/qrcode'));
    require('./checkout/billing').init();
    require('./checkout/applePay').init();
});
