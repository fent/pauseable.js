const p            = require('..');
const assert       = require('assert');
const sinon        = require('sinon');
const EventEmitter = require('events').EventEmitter;


describe('Group', () => {
  let clock, mysetTimeout;
  before(() => {
    clock = sinon.useFakeTimers();
    mysetTimeout = (fn, ms) => {
      setTimeout(fn, ms);
      clock.tick(ms);
    };
  });
  after(() => { clock.restore(); });

  let group, a, b, c, ee;
  beforeEach(() => {
    group = p.createGroup();
    a = sinon.spy();
    b = sinon.spy();
    c = sinon.spy();
    
    ee = group.add(new EventEmitter());
    ee.on('a', a);
    group.setInterval(() => { ee.emit('a'); }, 100);
    group.setInterval(b, 100);
    group.setTimeout(c, 50);
  });

  afterEach(() => { group.clear(); });

  it('Has correct amount of timers', () => {
    assert.equal(group.timers().length, 4);
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
  });
});
