exports.pause = (ee, ms) => {
  if (ee.paused) return;
  ee.paused = true;
  if (typeof ee._bufferedEvents === 'undefined') {
    ee._bufferedEvents = [];
  }
  
  ee._oldEmit = ee.emit;
  ee.emit = function() {
    ee._bufferedEvents.push(arguments);
  };

  if (ms) {
    setTimeout(() => { exports.resume(ee); }, ms);
  }
};

exports.resume = (ee, ms) => {
  if (!ee.paused) return;
  ee.paused = false;

  ee.emit = ee._oldEmit;
  for (var i = ee._bufferedEvents.length - 1; i >= 0; i--) {
    ee.emit.apply(ee, ee._bufferedEvents.pop());
  }

  if (ms) {
    setTimeout(() => { exports.pause(ee); }, ms);
  }
};


exports.createGroup = () => {
  var timers = [];
  var paused = false;
  var done = false;

  return {
    add(id) {
      if (typeof id._onDone === 'function') {
        id._onDone(() => {
          timers.splice(timers.indexOf(id), 1);
          if (timers.length === 0) {
            done = true;
          }
        });
      }

      timers.push(id);
      return id;
    },

    setTimeout(fn, ms) {
      return this.add(exports.setTimeout(fn, ms));
    },

    setInterval(fn, ms) {
      return this.add(exports.setInterval(fn, ms));
    },

    pause(resumeIn) {
      for (var i = 0; i < timers.length; i++) {
        var id = timers[i];
        if (typeof id.emit === 'function') {
          exports.pause(id, resumeIn);
        } else {
          id.pause(resumeIn);
        }
      }
      paused = true;
    },

    resume(pauseIn) {
      for (var i = 0; i < timers.length; i++) {
        var id = timers[i];
        if (typeof id.emit === 'function') {
          exports.resume(id, pauseIn);
        } else {
          id.resume(pauseIn);
        }
      }
      paused = false;
    },

    clear() {
      for (var i = timers.length - 1; i >= 0; i--) {
        if (typeof timers[i].clear === 'function') {
          timers[i].clear();
        }
      }
    },

    isPaused() {
      return paused;
    },

    isDone() {
      return done;
    },
  
    timers() {
      return timers;
    }
  };
};

var timer = (type, clear, fn, ms) => {
  // allow fn and ms arguments to be switchabale
  // let the user decide the syntax
  if (typeof fn !== 'function') {
    var tmp = fn;
    fn = ms;
    ms = tmp;
  }

  var done = false;
  var countdownStart = Date.now();
  var nextTime = ms;
  var paused;
  var finished;
  var resumed;

  var wrapper = () => {
    countdownStart = Date.now();
    nextTime = ms;
    fn.apply();
    if (type === setTimeout) {
      done = true;
      if (typeof finished === 'function') {
        finished.apply();
      }
    } else if (resumed) {
      resumed = false;
      id = setInterval(wrapper, ms);
    }
  };

  var id = type(wrapper, ms);

  return {
    pause(resumeIn) {
      if (done || paused) return;
      clear(id);
      paused = true;
      if (resumeIn) {
        setTimeout(this.resume, resumeIn);
      }
      return nextTime -= Date.now() - countdownStart;
    },

    resume(pauseIn) {
      if (done || !paused) return;
      paused = false;
      resumed = true;
      countdownStart = Date.now();
      if (pauseIn) {
        setTimeout(this.pause, pauseIn);
      }

      // calling setTimeout here and not type because
      // calling setInterval with the remaining time will continue to
      // call setInterval with that lessened time
      id = setTimeout(wrapper, nextTime);
    },

    next() {
      return nextTime - (paused ? 0 : Date.now() - countdownStart);
    },

    clear() {
      if (done) return;
      if (resumed) {
        clearTimeout(id);
      } else {
        clear(id);
      }
      done = true;
      if (typeof finished === 'function') {
        finished.apply();
      }
    },

    isPaused() {
      return paused;
    },

    isDone() {
      return done;
    },

    _onDone(fn) {
      finished = fn;
    }
  };
};

exports.setTimeout = (fn, ms) => {
  return timer(setTimeout, clearTimeout, fn, ms);
};

exports.setInterval = (fn, ms) => {
  return timer(setInterval, clearInterval, fn, ms);
};
