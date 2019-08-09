const pauseable    = require('../.');
const EventEmitter = require('events').EventEmitter;


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

g.setTimeout(() => {
  ee2.emit('back', 'poop');
}, 1000);
