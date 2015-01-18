var p = require('..')
  , assert = require('assert')


describe('setInterval', function() {
  var n = 0;
  var interval;

  it('Calls given function on interval', function(done) {
    interval = p.setInterval(function() {
      n++;
    }, 100);

    setTimeout(function() {
      assert.equal(n, 1);
      done();
    }, 101);
  });

  describe('Pause for a given time', function() {

    it('Does not call given function since it was paused', function(done) {
      interval.pause(50);

      // n is still 1 because interval was paused
      setTimeout(function() {
        assert.equal(n, 1);
        assert.ok(!interval.isPaused());
        assert.ok(!interval.isDone());
        done();
      }, 100); // this will be called after `done` is called on the parent
    });

    it('Eventually resumes and keeps calling function', function(done) {
      setTimeout(function() {
        interval.clear();
        assert.equal(n, 2);
        assert.ok(!interval.isPaused());
        assert.ok(interval.isDone());
        done();
      }, 75);
    });

    it('Does not call again after being cleared', function(done) {
      setTimeout(function() {
        assert.equal(n, 2);
        assert.ok(interval.isDone());
        done();
      }, 100);
    });

  });
});
