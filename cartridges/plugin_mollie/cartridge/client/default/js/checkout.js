'use strict';

var processInclude = require('base/util');

$(document).ready(function () {
    processInclude(require('./checkout/checkout'));
    require('./checkout/applePay').init();
    require('./checkout/billing').init();
});
