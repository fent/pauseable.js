var p = require('../.')
  , EventEmitter = require('events').EventEmitter
  ;


exports.group = function(beforeExit, assert) {
  var g = p.createGroup()
    , a = 0
    , b = 0
    , c = false
    ;
  
  var ee = g.add(new EventEmitter());
  ee.on('a', function() {
    a++;
  });

  g.setInterval(function() {
    ee.emit('a');
  }, 1000);

  g.setInterval(function() {
    b++;
  }, 1000);

  g.setTimeout(function() {
    c = true;
  }, 100);

  setTimeout(function() {
    assert.eql(g.timers().length, 3);
    g.pause(300);
    assert.eql(a, 1);
    assert.eql(b, 1);
  }, 1200);

  setTimeout(function() {
    g.clear();

    // EventEmitter will still be there
    assert.eql(g.timers().length, 1);
    assert.eql(a, 2);
    assert.eql(b, 2);
    assert.ok(c);
  }, 2600);
};
