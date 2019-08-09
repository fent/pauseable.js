const p      = require('..');
const assert = require('assert');
const sinon  = require('sinon');


describe('setTimeout', () => {
  let clock, mysetTimeout;
  before(() => {
    clock = sinon.useFakeTimers();
    mysetTimeout = (fn, ms) => {
      setTimeout(fn, ms);
      clock.tick(ms);
    };
  });
  after(() => { clock.restore(); });

  let callback, timeout;
  beforeEach(() => {
    callback = sinon.spy();
    timeout = p.setTimeout(callback, 100);
  });

  afterEach(() => { timeout.clear(); });

  it('Calls given function after some time', (done) => {
    mysetTimeout(() => {
      assert.ok(callback.called);
      assert.ok(!timeout.isPaused());
      assert.ok(timeout.isDone());
      done();
    }, 105);
  });

  describe('Pause', () => {
    it('Does not call function', (done) => {
      mysetTimeout(() => {
        timeout.pause();
        let next = timeout.next();
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
    });

  });

  describe('interchangeableArguments', () => {
    it('Still calls function', (done) => {
      let callback = sinon.spy();
      let timeout = p.setTimeout(30, callback);

      mysetTimeout(() => {
        assert.ok(callback.called);
        assert.ok(timeout.isDone());
        done();
      }, 35);
    });
  });
});
