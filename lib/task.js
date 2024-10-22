/**
 * @template {unknown[]} Args
 * @template Data
 * @param {TaskFunction<Args, Data>} task
 * @param {Data} [initialData]
 * @returns {Task<Args, Data>}
 */
export function task(task, initialData) {
  return new Task(task, initialData);
}

/**
 * @template {unknown[]} [Args=unknown[]]
 * @template [Data=unknown]
 */
export class Task {
  #currentRun = 0;
  #cacheKey = "";
  #task;

  /** @type {boolean} */
  loading = false;

  /** @type {Data | undefined} */
  data = undefined;

  /** @type {Error | undefined} */
  error = undefined;

  /**
   * @param {TaskFunction<Args, Data>} task
   * @param {Data} [initialData]
   */
  constructor(task, initialData) {
    this.#task = task;
    this.data = initialData;
  }

  /**
   * @returns {TaskSnapshot<Data>}
   */
  snapshot() {
    return { loading: this.loading, data: this.data, error: this.error };
  }

  invalidate() {
    this.#currentRun++;
    this.#cacheKey = "";
    this.loading = false;
    this.data = undefined;
    this.error = undefined;
  }

  /**
   * @param {Args} args
   * @param {TaskCallback<Data>} [callback]
   * @returns {Promise<TaskSnapshot<Data>>}
   */
  async run(args, callback) {
    const run = ++this.#currentRun;

    this.loading = true;
    this.data = undefined;
    this.error = undefined;

    callback?.(this.snapshot());

    try {
      const data = await this.#task(...args);
      if (run === this.#currentRun) {
        this.data = data;
        this.error = undefined;
      }
    } catch (error) {
      if (run === this.#currentRun) {
        this.data = undefined;
        this.error = /** @type {Error} */ (error);
      }
    } finally {
      if (run === this.#currentRun) {
        this.loading = false;
        callback?.(this.snapshot());
      }

      return this.snapshot();
    }
  }

  /**
   * @param {Args} args
   * @param {TaskCallback<Data>} [callback]
   * @returns {TaskSnapshot<Data>}
   */
  cache(args, callback) {
    const cacheKey = generateKey(args);

    if (cacheKey === this.#cacheKey) {
      return this.snapshot();
    }

    this.#cacheKey = cacheKey;
    this.run(args, callback);
    return this.snapshot();
  }
}

/**
 * @param {unknown} data
 */
function generateKey(data) {
  return btoa(
    JSON.stringify(data, (_, value) => {
      if (value instanceof URLSearchParams) return value.toString();
      else return value;
    })
  );
}

/**
 * @template {unknown[]} Args
 * @template Data
 * @typedef {(...args: Args) => Promise<Data>} TaskFunction
 */

/**
 * @template Data
 * @typedef {(snapshot: TaskSnapshot<Data>) => void} TaskCallback
 */

/**
 * @template Data
 * @typedef {Object} TaskSnapshot
 * @property {boolean} loading
 * @property {Data} [data]
 * @property {Error} [error]
 */
