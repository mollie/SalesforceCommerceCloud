const ServiceException = require(`${base}/int_mollie/cartridge/scripts/exceptions/ServiceException`);

describe('exceptions/ServiceException', function () {
    context('#new', function () {
        before(function () {
            this.errorMessage = 'message';
            this.exception = new ServiceException(this.errorMessage);
        });

        it('must be constructed with a message', function () {
            expect(this.exception.message).to.eql(this.errorMessage);
        });

        it('can be constructed with errorDetail', function () {
            const errorDetail = {
                more: 'information'
            };
            const exceptionWithDetail = new ServiceException('message', errorDetail);
            expect(exceptionWithDetail.errorDetail).to.eql(errorDetail);
        });

        it('has a message', function () {
            expect(this.exception.message).to.be.a('string');
        });

        it('has errorDetail', function () {
            expect(this.exception.errorDetail).to.eql(null);
        });

        it('has a stacktrace', function () {
            expect(this.exception.stack).to.be.a('string');
            expect(this.exception.stack).to.have.string('ServiceException\n');
        });

        it('has a name', function () {
            expect(this.exception.name).to.eql('ServiceException');
        });

        it('it inherits from Error', function () {
            expect(Object.getPrototypeOf(this.exception)).to.eql(Object.getPrototypeOf(new Error()));
        });
    });

    context('static#from', function () {
        before(function () {
            this.errorMessage = 'message';
            this.error = new Error(this.errorMessage);
            this.exception = ServiceException.from(this.error);
        });

        it('has a message', function () {
            expect(this.exception.message).to.be.a('string');
        });

        it('has a stacktrace containing the original stack', function () {
            expect(this.exception.stack).to.be.a('string');
            expect(this.exception.stack).to.match(/^ServiceException/);
        });

        it('has a name', function () {
            expect(this.exception.name).to.eql('ServiceException');
        });

        it('it inherits from Error', function () {
            expect(Object.getPrototypeOf(this.exception)).to.eql(Object.getPrototypeOf(new Error()));
        });

        it('creates a stackTrace if original error has none', function () {
            const e = new Error(this.errorMessage);
            delete e.stack;
            const exception = ServiceException.from(e);
            expect(exception.stack).not.to.be.null();
        });
    });
});
