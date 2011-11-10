Install
------------

    npm install pauseable


Why
-------
Javascript is event based by nature. When developing large scale applications that are completely event based, it's complicated to pause the streaming of events, because Javascript never "sleeps". It becomes even more complicated to pause timeouts and intervals keeping track of when they were paused so they can be resumed with the correct time again.

That's where this module comes in. Pauseable helps manage pausing and resuming your applicataion or part of it. It works with EventEmitter and with setInterval and setTimeout.


Usage
------------------
Using a pauseable EventEmitter

```javascript
var pauseable = require('pauseable');

var ee = new pauseabale.EventEmitter();

ee.on('foo', function() { ... });

// ...later
ee.pause();

// this event will not be immediately fired
// instead, it will be buffered
ee.emit('foo', 'hellow');

// ...much later
// the 'foo' event will be fired at this point
ee.resume();
```

Comes with pauseable setTimeout and setInterval too

```javascript
var timeout = pauseable.setTimeout(function() {
  // this will take 8 seconds total to execute
  // not 5
}, 5000);

// pause timeout after 2 secs
setTimeout(function() {
  timeout.pause();
  timeout.isPaused(); // true
  
  // resume after 3
  setTimeout(function() {
    timeout.resume();
  }, 3000);
}, 2000);
```

The `function` and `ms` arguments are interchangeable. Use whichever way you prefer!

```javascript
var interval = pauseable.setInterval(5000, function() {
  // this is called after 5 seconds
  // then paused for 2 seconds
  interval.pause(2000);
});
```

Grouping

```javascript
// create a group
var g = pauseable.createGroup();

var ee1 = g.EventEmitter();
var ee2 = g.EventEmitter();

ee1.on('forth', function() {
  // pause entire group (that means ee1 and ee2) for 500 ms
  // timeout is out of the group by the time this executes
  g.pause(500);
  ee2.emit('back');
});

ee2.on('back', function() {
  ee1.emit('forth');
});

var timeout = g.setTimeout(function() {
  ee.emit('back', 'poop');
}, 1000);
```


API
---
### new pauseable.EventEmitter()
Creates a new instance of an EventEmitter that is pauseable.

### emitter.pause()
Pauses events. All events get buffered and emitted once the emitter is resumed.

### emitter.resume()
Resumes the emitter. Events can be emitted again.

### pauseable.setTimeout(fn, ms) and pauseable.setInterval(fn, ms)
Creates a pauseable timeout or interval. `fn` and `ms` are interchangeabale. Returns an instance of timer.

### timer.pause([ms])
Pauses timer. Optional `ms` will pause the timer only for that amount.

### timer.resume([ms])
Resumes timer. Optional `ms` will resume the timer only for that amount.

### timer.next()
Returns the number of ms left until the `fn` function in the constructor gets called again.

### timer.clear()
Clears timeout. Can no longer be resumed.

### timer.isPaused()
Returns `true` if timer is currently paused.

### timer.isDone()
Returns `true` if timer was a timeout and `fn` was called, or `timer.clear()` has been called.

### timer.onDone(callback)
If timer is a timeout, this can be used to execute the `callback` when the `fn` in the constructor is called.

### pauseable.createGroup()
Creates an `group` where emitters and timers can be easily managed.

### group.EventEmitter()
Creates and returns and instance of a pauseable `EventEmitter` and adds it to the group.

### group.setTimeout(fn, ms)
### group.setInterval(fn, ms)
Creates an instance of a timer anad adds it to the group.

### group.pause([ms])
Pauses all emitters and timers in the group.

### group.resume([ms])
Resumes all emitters and timers in the group.

### group.clear()
Clears timers in the group.

### group.isPaused()
Returns `true` is group is paused.

### group.isDone()
returns `true` if all timers in the group are timeouts and their original function has been called or all timers have been cleared.

### group.timers()
Contains both emitters and timers. Useful if you want to micro manage more.
