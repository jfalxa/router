/**
 * @template Data
 * @template Args
 * @param {TaskFunction<Data, Args>} task
 * @param {Data} [initialData]
 * @returns {Task<Data, Args>}
 */
export function task(task, initialData) {
  return new Task(task, initialData);
}

/**
 * @template Data
 * @template Args
 */
export class Task {
  #current = 0;

  /** @type {TaskFunction<Data, Args>} */
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
   * @template Data
   * @param {Data | undefined} [data]
   * @param {Error | undefined} [error]
   * @param {boolean} [loading]
   * @returns {TaskSnapshot<Data>}
   */
  static snapshot(data, error = undefined, loading = false) {
    return { loading, data, error };
  }

  /**
   * @param {Args} args
   * @returns {Promise<TaskSnapshot<Data>>}
   */
  async run(args) {
    const current = ++this.#current;

    this.loading = true;
    this.data = undefined;
    this.error = undefined;

    try {
      const data = await this.#task(args);

      if (current === this.#current) {
        this.data = data;
        this.error = undefined;
      }
    } catch (error) {
      if (current === this.#current) {
        this.data = undefined;
        this.error = /** @type {Error} */ (error);
      }
    } finally {
      if (current === this.#current) {
        this.loading = false;
      }
    }

    return Task.snapshot(this.data, this.error);
  }
}

/**
 * @template Data
 * @template Args
 * @typedef {(args: Args) => Promise<Data>} TaskFunction
 */

/**
 * @template Data
 * @typedef {{ loading: boolean, data: Data | undefined; error: Error | undefined }} TaskSnapshot
 */
