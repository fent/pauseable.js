var p      = require('..');
var assert = require('assert');
var sinon  = require('sinon');


describe('setInterval', function() {
  var clock, mysetTimeout;
  before(function() {
    clock = sinon.useFakeTimers();
    mysetTimeout = function(fn, ms) {
      setTimeout(fn, ms);
      clock.tick(ms);
    };
  });
  after(function() { clock.restore(); });

  var callback, interval;
  beforeEach(function() {
    callback = sinon.spy();
    interval = p.setInterval(callback, 100);
  });

  afterEach(function() { interval.clear(); });

  it('Calls given function on interval', function(done) {
    mysetTimeout(function() {
      assert.equal(callback.callCount, 1);
      done();
    }, 105);
  });

  describe('Pause for a given time', function() {
    it('Does not call given function since it was paused', function(done) {
      interval.pause(50);
      var next = interval.next();
      assert.equal(next, 100);

      mysetTimeout(function() {
        assert.ok(interval.isPaused());
        assert.equal(interval.next(), next);
      }, 10);

      // Callback call count is still 0 because interval was paused.
      mysetTimeout(function() {
        assert.equal(callback.callCount, 0);
        assert.ok(!interval.isPaused());
        assert.ok(!interval.isDone());
        done();
      }, 100);
    });

    it('Eventually resumes and keeps calling function', function(done) {
      interval.pause(50);
      clock.tick(100);
      mysetTimeout(function() {
        interval.clear();
        assert.equal(callback.callCount, 1);
        assert.ok(!interval.isPaused());
        assert.ok(interval.isDone());
        done();
      }, 75);
    });

    it('Does not call after being cleared', function(done) {
      interval.clear();
      mysetTimeout(function() {
        assert.equal(callback.callCount, 0);
        assert.ok(interval.isDone());
        done();
      }, 100);
    });

  });

  describe('Clear right after resuming', function() {
    it('Does not call given function at all', function(done) {
      mysetTimeout(function() {
        assert.equal(callback.callCount, 1);
        interval.pause();
        interval.resume();
        interval.clear();

        mysetTimeout(function() {
          assert.equal(callback.callCount, 1);
          done();
        }, 50);
      }, 115);
    });
  });

  describe('interchangeableArguments', function() {
    it('Still calls function', function(done) {
      var callback = sinon.spy();
      var interval = p.setInterval(30, callback);

      mysetTimeout(function() {
        assert.ok(callback.called);
        assert.ok(!interval.isDone());
        interval.clear();
        done();
      }, 35);
    });
  });
});
