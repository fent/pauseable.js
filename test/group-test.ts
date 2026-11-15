import assert from 'node:assert';
import { EventEmitter } from 'node:events';
import sinon from 'sinon';
import * as p from '../src';

describe('Group', () => {
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

  let group: p.Group;
  let a: sinon.SinonSpy;
  let b: sinon.SinonSpy;
  let c: sinon.SinonSpy;
  let ee: EventEmitter;

  beforeEach(() => {
    group = p.createGroup();
    a = sinon.spy();
    b = sinon.spy();
    c = sinon.spy();

    ee = group.add(new EventEmitter());
    ee.on('a', a);
    group.setInterval(() => {
      ee.emit('a');
    }, 100);
    group.setInterval(b, 100);
    group.setTimeout(c, 50);
  });

  afterEach(() => {
    group.clear();
  });

  it('Has correct amount of timers', () => {
    assert.equal(group.timers().length, 4);
  });

  describe('interchangeableArguments', () => {
    it('Still calls functions when arguments are swapped', (done) => {
      const g = p.createGroup();
      const timeoutSpy = sinon.spy();
      const intervalSpy = sinon.spy();
      const timeoutTimer = g.setTimeout(30, timeoutSpy);
      const intervalTimer = g.setInterval(30, intervalSpy);

      mysetTimeout(() => {
        assert.ok(timeoutSpy.called);
        assert.ok(intervalSpy.called);
        timeoutTimer.clear();
        intervalTimer.clear();
        g.clear();
        done();
      }, 35);
    });
  });

  it('Correctly calls functions and listeners', (done) => {
    mysetTimeout(() => {
      assert.equal(a.callCount, 1);
      assert.equal(b.callCount, 1);
      assert.ok(c.called);
      done();
    }, 105);
  });

  describe('Pause for a given time', () => {
    it('Calls will be delayed', (done) => {
      group.pause(50);
      mysetTimeout(() => {
        assert.equal(a.callCount, 0);
        assert.equal(b.callCount, 0);
        done();
      }, 100);
    });
  });

  describe('Pause and resume', () => {
    it('Pauses and resumes group with timers and event emitter', (done) => {
      assert.ok(!group.isPaused());
      assert.ok(!group.isDone());
      group.pause();
      assert.ok(group.isPaused());
      group.resume(40);
      assert.ok(!group.isPaused());
      mysetTimeout(() => {
        const intervalTimer = group.timers()[1] as p.Timer;
        assert.ok(intervalTimer.isPaused());
        assert.ok((ee as p.PauseableEmitter).paused);
        done();
      }, 50);
    });
  });

  describe('isDone', () => {
    it('Marks group as done when all timers complete', (done) => {
      const g = p.createGroup();
      g.setTimeout(() => {}, 20);
      assert.ok(!g.isDone());
      mysetTimeout(() => {
        assert.ok(g.isDone());
        done();
      }, 30);
    });

    it('Is done with only emitters', () => {
      const g = p.createGroup();
      g.add(new EventEmitter());
      assert.ok(g.isDone());
    });

    it('Becomes incomplete when a timer is added after done', (done) => {
      const g = p.createGroup();
      assert.ok(g.isDone());
      g.setTimeout(() => {}, 20);
      assert.ok(!g.isDone());
      mysetTimeout(() => {
        assert.ok(g.isDone());
        done();
      }, 30);
    });
  });

  describe('Clear', () => {
    it('Timers are cleared', (done) => {
      group.clear();
      mysetTimeout(() => {
        assert.ok(!a.called);
        assert.ok(!b.called);
        assert.ok(!c.called);
        done();
      }, 300);
    });

    it('EventEmitter will still be there', (done) => {
      group.clear();
      ee.emit('a');
      mysetTimeout(() => {
        assert.equal(group.timers().length, 1);
        assert.equal(a.callCount, 1);
        assert.equal(b.callCount, 0);
        assert.ok(!c.called);
        done();
      }, 100);
    });

    describe('Timer inside a callback', () => {
      it('Timers are cleared', (done) => {
        let callbackTimer: p.Timer;
        const timerCallback = sinon.spy(() => {
          callbackTimer.clear();
        });
        callbackTimer = group.setTimeout(timerCallback, 10);
        assert.equal(group.timers().length, 5);
        mysetTimeout(() => {
          assert.equal(timerCallback.callCount, 1);
          assert.equal(group.timers().length, 4);
          mysetTimeout(() => {
            assert.ok(callbackTimer.isDone());
            assert.equal(timerCallback.callCount, 1);
            assert.ok(b.called);
            assert.ok(c.called);
          }, 300);
          done();
        }, 10);
      });
    });
  });
});
