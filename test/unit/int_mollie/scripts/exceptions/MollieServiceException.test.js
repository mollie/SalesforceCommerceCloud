const MollieServiceException = require(`${base}/int_mollie/cartridge/scripts/exceptions/MollieServiceException`);

describe('exceptions/MollieServiceException', function () {
    context('#new', function () {
        before(function () {
            this.errorMessage = 'message';
            this.exception = new MollieServiceException(this.errorMessage);
        });

        it('must be constructed with a message', function () {
            expect(this.exception.message).to.eql(this.errorMessage);
        });

        it('can be constructed with errorDetail', function () {
            const errorDetail = {
                more: 'information'
            };
            const exceptionWithDetail = new MollieServiceException('message', errorDetail);
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
            expect(this.exception.stack).to.have.string('MollieServiceException\n');
        });

        it('has a name', function () {
            expect(this.exception.name).to.eql('MollieServiceException');
        });

        it('it inherits from Error', function () {
            expect(Object.getPrototypeOf(this.exception)).to.eql(Object.getPrototypeOf(new Error()));
        });
    });

    context('static#from', function () {
        before(function () {
            this.errorMessage = 'message';
            this.error = new Error(this.errorMessage);
            this.exception = MollieServiceException.from(this.error);
        });

        it('has a message', function () {
            expect(this.exception.message).to.be.a('string');
        });

        it('has a stacktrace containing the original stack', function () {
            expect(this.exception.stack).to.be.a('string');
            expect(this.exception.stack).to.match(/^MollieServiceException/);
        });

        it('has a name', function () {
            expect(this.exception.name).to.eql('MollieServiceException');
        });

        it('it inherits from Error', function () {
            expect(Object.getPrototypeOf(this.exception)).to.eql(Object.getPrototypeOf(new Error()));
        });

        it('creates a stackTrace if original error has none', function () {
            const e = new Error(this.errorMessage);
            delete e.stack;
            const exception = MollieServiceException.from(e);
            expect(exception.stack).not.to.be.null();
        });
    });
});
