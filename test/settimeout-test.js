var p      = require('..');
var assert = require('assert');
var sinon  = require('sinon');


describe('setTimeout', function() {
  var clock, mysetTimeout;
  before(function() {
    clock = sinon.useFakeTimers();
    mysetTimeout = function(fn, ms) {
      setTimeout(fn, ms);
      clock.tick(ms);
    };
  });
  after(function() { clock.restore(); });

  var callback, timeout;
  beforeEach(function() {
    callback = sinon.spy();
    timeout = p.setTimeout(callback, 100);
  });

  afterEach(function() { timeout.clear(); });

  it('Calls given function after some time', function(done) {
    mysetTimeout(function() {
      assert.ok(callback.called);
      assert.ok(!timeout.isPaused());
      assert.ok(timeout.isDone());
      done();
    }, 105);
  });

  describe('Pause', function() {
    it('Does not call function', function(done) {
      mysetTimeout(function() {
        timeout.pause();
        var next = timeout.next();
        assert.equal(next, 50);

        mysetTimeout(function() {
          assert.ok(!callback.called);
          assert.ok(timeout.isPaused());
          assert.ok(!timeout.isDone());
          assert.equal(timeout.next(), next);
          done();
        }, 100);
      }, 50);
    });

    describe('Resume after some time', function() {
      it('Calls function', function(done) {
        timeout.pause();
        mysetTimeout(function() {
          timeout.resume();
          assert.ok(timeout.next() <= 100);
          timeout.pause();
          assert.ok(timeout.next() <= 100);
          timeout.resume();
          assert.ok(timeout.next() <= 100);

          mysetTimeout(function() {
            assert.ok(callback.called);
            assert.ok(!timeout.isPaused());
            assert.ok(timeout.isDone());
            done();
          }, 150);
        }, 50);
      });
    });

  });

  describe('interchangeableArguments', function() {
    it('Still calls function', function(done) {
      var callback = sinon.spy();
      var timeout = p.setTimeout(30, callback);

      mysetTimeout(function() {
        assert.ok(callback.called);
        assert.ok(timeout.isDone());
        done();
      }, 35);
    });
  });
});
