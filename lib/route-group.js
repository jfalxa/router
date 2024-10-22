import { Route } from "./route";
import { compileInvalidatePattern, join, normalize } from "./router";
import { Task } from "./task";

/**
 * @template Component
 * @template Data
 * @template {import("./router").Actions} Actions
 * @typedef {Object} RoutesInit
 * @property {import("./router").Router<Component>} [router]
 * @property {import("./route-group").RouteGroup<Component>} [parent]
 * @property {string} [path]
 * @property {string} [slot]
 * @property {Component} [layout]
 * @property {Component} [fallback]
 * @property {import("./router").Load<Data>} [load]
 * @property {import("./router").LazyRoutes<Component>} [lazy]
 * @property {import("./router").NestedRoutes<Component>} [routes]
 * @property {Actions} [actions]
 */

/**
 * @template Component
 * @template Data
 * @template {import("./router").Actions} Actions
 * @param {RoutesInit<Component, Data, Actions>} routesInit
 * @returns
 */
export function createRouteGroup(routesInit) {
  return new RouteGroup(routesInit);
}

/**
 * @template Component
 * @template [Data=unknown]
 * @template {import("./router").Actions} [Actions=import("./router").Actions]
 */
export class RouteGroup {
  #actions;
  #invalidatePattern;

  /**
   * @param {RoutesInit<Component, Data, Actions>} routesInit
   */
  constructor(routesInit = {}) {
    this.router = /** @type {import("./router").Router<Component>} */ (routesInit.router);
    this.parent = /** @type {import("./route-group").RouteGroup<Component>} */ (routesInit.parent);

    this.slot = routesInit.slot;
    this.path = routesInit.path ?? "";
    this.fullPath = routesInit.path ?? "";
    this.layout = routesInit.layout;
    this.fallback = routesInit.fallback;
    this.routes = normalize(routesInit.routes, this);

    this.pattern = new URLPattern({ pathname: join(this.path, ":$$nested(.*)?") });
    this.#invalidatePattern = compileInvalidatePattern(this.path);

    if (routesInit.load) {
      this.load = new Task(routesInit.load);
    }

    if (routesInit.lazy) {
      const lazy = routesInit.lazy;
      /** @type {Task<[], import("./router").Routable<Component>[]> | undefined} */
      this.lazy = new Task(() => lazy().then((module) => normalize(module.default, this)));
    }

    if (routesInit.actions) {
      this.#actions = routesInit.actions;
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

    const routes = this.getRoutes();
    if (!routes.data) return;

    for (const route of routes.data) {
      route.invalidate(pathname);
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
   * @param {string} pathname
   * @param {boolean} [withFallback]
   * @returns {import("./router").RouteNode<Component> | undefined}
   */
  resolve(pathname, withFallback) {
    if (!this.pattern.test({ pathname })) {
      return;
    }

    const { $$nested, ...params } = this.match(pathname);
    const searchParams = new URLSearchParams(location.search);

    const routesPath = pathname.replace($$nested ?? "", "");
    const key = `${routesPath}?${searchParams.toString()}`;

    let children = this.getChildren(pathname);
    const slots = this.getSlots(pathname);

    const data =
      withFallback || children //
        ? this.getData({ path: routesPath, params, searchParams })
        : { loading: false, data: undefined, error: undefined };

    if (!withFallback && !children) {
      return;
    }

    if (withFallback && !children) {
      children = {
        hash: btoa(key),
        path: routesPath,
        page: this.fallback,
        params,
        searchParams,
        loading: false,
        data: undefined,
        error: undefined,
      };
    }

    return {
      hash: btoa(`${key}#${JSON.stringify(data)}`),
      path: routesPath,
      layout: this.layout,
      loading: data.loading,
      data: data.data,
      error: data.error,
      actions: this.actions,
      params,
      searchParams,
      children,
      slots,
    };
  }

  /**
   * @param {string} pathname
   * @returns {import("./router").RouteNode<Component> | undefined}
   */
  getChildren(pathname) {
    const routes = this.getRoutes();
    if (!routes.data) return;

    // 1. try to find a route that matches
    for (const route of routes.data) {
      if (!route.slot && route instanceof Route) {
        const resolved = route.resolve(pathname);
        if (resolved) return resolved;
      }
    }

    // 2. try to find a route group that has a route that matches
    for (const route of routes.data) {
      if (!route.slot && route instanceof RouteGroup) {
        const resolved = route.resolve(pathname);
        if (resolved) return resolved;
      }
    }

    // 3. try to find a route group that matches
    for (const route of routes.data) {
      if (!route.slot && route instanceof RouteGroup) {
        const resolved = route.resolve(pathname, true);
        if (resolved) return resolved;
      }
    }
  }

  /**
   * @param {string} pathname
   * @returns {Record<string, import("./router").RouteNode<Component>>}
   */
  getSlots(pathname) {
    const routes = this.getRoutes();
    if (!routes.data) return {};

    /** @type {Record<string, import("./router").RouteNode<Component>>} */
    const slots = {};

    for (const route of routes.data) {
      if (route.slot) {
        const resolved = route.resolve(pathname);
        if (resolved) slots[route.slot] = resolved;
      }
    }

    return slots;
  }

  /**
   * @returns {import("./task").TaskSnapshot<(import("./router").Routable<Component>)[]>}
   */
  getRoutes() {
    if (this.lazy) {
      return this.lazy.cache([], this.router.requestUpdate);
    } else {
      return { data: this.routes, error: undefined, loading: false };
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
   * @param {RouteGroup<Component>} parent
   */
  setParent(parent) {
    this.parent = parent;
    this.router = parent.router;
    this.fullPath = join(this.parent.fullPath, this.path);
    this.#invalidatePattern = compileInvalidatePattern(this.fullPath);

    for (const action in this.#actions) {
      this.actions[action] = this.router.action(this.#actions[action]);
    }

    this.pattern = !this.slot
      ? new URLPattern({ pathname: join(this.fullPath, ":$$nested(.*)?") })
      : parent.pattern;

    for (const route of this.routes) {
      route.setParent(this);
    }
  }
}
