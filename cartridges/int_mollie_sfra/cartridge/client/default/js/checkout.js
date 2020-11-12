'use strict';

var processInclude = require('base/util');

$(document).ready(function () {
    processInclude(require('./checkout/checkout'));
    require('./checkout/billing').init();
    require('./checkout/applePay').init();
});
