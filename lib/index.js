var util = require('util')
  , EventEmitter = require('events').EventEmitter
  ;


var Emitter = exports.EventEmitter = function() {
  this.paused = false;
  this._bufferedEvents = [];
  EventEmitter.call(this);
};

util.inherits(Emitter, EventEmitter);

Emitter.prototype.pause = function(ms) {
  if (this.paused) return;
  this.paused = true;
  
  this._oldEmitter = this.emit;
  this.emit = function() {
    this._bufferedEvents.push(arguments);
  };

  if (ms) {
    var self = this;
    setTimeout(function() { self.resume.call(self) }, ms);
  }
};

Emitter.prototype.resume = function(ms) {
  if (!this.paused) return;
  this.paused = false;

  this.emit = this._oldEmitter;
  for (var i = this._bufferedEvents.length - 1; i >= 0; i--) {
    this.emit.apply(this, this._bufferedEvents.pop());
  }

  if (ms) {
    setTimeout(this.pause, ms);
  }
};


exports.createGroup = function() {
  var timers = []
    , paused = false
    , done = false
    ;

  return {
    EventEmitter: function() {
      var ee = new Emitter();
      timers.push(ee);
      return ee;
    }

  , setTimeout: function(fn, ms) {
      var id = exports.setTimeout(fn, ms);
      timers.push(id);
      id.onDone(function() {
        timers.splice(timers.indexOf(id), 1);
        if (timers.length === 0) {
          done = true;
        }
      })
      return id;
    }

  , setInterval: function(fn, ms) {
      var id = exports.setInterval(fn, ms);
      timers.push(id);
      id.onDone(function() {
        timers.splice(timers.indexOf(id), 1);
        if (timers.length === 0) {
          done = true;
        }
      })
      return id;
    }

  , pause: function(resumeIn) {
      for (var i = 0; i < timers.length; i++) {
        timers[i].pause(resumeIn);
      }
      paused = true;
    }

  , resume: function(pauseIn) {
      for (var i = 0; i < timers.length; i++) {
        timers[i].resume(pauseIn);
      }
      paused = false;
    }

  , clear: function() {
      for (var i = timers.length - 1; i >= 0; i--) {
        if (typeof(timers[i].clear) === 'function') {
          timers[i].clear();
        }
      }
    }

  , isPaused: function() {
      return paused;
    }

  , isDone: function() {
      return done;
    }
  
  , timers: function() {
      return timers;
    }
  };
};


exports.setTimeout = function(fn, ms) {
  return timer(setTimeout, clearTimeout, fn, ms);
};

exports.setInterval = function(fn, ms) {
  return timer(setInterval, clearInterval, fn, ms);
};


// gets the ms difference between given time and now
// then subtract that from ms
// should not return negative
var diff = function(time, ms) {
  return ms - (Date.now() - time);
}

var timer = function(type, clear, fn, ms) {
  // allow fn and ms arguments to be switchabale
  // let the user decide the syntax
  if (typeof(fn) !== 'function') {
    var tmp = fn;
    fn = ms;
    ms = tmp;
  }

  var done = false
    , start = Date.now()
    , resumeTime
    , paused
    , finished
    ;

  var wrapper = function() {
    start = Date.now();
    fn.apply();
    if (type === setTimeout) {
      done = true;
      if (typeof(finished) == 'function') {
        finished.apply();
      }
    } else if (resumeTime) {
      id = setInterval(wrapper, ms);
    }
  };

  var id = type(wrapper, ms);

  return {
    pause: function(resumeIn) {
      if (done || paused) return;
      clear(id);
      paused = true;
      if (resumeIn) {
        setTimeout(this.resume, resumeIn);
      }
      return resumeTime = diff(start, ms);
    }

  , resume: function(pauseIn) {
      if (done || !paused) return;
      start = Date.now();
      if (pauseIn) {
        setTimeout(this.pause, pauseIn);
      }

      // calling setTimeout here and not type because
      // calling setInterval with the remaining time will continue to
      // call setInterval with that lesser time
      id = setTimeout(wrapper, resumeTime);
    }

  , next: function() {
      return paused ? resumeTime : diff(start, ms);
    }

  , clear: function() {
      if (done) return;
      clear(id);
      done = true;
      if (typeof(finished) == 'function') {
        finished.apply();
      }
    }

  , isPaused: function() {
    return paused;
  }

  , isDone: function() {
      return done;
    }

  , onDone: function(fn) {
    finished = fn;
  }
  };
};
