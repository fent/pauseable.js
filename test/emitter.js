var p = require('../.');


exports.setTimeout = function(beforeExit, assert) {
  var ee = new p.EventEmitter()
    , n = 0
    , bar = false
    ;

  ee.on('foo', function(a, b) {
    assert.eql(a, 1);
    assert.eql(b, 2);
    n++;
  });

  ee.on('bar', function(a) {
    bar = a;
  });

  ee.emit('foo', 1, 2);
  assert.eql(n, 1);
  ee.pause();

  ee.emit('foo', 1, 2);
  assert.eql(n, 1);
  assert.ok(!bar);

  ee.emit('bar', true);
  ee.resume();
  assert.eql(n, 2);
  assert.eql(bar, true);

  ee.emit('foo', 1, 2);
  assert.eql(n, 3);

  ee.emit('bar', 'hello');
  assert.eql(bar, 'hello');
};
