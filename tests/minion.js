var Site   = require('../minion/site'),
    should = require('should');

describe('Site', function () {
    it('should detect content string', function (done) {
        var site = new Site({});
        site.setContentString('foobar');
        site.responseContainsContentString('baz').should.be.false;
        site.responseContainsContentString('foobarbaz').should.be.true;
        done();
    });
});
