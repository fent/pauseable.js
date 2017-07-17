var p            = require('..');
var assert       = require('assert');
var sinon        = require('sinon');
var EventEmitter = require('events').EventEmitter;


describe('Group', function() {
  var clock, mysetTimeout;
  before(function() {
    clock = sinon.useFakeTimers();
    mysetTimeout = function(fn, ms) {
      setTimeout(fn, ms);
      clock.tick(ms);
    };
  });
  after(function() { clock.restore(); });

  var group, a, b, c, ee;
  beforeEach(function() {
    group = p.createGroup();
    a = sinon.spy();
    b = sinon.spy();
    c = sinon.spy();
    
    ee = group.add(new EventEmitter());
    ee.on('a', a);
    group.setInterval(function() { ee.emit('a'); }, 100);
    group.setInterval(b, 100);
    group.setTimeout(c, 50);
  });

  afterEach(function() { group.clear(); });

  it('Has correct amount of timers', function() {
    assert.equal(group.timers().length, 4);
  });

  it('Correctly calls functions and listeners', function(done) {
    mysetTimeout(function() {
      assert.equal(a.callCount, 1);
      assert.equal(b.callCount, 1);
      assert.ok(c.called);
      done();
    }, 105);
  });

  describe('Pause for a given time', function() {
    it('Calls will be delayed', function(done) {
      group.pause(50);
      mysetTimeout(function() {
        assert.equal(a.callCount, 0);
        assert.equal(b.callCount, 0);
        done();
      }, 100);
    });
  });

  describe('Clear', function() {
    it('Timers are cleared', function(done) {
      group.clear();
      mysetTimeout(function() {
        assert.ok(!a.called);
        assert.ok(!b.called);
        assert.ok(!c.called);
        done();
      }, 300);
    });

    it('EventEmitter will still be there', function(done) {
      group.clear();
      ee.emit('a');
      mysetTimeout(function() {
        assert.equal(group.timers().length, 1);
        assert.equal(a.callCount, 1);
        assert.equal(b.callCount, 0);
        assert.ok(!c.called);
        done();
      }, 100);
    });
  });
});
