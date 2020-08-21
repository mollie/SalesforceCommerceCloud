'use strict';

var processInclude = require('base/util');

$(document).ready(function () {
    processInclude(require('base/checkout/checkout'));
    processInclude(require('./checkout/components'));
});
