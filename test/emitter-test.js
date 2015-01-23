var p = require('..');
var assert = require('assert');
var EventEmitter = require('events').EventEmitter;


describe('Event Emitter', function() {
  var ee = new EventEmitter();
  var foo = 0;
  var bar = 0;
  var a, b, c;

  ee.on('foo', function(a2, b2) {
    a = a2;
    b = b2;
    foo++;
  });

  ee.on('bar', function(a) {
    c = a;
    bar++;
  });

  describe('Emit', function() {

    it('Emits correct event with arguments', function() {
      ee.emit('foo', 1, 2);
      ee.emit('bar', 'baz');

      assert.equal(foo, 1);
      assert.equal(a, 1);
      assert.equal(b, 2);

      assert.equal(bar, 1);
      assert.equal(c, 'baz');
    });

    describe('Pause and emit events', function() {

      it('Listeners do not get called', function() {
        p.pause(ee);
        ee.emit('foo', 'a', 'b');
        ee.emit('bar', true);

        assert.equal(foo, 1);
        assert.equal(a, 1);
        assert.equal(b, 2);

        assert.equal(bar, 1);
        assert.equal(c, 'baz');
      });

      describe('Resume and try emitting again', function() {

        it('Buffered events call listeners', function() {
          p.resume(ee);

          assert.equal(foo, 2);
          assert.equal(a, 'a');
          assert.equal(b, 'b');

          assert.equal(bar, 2);
          assert.equal(c, true);
        });

        it('Events emitted call listeners immediately', function() {
          ee.emit('foo', 'mom', 'dad');
          ee.emit('bar', 'hello');

          assert.equal(foo, 3);
          assert.equal(a, 'mom');
          assert.equal(b, 'dad');

          assert.equal(bar, 3);
          assert.equal(c, 'hello');
        });
      });

    });
  });
});
