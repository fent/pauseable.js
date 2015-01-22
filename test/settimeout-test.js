var p = require('..')
  , assert = require('assert')


describe('setTimeout', function() {
  it('Calls given function after some time', function(done) {
    var yes = false;
    var timeout = p.setTimeout(function() {
      yes = true;
    }, 100);

    setTimeout(function() {
      assert.ok(yes);
      assert.ok(!timeout.isPaused());
      assert.ok(timeout.isDone());
      done();
    }, 101);
  });

  describe('Pause', function() {
    var yes = false;
    var timeout;

    it('Does not call function', function(done) {
      timeout = p.setTimeout(function() {
        yes = true;
      }, 200);

      setTimeout(function() {
        timeout.pause();
        var next = timeout.next();
        assert.ok(next > 50 && next <= 100);

        setTimeout(function() {
          assert.ok(!yes);
          assert.ok(timeout.isPaused());
          assert.ok(!timeout.isDone());
          assert.equal(timeout.next(), next);
          done();
        }, 100);
      }, 100);
    });

    describe('Resume after some time', function() {
      it('Calls function', function(done) {
        timeout.resume();
        assert.ok(timeout.next() < 200);
        timeout.pause();
        assert.ok(timeout.next() < 200);
        timeout.resume();
        assert.ok(timeout.next() < 200);

        setTimeout(function() {
          assert.ok(yes);
          assert.ok(!timeout.isPaused());
          assert.ok(timeout.isDone());
          done();
        }, 150);
      });
    });

  });

  describe('Pause for some time', function() {
    var yes = false;
    var timeout;

    it('Does not call function in time', function() {
      timeout = p.setTimeout(function() {
        yes = true;
      }, 100);

      timeout.pause(200);

      assert.ok(!yes);
      assert.ok(timeout.isPaused());
      assert.ok(!timeout.isDone());
    });

    it('Calls function after resumed again', function(done) {
      setTimeout(function() {
        assert.ok(yes);
        assert.ok(!timeout.isPaused());
        assert.ok(timeout.isDone());
        done();
      }, 350);
    });
  });

  describe('interchangeableArguments', function() {
    var yes = false;
    var timeout = p.setTimeout(30, function() {
      yes = true;
    });

    it('Still calls function', function(done) {
      setTimeout(function() {
        assert.ok(yes);
        assert.ok(timeout.isDone());
        done();
      }, 31);
    });
  });

  describe('OnDone', function() {
    var yes = false;
    var ondone = false;
    var timeout = p.setTimeout(function() {
      yes = true;
    }, 100);

    timeout.onDone(function() {
      ondone = true;
    });

    it('Function passed to onDone is called when done', function(done) {
      setTimeout(function() {
        assert.ok(yes);
        assert.ok(ondone);
        done();
      }, 101);
    });
  });

});
