const dirtyChai = require('dirty-chai');
const sinonChai = require('sinon-chai');
const chai = require('chai');

chai.use(dirtyChai);
chai.use(sinonChai);

global.expect = chai.expect;
global.assert = chai.assert;
global.testHelpers = require('./_helpers');
global.faker = require('faker');
global.sinon = require('sinon');
global.base = `${process.cwd()}/cartridges`;
