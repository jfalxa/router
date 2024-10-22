/**
 * @template Data
 * @template {unknown[]} Args
 * @param {TaskFunction<Data, Args>} task
 * @param {Data} [initialData]
 * @returns {Task<Data, Args>}
 */
export function task(task, initialData) {
  return new Task(task, initialData);
}

/**
 * @template [Data=unknown]
 * @template {unknown[]} [Args=unknown[]]
 */
export class Task {
  #current = 0;
  #cacheKey = "";
  #task;

  /** @type {boolean} */
  loading = false;

  /** @type {Data | undefined} */
  data = undefined;

  /** @type {Error | undefined} */
  error = undefined;

  /**
   * @param {TaskFunction<Data, Args>} task
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
    this.#cacheKey = "";
    this.loading = true;
    this.data = undefined;
    this.error = undefined;
  }

  /**
   * @param {Args} args
   * @param {(task: TaskSnapshot<Data>) => void} [onChange]
   * @returns {TaskSnapshot<Data>}
   */
  cache(args, onChange) {
    const cacheKey = generateKey(args);

    if (cacheKey === this.#cacheKey) {
      return this.snapshot();
    }

    this.invalidate();
    this.#cacheKey = cacheKey;

    this.run(...args).then(() => {
      onChange?.(this.snapshot());
    });

    return this.snapshot();
  }

  /**
   * @param {Args} args
   * @returns {Promise<TaskSnapshot<Data>>}
   */
  run(...args) {
    const current = ++this.#current;

    this.loading = true;
    this.data = undefined;
    this.error = undefined;

    return this.#task(...args)
      .then((data) => {
        if (current === this.#current) {
          this.data = data;
          this.error = undefined;
        }
      })
      .catch((error) => {
        if (current === this.#current) {
          this.data = undefined;
          this.error = /** @type {Error} */ (error);
        }
      })
      .then(() => {
        if (current === this.#current) {
          this.loading = false;
        }

        return this.snapshot();
      });
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
 * @template Data
 * @template {unknown[]} Args
 * @typedef {(...args: Args) => Promise<Data>} TaskFunction
 */

/**
 * @template Data
 * @typedef {Object} TaskSnapshot
 * @property {boolean} loading
 * @property {Data} [data]
 * @property {Error} [error]
 */
