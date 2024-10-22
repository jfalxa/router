import { compileInvalidatePattern, join } from "./router";
import { Task } from "./task";

/**
 * @template Component
 * @template Data
 * @template {import("./router").Actions} Actions
 * @typedef {Object} RouteInit
 * @property {import("./router").Router<Component>} [router]
 * @property {import("./route-group").RouteGroup<Component>} [parent]
 * @property {string} [path]
 * @property {string} [slot]
 * @property {Component} [page]
 * @property {Component} [fallback]
 * @property {import("./router").Load<Data>} [load]
 * @property {import("./router").LazyPage<Component>} [lazy]
 * @property {Actions} [actions]
 */

/**
 * @template Component
 * @template Data
 * @template {import("./router").Actions} Actions
 * @param {RouteInit<Component, Data, Actions>} routeInit
 * @return
 */
export function createRoute(routeInit) {
  return new Route(routeInit);
}

/**
 * @template Component
 * @template [Data=unknown]
 * @template {import("./router").Actions} [Actions=import("./router").Actions]
 */
export class Route {
  #actions;
  #invalidatePattern;

  /**
   * @param {RouteInit<Component, Data, Actions>} routeInit
   */
  constructor(routeInit = {}) {
    this.router = /** @type {import("./router").Router<Component>} */ (routeInit.router);
    this.parent = /** @type {import("./route-group").RouteGroup<Component>} */ (routeInit.parent);

    this.path = routeInit.path ?? "";
    this.slot = routeInit.slot;
    this.fullPath = routeInit.path ?? "";
    this.page = routeInit.page ?? undefined;
    this.fallback = routeInit.fallback;

    this.pattern = new URLPattern({ pathname: this.fullPath });
    this.#invalidatePattern = compileInvalidatePattern(this.fullPath);

    if (routeInit.load) {
      this.load = new Task(routeInit.load);
    }

    if (routeInit.lazy) {
      const lazy = routeInit.lazy;
      this.lazy = new Task(() => lazy().then((module) => module.default));
    }

    if (routeInit.actions) {
      this.#actions = routeInit.actions;
      /** @type {Record<string, import("./router").Action>} */
      this.actions = {};
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
   *
   * @param {string} pathname
   * @returns {import("./router").RouteNode<Component> | undefined}
   */
  resolve(pathname) {
    if (!this.pattern.test({ pathname })) {
      return;
    }

    const { $$nested, ...params } = this.match(pathname);
    const searchParams = new URLSearchParams(location.search);

    const page = this.getPage();
    const data = this.getData({ path: pathname, params, searchParams });

    return {
      hash: btoa(`${pathname}?${searchParams.toString()}#${JSON.stringify(data.data)}`),
      path: pathname,
      page: page.loading ? this.fallback : page.data,
      data: data.data,
      loading: data.loading ?? false,
      error: data.error,
      actions: this.actions,
      params,
      searchParams,
    };
  }

  /**
   * @returns {import("./task").TaskSnapshot<Component>}
   */
  getPage() {
    if (this.lazy) {
      return this.lazy.cache([], this.router.requestUpdate);
    } else {
      return { data: this.page, error: undefined, loading: false };
    }
  }

  /**
   * @param {import("./router").LoadArgs} args
   * @returns {import("./task").TaskSnapshot<Data>}
   */
  getData(args) {
    if (this.load) {
      return this.load.cache([args], this.router.requestUpdate);
    } else {
      return { data: undefined, error: undefined, loading: false };
    }
  }

  /**
   * @param {import("./route-group").RouteGroup<Component>} parent
   */
  setParent(parent) {
    this.parent = parent;
    this.router = parent.router;
    this.fullPath = join(parent.fullPath, this.path);
    this.#invalidatePattern = compileInvalidatePattern(this.fullPath);

    for (const action in this.#actions) {
      this.actions[action] = this.router.action(this.#actions[action]);
    }

    this.pattern = !this.slot //
      ? new URLPattern({ pathname: this.fullPath })
      : parent.pattern;
  }
}
