export class Task {
  #task;
  #current = 0;

  constructor(task, initialData) {
    this.loading = false;
    this.error = undefined;
    this.data = initialData;

    this.#task = task;
  }

  async run() {
    const current = ++this.#current;

    this.loading = true;

    try {
      const data = await this.#task();

      if (current === this.#current) {
        this.data = data;
        this.error = undefined;
      }
    } catch (error) {
      if (current === this.#current) {
        this.data = undefined;
        this.error = error;
      }
    } finally {
      if (current === this.#current) {
        this.loading = false;
      }
    }

    return { data: this.data, error: this.error };
  }

  snapshot() {
    return {
      loading: this.loading,
      data: this.data,
      error: this.error,
    };
  }
}
