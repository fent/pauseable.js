export interface PauseableEmitter {
  paused?: boolean;
  emit(event: string | symbol, ...args: unknown[]): boolean;
  listenerCount?(event: string | symbol): number;
}

interface InternalPauseableEmitter extends PauseableEmitter {
  _bufferedEvents?: [string | symbol, ...unknown[]][];
  _oldEmit?: (event: string | symbol, ...args: unknown[]) => boolean;
}

export interface Timer {
  pause(resumeIn?: number): number | undefined;
  resume(pauseIn?: number): void;
  next(): number;
  clear(): void;
  isPaused(): boolean | undefined;
  isDone(): boolean;
}

interface InternalTimer extends Timer {
  _onDone(fn: () => void): void;
}

export type GroupItem = Timer | PauseableEmitter;

type InternalGroupItem = GroupItem & {
  _onDone?: (fn: () => void) => void;
};

export interface Group {
  add<T extends GroupItem>(item: T): T;
  setTimeout(fn: () => void, ms?: number): Timer;
  setTimeout(ms: number, fn: () => void): Timer;
  setInterval(fn: () => void, ms?: number): Timer;
  setInterval(ms: number, fn: () => void): Timer;
  pause(resumeIn?: number): void;
  resume(pauseIn?: number): void;
  clear(): void;
  isPaused(): boolean;
  isDone(): boolean;
  timers(): GroupItem[];
}

export function pause(ee: PauseableEmitter, ms?: number): void {
  const target = ee as InternalPauseableEmitter;
  if (target.paused) return;
  target.paused = true;
  if (!target._bufferedEvents) {
    target._bufferedEvents = [];
  }
  const buffered = target._bufferedEvents;

  target._oldEmit = target.emit;
  target.emit = (event: string | symbol, ...args: unknown[]) => {
    buffered.push([event, ...args]);
    if (typeof target.listenerCount === 'function') {
      return target.listenerCount(event) > 0;
    }
    return true;
  };

  if (ms) {
    globalThis.setTimeout(() => {
      resume(ee);
    }, ms);
  }
}

export function resume(ee: PauseableEmitter, ms?: number): void {
  const target = ee as InternalPauseableEmitter;
  if (!target.paused) return;
  target.paused = false;

  if (target._oldEmit) {
    target.emit = target._oldEmit;
  }
  if (target._bufferedEvents) {
    // Swap the buffer so events emitted during replay, including from a
    // listener that pauses again, stay isolated from this replay.
    const buffered = target._bufferedEvents;
    target._bufferedEvents = [];
    for (const eventArgs of buffered) {
      const [event, ...args] = eventArgs;
      target.emit(event, ...args);
    }
  }

  if (ms) {
    globalThis.setTimeout(() => {
      pause(ee);
    }, ms);
  }
}

function isEmitter(item: GroupItem): item is PauseableEmitter {
  return 'emit' in item && typeof item.emit === 'function';
}

function dispatchGroupAction(
  items: GroupItem[],
  action: 'pause' | 'resume',
  emitterFn: (ee: PauseableEmitter, delay?: number) => void,
  delay?: number,
): void {
  for (const item of items) {
    if (isEmitter(item)) {
      emitterFn(item, delay);
    } else {
      item[action](delay);
    }
  }
}

export function createGroup(): Group {
  const timers: GroupItem[] = [];
  let paused = false;
  let done = false;

  const group: Group = {
    add(item) {
      const internal = item as InternalGroupItem;
      if (typeof internal._onDone === 'function') {
        internal._onDone(() => {
          timers.splice(timers.indexOf(item), 1);
          if (timers.length === 0) {
            done = true;
          }
        });
      }

      timers.push(item);
      return item;
    },

    setTimeout(
      fnOrMs: (() => void) | number,
      msOrFn?: (() => void) | number,
    ): Timer {
      if (typeof fnOrMs === 'function') {
        return this.add(setTimeout(fnOrMs, msOrFn as number | undefined));
      }
      return this.add(setTimeout(fnOrMs, msOrFn as () => void));
    },

    setInterval(
      fnOrMs: (() => void) | number,
      msOrFn?: (() => void) | number,
    ): Timer {
      if (typeof fnOrMs === 'function') {
        return this.add(setInterval(fnOrMs, msOrFn as number | undefined));
      }
      return this.add(setInterval(fnOrMs, msOrFn as () => void));
    },

    pause(resumeIn) {
      dispatchGroupAction(timers, 'pause', pause, resumeIn);
      paused = true;
    },

    resume(pauseIn) {
      dispatchGroupAction(timers, 'resume', resume, pauseIn);
      paused = false;
    },

    clear() {
      for (let i = timers.length - 1; i >= 0; i--) {
        const item = timers[i];
        if (!isEmitter(item)) {
          item.clear();
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
    },
  };

  return group;
}

type ScheduleFn = typeof globalThis.setTimeout | typeof globalThis.setInterval;
type ClearFn = typeof globalThis.clearTimeout | typeof globalThis.clearInterval;

function timer(
  scheduleFn: ScheduleFn,
  clearFn: ClearFn,
  fn: (() => void) | number,
  ms?: (() => void) | number,
): Timer {
  let fnCallback: () => void;
  let msDelay: number;

  if (typeof fn !== 'function') {
    fnCallback = ms as () => void;
    msDelay = fn;
  } else {
    fnCallback = fn;
    msDelay = ms as number;
  }

  let done = false;
  let countdownStart = Date.now();
  let nextTime = msDelay;
  let paused: boolean | undefined;
  let finished: (() => void) | undefined;
  let resumed = false;
  let id: NodeJS.Timeout;

  const wrapper = () => {
    countdownStart = Date.now();
    nextTime = msDelay;
    fnCallback();
    if (done) return;
    if (scheduleFn === globalThis.setTimeout) {
      done = true;
      if (typeof finished === 'function') {
        finished();
      }
    } else if (resumed) {
      resumed = false;
      id = globalThis.setInterval(wrapper, msDelay);
    }
  };

  id = scheduleFn(wrapper, msDelay);

  const timerObj: InternalTimer = {
    pause(resumeIn?: number) {
      if (done || paused) return;
      clearFn(id);
      paused = true;
      if (resumeIn) {
        globalThis.setTimeout(this.resume, resumeIn);
      }
      nextTime -= Date.now() - countdownStart;
      return nextTime;
    },

    resume(pauseIn?: number) {
      if (done || !paused) return;
      paused = false;
      resumed = true;
      countdownStart = Date.now();
      if (pauseIn) {
        globalThis.setTimeout(this.pause, pauseIn);
      }

      // Calling setTimeout here and not type because
      // calling setInterval with the remaining time will continue to
      // call setInterval with that lessened time.
      id = globalThis.setTimeout(wrapper, nextTime);
    },

    next() {
      return nextTime - (paused ? 0 : Date.now() - countdownStart);
    },

    clear() {
      if (done) return;
      if (resumed) {
        globalThis.clearTimeout(id);
      } else {
        clearFn(id);
      }
      done = true;
      if (typeof finished === 'function') {
        finished();
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
    },
  };

  return timerObj;
}

export function setTimeout(fn: () => void, ms?: number): Timer;
export function setTimeout(ms: number, fn: () => void): Timer;
export function setTimeout(
  fn: (() => void) | number,
  ms?: (() => void) | number,
): Timer {
  return timer(globalThis.setTimeout, globalThis.clearTimeout, fn, ms);
}

export function setInterval(fn: () => void, ms?: number): Timer;
export function setInterval(ms: number, fn: () => void): Timer;
export function setInterval(
  fn: (() => void) | number,
  ms?: (() => void) | number,
): Timer {
  return timer(globalThis.setInterval, globalThis.clearInterval, fn, ms);
}

export default {
  pause,
  resume,
  createGroup,
  setTimeout,
  setInterval,
};
