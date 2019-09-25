# pauseable.js

Pauseable allows you to pause event emitters, timeouts, and intervals. It can group multiple of these pauseable objects and pause entire groups.

[![Dependency Status](https://david-dm.org/fent/pauseable.js.svg)](https://david-dm.org/fent/pauseable.js)
[![codecov](https://codecov.io/gh/fent/pauseable.js/branch/master/graph/badge.svg)](https://codecov.io/gh/fent/pauseable.js)

# Usage

## Using pauseable with EventEmitter

```js
const pauseable = require('pauseable');
const EventEmitter = require('events').EventEmitter;

let ee = new EventEmitter();

ee.on('foo', () => { ... });

// ...later
pauseable.pause(ee);

// this event will not be immediately fired
// instead, it will be buffered
ee.emit('foo', 'hellow');

// ...much later
// the 'foo' event will be fired at this point
pauseable.resume(ee);
```

## Comes with pauseable setTimeout and setInterval too

```js
let timeout = pauseable.setTimeout(() => {
  // this will take 8 seconds total to execute
  // not 5
}, 5000);

// pause timeout after 2 secs
setTimeout(() => {
  timeout.pause();
  timeout.isPaused(); // true
  
  // resume after 3
  setTimeout(() => {
    timeout.resume();
  }, 3000);
}, 2000);
```

The `function` and `ms` arguments are interchangeable. Use whichever way you prefer!

```js
let interval = pauseable.setInterval(5000, () => {
  // this is called after 5 seconds
  // then paused for 2 seconds
  interval.pause(2000);
});
```

## Grouping

```js
// create a group
let g = pauseable.createGroup();

// make and add emitters to group
let ee1 = g.add(new EventEmitter());
let ee2 = g.add(new EventEmitter());

ee1.on('forth', () => {
  // pause entire group (that means ee1 and ee2) for 500 ms
  // timeout is out of the group by the time this executes
  g.pause(500);
  console.log('forth');
  ee2.emit('back');
});

ee2.on('back', () => {
  console.log('back');
  ee1.emit('forth');
});

let timeout = g.setTimeout(() => {
  ee2.emit('back', 'poop');
}, 1000);
```

# Motive

Javascript is event based by nature. When developing large scale applications that are completely event based, it becomes complicated to pause the streaming of events, because Javascript never "sleeps". It becomes even more complicated to pause timeouts and intervals, having to keep track of when they were paused so they can be resumed with the correct time again.

That's where this module comes in. Pauseable helps manage pausing and resuming your application or part of it. It works with `EventEmitter`, with `setInterval` and `setTimeout`.


# API

## Events
### pauseable.pause(ee, [ms])
Pauses an instance of EventEmitter. All events get buffered and emitted once the emitter is resumed. Currently only works with EventEmitters. Optional `ms` will pause only for that long.

### pauseable.resume(ee, [ms])
Resumes the emitter. Events can be emitted again. Optional `ms` will resume only for that long.


## Timers
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


## Groups
### pauseable.createGroup()
Creates a `group` where emitters and timers can be easily managed.

### group.add()
Add an emitter or a timer to the group. Returns added emitter/timer.

### group.setTimeout(fn, ms)
### group.setInterval(fn, ms)
Shortcut to create an instance of a timer and add it to the group.

### group.pause([ms])
Pauses all emitters and timers in the group.

### group.resume([ms])
Resumes all emitters and timers in the group.

### group.clear()
Clears timers in the group.

### group.isPaused()
Returns `true` is group is paused.

### group.isDone()
Returns `true` if all timers currently in the group are timeouts and their original function has been called or all timers have been cleared.

### group.timers()
Contains both emitters and timers. For if you want to micro manage more.


# Install

    npm install pauseable


# Tests
Tests are written with [mocha](https://mochajs.org)

```bash
npm test
```
