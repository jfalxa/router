export class Task {
  #task;
  #current = 0;

  constructor(task, initialData) {
    this.#task = task;
    this.loading = false;
    this.error = undefined;
    this.data = initialData;
  }

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
        this.error = error;
      }
    } finally {
      if (current === this.#current) {
        this.loading = false;
      }
    }

    return { data: this.data, error: this.error };
  }
}
