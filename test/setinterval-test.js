var p = require('..')
  , assert = require('assert')


describe('setInterval', function() {
  var n = 0;
  var interval;

  it('Calls given function on interval', function(done) {
    interval = p.setInterval(function() {
      n++;
    }, 1000);

    setTimeout(function() {
      assert.equal(n, 1);
      done();
    }, 1001);
  });

  describe('Pause for a given time', function() {

    it('Does not call given function since it was paused', function(done) {
      interval.pause(500);

      // n is still 1 because interval was paused
      setTimeout(function() {
        assert.equal(n, 1);
        assert.ok(!interval.isPaused());
        assert.ok(!interval.isDone());
        done();
      }, 1000); // this will be called after `done` is called on the parent
    });

    it('Eventually resumes and keeps calling function', function(done) {
      setTimeout(function() {
        interval.clear();
        assert.equal(n, 2);
        assert.ok(!interval.isPaused());
        assert.ok(interval.isDone());
        done();
      }, 750);
    });

  });
});
