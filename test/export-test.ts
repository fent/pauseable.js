import assert from 'node:assert';
import p, {
  createGroup,
  pause,
  setInterval as pauseableSetInterval,
  setTimeout as pauseableSetTimeout,
  resume,
} from '..';

describe('Exports', () => {
  it('Exposes default and named exports', () => {
    assert.strictEqual(p.pause, pause);
    assert.strictEqual(p.resume, resume);
    assert.strictEqual(p.createGroup, createGroup);
    assert.strictEqual(p.setTimeout, pauseableSetTimeout);
    assert.strictEqual(p.setInterval, pauseableSetInterval);
  });
});
