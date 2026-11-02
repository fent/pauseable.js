import assert from 'node:assert';
import sinon from 'sinon';
import * as p from '../src';

describe('setInterval', () => {
  let clock: sinon.SinonFakeTimers;
  let mysetTimeout: (fn: () => void, ms: number) => void;

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

  let callback: sinon.SinonSpy;
  let interval: p.Timer;

  beforeEach(() => {
    callback = sinon.spy();
    interval = p.setInterval(callback, 100);
  });

  afterEach(() => {
    interval.clear();
  });

  it('Calls given function on interval', (done) => {
    mysetTimeout(() => {
      assert.equal(callback.callCount, 1);
      done();
    }, 105);
  });

  describe('Pause for a given time', () => {
    it('Does not call given function since it was paused', (done) => {
      interval.pause(50);
      const next = interval.next();
      assert.equal(next, 100);

      mysetTimeout(() => {
        assert.ok(interval.isPaused());
        assert.equal(interval.next(), next);
      }, 10);

      // Callback call count is still 0 because interval was paused.
      mysetTimeout(() => {
        assert.equal(callback.callCount, 0);
        assert.ok(!interval.isPaused());
        assert.ok(!interval.isDone());
        done();
      }, 100);
    });

    it('Eventually resumes and keeps calling function', (done) => {
      interval.pause(50);
      clock.tick(100);
      mysetTimeout(() => {
        interval.clear();
        assert.equal(callback.callCount, 1);
        assert.ok(!interval.isPaused());
        assert.ok(interval.isDone());
        done();
      }, 75);
    });

    it('Does not call after being cleared', (done) => {
      interval.clear();
      mysetTimeout(() => {
        assert.equal(callback.callCount, 0);
        assert.ok(interval.isDone());
        done();
      }, 100);
    });
  });

  describe('Clear right after resuming', () => {
    it('Does not call given function at all', (done) => {
      mysetTimeout(() => {
        assert.equal(callback.callCount, 1);
        interval.pause();
        interval.resume();
        interval.clear();

        mysetTimeout(() => {
          assert.equal(callback.callCount, 1);
          done();
        }, 50);
      }, 115);
    });
  });

  describe('interchangeableArguments', () => {
    it('Still calls function', (done) => {
      const callbackSpy = sinon.spy();
      const testInterval = p.setInterval(30, callbackSpy);

      mysetTimeout(() => {
        assert.ok(callbackSpy.called);
        assert.ok(!testInterval.isDone());
        testInterval.clear();
        done();
      }, 35);
    });
  });
});
