import assert from 'node:assert';
import { EventEmitter } from 'node:events';
import sinon from 'sinon';
import * as p from '../src';

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
        const res1 = ee.emit('foo', 'a', 'b');
        const res2 = ee.emit('bar', true);
        const res3 = ee.emit('unregistered');

        assert.strictEqual(res1, true);
        assert.strictEqual(res2, true);
        assert.strictEqual(res3, false);
        assert.equal(foo.callCount, 1);
        assert.ok(foo.calledWith(1, 2));
        assert.equal(bar.callCount, 1);
        assert.ok(bar.calledWith('baz'));
      });

      it('Returns true when listenerCount is not defined on emitter', () => {
        const customEe: p.PauseableEmitter = {
          emit: sinon.spy(() => true),
        };
        p.pause(customEe);
        const res = customEe.emit('anything');
        assert.strictEqual(res, true);
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

        it('Replays buffered events in order', () => {
          const ordered = new EventEmitter();
          const received: string[] = [];
          ordered.on('data', (value: number) => received.push(`data:${value}`));
          ordered.on('other', (value: number) =>
            received.push(`other:${value}`),
          );

          p.pause(ordered);
          ordered.emit('data', 1);
          ordered.emit('other', 2);
          ordered.emit('data', 3);
          p.resume(ordered);

          assert.deepStrictEqual(received, ['data:1', 'other:2', 'data:3']);
        });

        it('Cancels auto-resume when manually resumed', () => {
          const clock = sinon.useFakeTimers();
          try {
            const emitter = new EventEmitter();
            p.pause(emitter, 50);
            p.resume(emitter);
            p.pause(emitter);
            clock.tick(60);
            assert.strictEqual((emitter as p.PauseableEmitter).paused, true);
          } finally {
            clock.restore();
          }
        });

        it('Cancels auto-pause when manually paused', () => {
          const clock = sinon.useFakeTimers();
          try {
            const emitter = new EventEmitter();
            p.pause(emitter);
            p.resume(emitter, 50);
            p.pause(emitter);
            p.resume(emitter);
            clock.tick(60);
            assert.strictEqual((emitter as p.PauseableEmitter).paused, false);
          } finally {
            clock.restore();
          }
        });

        it('Buffers events emitted while replaying', () => {
          const ordered = new EventEmitter();
          const received: string[] = [];
          ordered.on('data', (value: string) => received.push(`data:${value}`));
          ordered.on('first', () => {
            received.push('first');
            p.pause(ordered);
            ordered.emit('data', 'later-1');
            ordered.emit('data', 'later-2');
          });

          p.pause(ordered);
          ordered.emit('data', 'before-1');
          ordered.emit('first');
          ordered.emit('data', 'before-2');
          p.resume(ordered);

          assert.deepStrictEqual(received, ['data:before-1', 'first']);

          p.resume(ordered);
          assert.deepStrictEqual(received, [
            'data:before-1',
            'first',
            'data:later-1',
            'data:later-2',
            'data:before-2',
          ]);
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
          assert.ok((ee as p.PauseableEmitter).paused);
          p.resume(ee);
          assert.ok(!(ee as p.PauseableEmitter).paused);
        });

        it('Pause with auto-resume', (done) => {
          p.pause(ee, 20);
          assert.ok((ee as p.PauseableEmitter).paused);
          setTimeout(() => {
            assert.ok(!(ee as p.PauseableEmitter).paused);
            done();
          }, 30);
        });

        it('Supports Symbol events and zero arguments', () => {
          const symEvent = Symbol('test-event');
          const symSpy = sinon.spy();
          const zeroArgSpy = sinon.spy();
          ee.on(symEvent, symSpy);
          ee.on('zeroArg', zeroArgSpy);

          p.pause(ee);
          ee.emit(symEvent, 'symbol-payload');
          ee.emit('zeroArg');
          assert.equal(symSpy.callCount, 0);
          assert.equal(zeroArgSpy.callCount, 0);

          p.resume(ee);
          assert.equal(symSpy.callCount, 1);
          assert.ok(symSpy.calledWith('symbol-payload'));
          assert.equal(zeroArgSpy.callCount, 1);
          assert.equal(zeroArgSpy.firstCall.args.length, 0);
        });

        it('Resume with auto-pause', (done) => {
          p.pause(ee);
          p.resume(ee, 20);
          assert.ok(!(ee as p.PauseableEmitter).paused);
          setTimeout(() => {
            assert.ok((ee as p.PauseableEmitter).paused);
            p.resume(ee);
            done();
          }, 30);
        });
      });
    });
  });
});
