import assert from 'node:assert';
import pauseableDefault, {
  createGroup,
  pause,
  resume,
  setInterval,
  setTimeout,
} from '../src';

describe('Module exports', () => {
  it('provides default export matching named exports', () => {
    assert.strictEqual(typeof pauseableDefault, 'object');
    assert.strictEqual(pauseableDefault.pause, pause);
    assert.strictEqual(pauseableDefault.resume, resume);
    assert.strictEqual(pauseableDefault.createGroup, createGroup);
    assert.strictEqual(pauseableDefault.setTimeout, setTimeout);
    assert.strictEqual(pauseableDefault.setInterval, setInterval);
  });

  it('supports CommonJS require against dist bundle', () => {
    const cjs = require('../dist');
    assert.strictEqual(typeof cjs.pause, 'function');
    assert.strictEqual(typeof cjs.resume, 'function');
    assert.strictEqual(typeof cjs.createGroup, 'function');
    assert.strictEqual(typeof cjs.setTimeout, 'function');
    assert.strictEqual(typeof cjs.setInterval, 'function');
    assert.strictEqual(typeof cjs.default, 'object');
    assert.strictEqual(cjs.default.pause, cjs.pause);
  });
});
