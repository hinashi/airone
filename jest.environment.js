/**
 * Custom Jest environment that fixes a crash in jsdom's queueMicrotask
 * error handler when callbacks throw after the document has been torn down.
 *
 * Root cause: jsdom's window.queueMicrotask calls
 *   reportException(window, e, window.location.href)
 * on errors, but window.location accesses window._document which is null
 * after jsdom teardown. This manifests as:
 *   TypeError: Cannot read properties of null (reading '_location')
 */

const FixedJsDomEnvironment = require("jest-fixed-jsdom");

// Capture native queueMicrotask at module load time (Node.js context,
// before jsdom sets up its own globals).
const nativeQueueMicrotask = globalThis.queueMicrotask;

class SafeJsDomEnvironment extends FixedJsDomEnvironment {
  async setup() {
    await super.setup();

    const win = this.global;

    // Replace jsdom's queueMicrotask with one that won't crash when
    // an error occurs after the document has been torn down.
    win.queueMicrotask = function (callback) {
      nativeQueueMicrotask(() => {
        try {
          callback();
        } catch (e) {
          // Only report if the document is still alive
          if (win.document !== null) {
            console.error("Unhandled error in queueMicrotask:", e);
          }
        }
      });
    };
  }
}

module.exports = SafeJsDomEnvironment;
