const p = require('..');
const assert = require('assert');
const sinon = require('sinon');

describe('setTimeout', () => {
  let clock, mysetTimeout;
  before(() => {
    clock = sinon.useFakeTimers();
    mysetTimeout = (fn, ms) => {
      setTimeout(fn, ms);
      clock.tick(ms);
    };
  });
  after(() => {
    clock.restore();
  });

  let callback, timeout;
  beforeEach(() => {
    callback = sinon.spy();
    timeout = p.setTimeout(callback, 100);
  });

  afterEach(() => {
    timeout.clear();
  });

  it('Calls given function after some time', (done) => {
    mysetTimeout(() => {
      assert.ok(callback.called);
      assert.ok(!timeout.isPaused());
      assert.ok(timeout.isDone());
      // Calling pause, resume, or clear when already done returns early
      timeout.pause();
      timeout.resume();
      timeout.clear();
      done();
    }, 105);
  });

  describe('Pause', () => {
    it('Does not call function', (done) => {
      mysetTimeout(() => {
        timeout.pause();
        timeout.pause(); // calling when already paused returns early
        const next = timeout.next();
        assert.equal(next, 50);

        mysetTimeout(() => {
          assert.ok(!callback.called);
          assert.ok(timeout.isPaused());
          assert.ok(!timeout.isDone());
          assert.equal(timeout.next(), next);
          done();
        }, 100);
      }, 50);
    });

    describe('Resume after some time', () => {
      it('Calls function', (done) => {
        timeout.pause();
        mysetTimeout(() => {
          timeout.resume();
          timeout.resume(); // calling when already resumed returns early
          assert.ok(timeout.next() <= 100);
          timeout.pause();
          assert.ok(timeout.next() <= 100);
          timeout.resume();
          assert.ok(timeout.next() <= 100);

          mysetTimeout(() => {
            assert.ok(callback.called);
            assert.ok(!timeout.isPaused());
            assert.ok(timeout.isDone());
            done();
          }, 150);
        }, 50);
      });

      it('Repauses after given time with pauseIn', (done) => {
        timeout.pause();
        timeout.resume(30);
        assert.ok(!timeout.isPaused());
        mysetTimeout(() => {
          assert.ok(timeout.isPaused());
          done();
        }, 40);
      });
    });
  });

  describe('interchangeableArguments', () => {
    it('Still calls function', (done) => {
      const callback = sinon.spy();
      const timeout = p.setTimeout(30, callback);

      mysetTimeout(() => {
        assert.ok(callback.called);
        assert.ok(timeout.isDone());
        done();
      }, 35);
    });
  });
});
