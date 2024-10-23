import { Routable } from "./routable";
import { Route } from "./route";
import { joinPath, normalizeRoutes } from "./utils";
import { Task } from "./task";

/**
 * @template Component
 * @template Data
 * @template {import("./router").Actions} Actions
 * @typedef {Object} _RouteGroupInit
 * @property {Component} [layout]
 * @property {import("./router").LazyRoutes<Component>} [lazy]
 * @property {import("./router").NestedRoutes<Component>} [routes]
 */

/**
 * @template Component
 * @template Data
 * @template {import("./router").Actions} Actions
 * @typedef {import("./routable").RoutableInit<Component, Data, Actions> & _RouteGroupInit<Component, Data, Actions>} RouteGroupInit
 */

/**
 * @template Component
 * @template Data
 * @template {import("./router").Actions} Actions
 * @param {RouteGroupInit<Component, Data, Actions>} routesInit
 * @returns
 */
export function createRouteGroup(routesInit) {
  return new RouteGroup(routesInit);
}

/**
 * @template Component
 * @template [Data=unknown]
 * @template {import("./router").Actions} [Actions=import("./router").Actions]
 * @extends {Routable<Component, Data, Actions>}
 */
export class RouteGroup extends Routable {
  /**
   * @param {RouteGroupInit<Component, Data, Actions>} routesInit
   */
  constructor(routesInit = {}) {
    super(routesInit);

    this.layout = routesInit.layout;
    this.routes = normalizeRoutes(routesInit.routes, this);

    if (routesInit.lazy) {
      const lazy = routesInit.lazy;
      /** @type {Task<[], import("./router").Routable<Component>[]> | undefined} */
      this.lazy = new Task(() => lazy().then((module) => normalizeRoutes(module.default, this)));
    }
  }

  /**
   * @param {string} pathname
   */
  invalidate(pathname) {
    super.invalidate(pathname);

    const routes = this.getRoutes();
    if (!routes.data) return;

    for (const route of routes.data) {
      route.invalidate(pathname);
    }
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
    const actions = this.getActions();

    const data =
      withFallback || children //
        ? this.getData({ path: routesPath, params, searchParams })
        : Task.snapshot(undefined);

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
      actions,
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
      return Task.snapshot(this.routes);
    }
  }

  getPattern() {
    return joinPath(this.fullPath, ":$$nested(.*)?");
  }

  /**
   * @param {RouteGroup<Component>} parent
   */
  setParent(parent) {
    super.setParent(parent);

    for (const route of this.routes) {
      route.setParent(this);
    }
  }
}
