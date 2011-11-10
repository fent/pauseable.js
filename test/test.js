var p = require('../.');


exports.setTimeout = function(beforeExit, assert) {
  var yes = false;
  var timeout = p.setTimeout(function() {
    yes = true;
  }, 100);

  setTimeout(function() {
    assert.ok(!yes);
  }, 101);
  
  setTimeout(function() {
    timeout.pause();

    setTimeout(function() {
      assert.ok(!yes);
      timeout.resume()
    }, 51);
  }, 50);

  beforeExit(function() {
    assert.ok(yes);
    assert.ok(timeout.isDone());
  });
};


exports.interchangeableArguments = function(beforeExit, assert) {
  var yes = false;
  var timeout = p.setTimeout(30, function() {
    yes = true;
  });

  beforeExit(function() {
    assert.ok(yes);
  });
};


exports.setInterval = function(beforeExit, assert) {
  var n = 0;

  var interval = p.setInterval(function() {
    n++;
  }, 1000);

  setTimeout(function() {
    assert.eql(n, 1);
  }, 1001);

  setTimeout(function() {
    interval.pause(500);
  }, 1100);

  // n is still 1 because interval was paused
  setTimeout(function() {
    assert.eql(n, 1);
  }, 2001);

  setTimeout(function() {
    interval.clear();
    assert.eql(n, 2);
    assert.ok(interval.isDone());
  }, 2501);
};


exports.setTimeoutOnDone = function(beforeExit, assert) {
  var n = 0;

  var timeout = p.setTimeout(function() {
    n++;
  }, 100);

  timeout.onDone(function() {
    assert.eql(n, 1);
    n++;
  });

  beforeExit(function() {
    assert.eql(n, 2);
  });
};
