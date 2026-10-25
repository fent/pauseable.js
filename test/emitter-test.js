const p = require('..');
const assert = require('assert');
const sinon = require('sinon');
const EventEmitter = require('events').EventEmitter;

describe('Event Emitter', () => {
  const ee = new EventEmitter();
  const foo = sinon.spy();
  const bar = sinon.spy();

  ee.on('foo', foo);
  ee.on('bar', bar);

  describe('Emit', () => {
    it('Emits correct event with arguments', () => {
      ee.emit('foo', 1, 2);
      ee.emit('bar', 'baz');

      assert.equal(foo.callCount, 1);
      assert.ok(foo.calledWith(1, 2));
      assert.equal(bar.callCount, 1);
      assert.ok(bar.calledWith('baz'));
    });

    describe('Pause and emit events', () => {
      it('Listeners do not get called', () => {
        p.pause(ee);
        p.pause(ee);
        ee.emit('foo', 'a', 'b');
        ee.emit('bar', true);

        assert.equal(foo.callCount, 1);
        assert.ok(foo.calledWith(1, 2));
        assert.equal(bar.callCount, 1);
        assert.ok(bar.calledWith('baz'));
      });

      describe('Resume and try emitting again', () => {
        it('Buffered events call listeners', () => {
          p.resume(ee);
          p.resume(ee);

          assert.equal(foo.callCount, 2);
          assert.ok(foo.calledWith('a', 'b'));
          assert.equal(bar.callCount, 2);
          assert.ok(bar.calledWith(true));
        });

        it('Events emitted call listeners immediately', () => {
          ee.emit('foo', 'mom', 'dad');
          ee.emit('bar', 'hello');

          assert.equal(foo.callCount, 3);
          assert.ok(foo.calledWith('mom', 'dad'));
          assert.equal(bar.callCount, 3);
          assert.ok(bar.calledWith('hello'));
        });

        it('Pause and resume again when bufferedEvents already exists', () => {
          p.pause(ee);
          assert.ok(ee.paused);
          p.resume(ee);
          assert.ok(!ee.paused);
        });

        it('Pause with auto-resume', (done) => {
          p.pause(ee, 20);
          assert.ok(ee.paused);
          setTimeout(() => {
            assert.ok(!ee.paused);
            done();
          }, 30);
        });

        it('Resume with auto-pause', (done) => {
          p.pause(ee);
          p.resume(ee, 20);
          assert.ok(!ee.paused);
          setTimeout(() => {
            assert.ok(ee.paused);
            p.resume(ee);
            done();
          }, 30);
        });
      });
    });
  });
});
