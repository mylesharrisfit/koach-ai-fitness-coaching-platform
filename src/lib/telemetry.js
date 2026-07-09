/**
 * Lightweight operational-event surface. This is the seam the Nova event layer
 * will hook into — for now it fans out to a console sink in dev and no-ops in
 * production. Keep call sites declarative: `track('nav.click', { path })`.
 *
 * TODO(nova): replace the sink with the real Nova event transport and add a
 * durable queue + batching. Do not change the `track(event, props)` signature —
 * call sites across the app depend on it.
 */

/** @typedef {Record<string, unknown>} EventProps */

/** @type {Array<(event: string, props: EventProps) => void>} */
const sinks = [];

if (typeof import.meta !== 'undefined' && import.meta.env && import.meta.env.DEV) {
  sinks.push((event, props) => {
    // eslint-disable-next-line no-console
    console.debug('[telemetry]', event, props);
  });
}

/**
 * Record an operational event (nav usage, command-palette invocations, AI action
 * calls, theme/brand changes, …).
 * @param {string} event dot-namespaced event name, e.g. 'command.invoke'
 * @param {EventProps} [props]
 */
export function track(event, props = {}) {
  for (const sink of sinks) {
    try { sink(event, props); } catch { /* never let telemetry break the app */ }
  }
}

/** Register an additional sink (used by the future Nova transport). */
export function addTelemetrySink(sink) {
  sinks.push(sink);
  return () => {
    const i = sinks.indexOf(sink);
    if (i >= 0) sinks.splice(i, 1);
  };
}
