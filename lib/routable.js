import { compileInvalidatePattern, join } from "./utils";
import { Task } from "./task";

/**
 * @template Component
 * @template Data
 * @template {import("./router").Actions} Actions
 * @typedef {Object} RoutableInit
 * @property {import("./router").Router<Component>} [router]
 * @property {import("./route-group").RouteGroup<Component>} [parent]
 * @property {string} [path]
 * @property {string} [slot]
 * @property {Component} [fallback]
 * @property {import("./router").Load<Data>} [load]
 * @property {Actions} [actions]
 */

/**
 * @template Component
 * @template [Data=unknown]
 * @template {import("./router").Actions} [Actions=import("./router").Actions]
 */
export class Routable {
  #invalidatePattern;

  /**
   * @param {RoutableInit<Component, Data, Actions>} routeInit
   */
  constructor(routeInit = {}) {
    this.router = /** @type {import("./router").Router<Component>} */ (routeInit.router);
    this.parent = /** @type {import("./route-group").RouteGroup<Component>} */ (routeInit.parent);

    this.path = routeInit.path ?? "";
    this.slot = routeInit.slot;
    this.fullPath = routeInit.path ?? "";
    this.fallback = routeInit.fallback;

    this.pattern = new URLPattern({ pathname: this.getPattern() });
    this.#invalidatePattern = compileInvalidatePattern(this.fullPath);

    if (routeInit.load) {
      this.load = new Task(routeInit.load);
    }

    if (routeInit.actions) {
      this.actions = /** @type {Record<string, Task>} */ ({});
      for (const action in routeInit.actions) {
        this.actions[action] = new Task(routeInit.actions[action]);
      }
    }
  }

  /**
   * @param {string} pathname
   */
  invalidate(pathname) {
    if (this.#invalidatePattern.test(pathname)) {
      this.load?.invalidate();
      for (const action in this.actions) {
        this.actions[action].invalidate();
      }
    }
  }

  /**
   * @param {string} pathname
   * @returns {import("./router").Params}
   */
  match(pathname) {
    return /** @type {import("./router").Params} */ (
      this.pattern.exec({ pathname })?.pathname.groups
    );
  }

  /**
   * @param {import("./router").LoadArgs} args
   * @returns {import("./task").TaskSnapshot<Data>}
   */
  getData(args) {
    if (this.load) {
      return this.load.cache([args], this.router.requestUpdate);
    } else {
      return Task.snapshot(undefined);
    }
  }

  getActions() {
    /** @type {Record<string, import("./router").Action>} */
    const actions = {};

    for (const name in this.actions) {
      const task = this.actions[name];

      /** @type {import("./router").Action} */
      const action = (...args) => task.run(args, this.router.requestUpdate);

      action.loading = task.loading;
      action.data = task.data;
      action.error = task.error;

      actions[name] = action;
    }

    return actions;
  }

  getPattern() {
    return this.fullPath;
  }

  /**
   * @param {import("./route-group").RouteGroup<Component>} parent
   */
  setParent(parent) {
    this.parent = parent;
    this.router = parent.router;
    this.fullPath = join(parent.fullPath, this.path);
    this.#invalidatePattern = compileInvalidatePattern(this.fullPath);

    this.pattern = !this.slot //
      ? new URLPattern({ pathname: this.getPattern() })
      : parent.pattern;
  }
}
