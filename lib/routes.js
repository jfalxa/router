import { Route } from "./route";
import { join, normalize } from "./router";
import { Task } from "./task";

/**
 * @template Component
 * @template Data
 * @typedef {Object} RoutesInit
 * @property {import("./router").Router<Component>} [router]
 * @property {import("./routes").Routes<Component>} [parent]
 * @property {string} [path]
 * @property {string} [slot]
 * @property {Component} [layout]
 * @property {Component} [fallback]
 * @property {import("./router").Load<Data>} [load]
 * @property {import("./router").LazyRoutes<Component>} [lazy]
 * @property {import("./router").NestedRoutes<Component>} [routes]
 */

/**
 * @template [Component=unknown]
 * @template [Data=unknown]
 */
export class Routes {
  /** @type {import("./router").Router<Component>} */ router;
  /** @type {import("./routes").Routes<Component>} */ parent;
  /** @type {URLPattern} */ pattern;

  /**
   * @param {RoutesInit<Component, Data>} routesInit
   */
  constructor(routesInit = {}) {
    this.router = /** @type {import("./router").Router<Component>} */ (routesInit.router);
    this.parent = /** @type {import("./routes").Routes<Component>} */ (routesInit.parent);

    this.slot = routesInit.slot;
    this.path = routesInit.path ?? "";
    this.fullPath = routesInit.path ?? "";
    this.layout = routesInit.layout;
    this.fallback = routesInit.fallback;
    this.routes = normalize(routesInit.routes, this);
    this.pattern = new URLPattern({ pathname: join(this.path, ":$$nested(.*)?") });

    if (routesInit.load) {
      this.load = new Task(routesInit.load);
    }

    if (routesInit.lazy) {
      const lazy = routesInit.lazy;
      this.lazy = new Task(() => lazy().then((module) => normalize(module.default, this)), []);
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

    const result = this.pattern.exec({ pathname });
    const { $$nested, ...params } = /** @type {import("./router").Params} */ (result?.pathname.groups ?? {}); // prettier-ignore
    const searchParams = new URLSearchParams(location.search);
    const layoutPathname = pathname.replace($$nested ?? "", "");

    let children = this.children(pathname);
    const slots = this.slots(pathname);

    const data =
      withFallback || children //
        ? this.getData(layoutPathname, { params, searchParams })
        : undefined;

    if (!withFallback && !children) {
      return;
    }

    if (withFallback && !children) {
      children = {
        path: this.fullPath,
        page: this.fallback,
        params,
        searchParams,
        data: undefined,
        loading: false,
        error: undefined,
      };
    }

    return {
      path: this.fullPath,
      layout: this.layout,
      data: data?.data,
      loading: data?.loading ?? false,
      error: data?.error,
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
  children(pathname) {
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
      if (!route.slot && route instanceof Routes) {
        const resolved = route.resolve(pathname);
        if (resolved) return resolved;
      }
    }

    // 3. try to find a route group that matches
    for (const route of routes.data) {
      if (!route.slot && route instanceof Routes) {
        const resolved = route.resolve(pathname, true);
        if (resolved) return resolved;
      }
    }
  }

  /**
   * @param {string} pathname
   * @returns {Record<string,  import("./router").RouteNode<Component>>}
   */
  slots(pathname) {
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
   * @param {Routes} parent
   */
  setParent(parent) {
    this.parent = parent;
    this.router = parent.router;
    this.fullPath = join(this.parent.fullPath, this.path);

    this.pattern = !this.slot
      ? new URLPattern({ pathname: join(this.fullPath, ":$$nested(.*)?") })
      : parent.pattern;

    for (const route of this.routes) {
      route.setParent(this);
    }
  }

  /**
   * @returns {import("./task").TaskSnapshot<(Route | Routes)[]>}
   */
  getRoutes() {
    if (this.lazy) {
      return this.router.cache("routes:" + this.fullPath, this.lazy);
    } else {
      return Task.snapshot(this.routes);
    }
  }

  /**
   * @param {string} pathname
   * @param {import("./router").LoadArgs} args
   * @returns {import("./task").TaskSnapshot<Data>}
   */
  getData(pathname, args) {
    if (this.load) {
      const key = `layoutData:${pathname}?${args.searchParams.toString()}`;
      return this.router.cache(key, this.load, args);
    } else {
      return Task.snapshot(/** @type {Data} */ (undefined));
    }
  }
}
