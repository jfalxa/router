import { compileInvalidatePattern, join } from "./router";
import { Task } from "./task";

/**
 * @template Component
 * @template Data
 * @typedef {Object} RouteInit
 * @property {import("./router").Router<Component>} [router]
 * @property {import("./route-group").RouteGroup<Component>} [parent]
 * @property {string} [path]
 * @property {string} [slot]
 * @property {Component} [page]
 * @property {Component} [fallback]
 * @property {import("./router").Load<Data>} [load]
 * @property {import("./router").LazyPage<Component>} [lazy]
 */

/**
 * @template Component
 * @template Data
 * @param {RouteInit<Component, Data>} routeInit
 * @return
 */
export function createRoute(routeInit) {
  return new Route(routeInit);
}

/**
 * @template Component
 * @template [Data=unknown]
 */
export class Route {
  /**
   * @param {RouteInit<Component, Data>} routeInit
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
    this.invalidatePattern = compileInvalidatePattern(this.fullPath);

    if (routeInit.load) {
      this.load = new Task(routeInit.load);
    }

    if (routeInit.lazy) {
      const lazy = routeInit.lazy;
      this.lazy = new Task(() => lazy().then((module) => module.default));
    }
  }

  /**
   * @param {string} pathname
   */
  invalidate(pathname) {
    if (this.invalidatePattern.test(pathname)) {
      this.load?.invalidate();
    }
  }

  /**
   * @param {string} pathname
   */
  test(pathname) {
    return this.pattern.test({ pathname });
  }

  /**
   *
   * @param {string} pathname
   * @returns {import("./router").RouteNode<Component> | undefined}
   */
  resolve(pathname) {
    if (!this.test(pathname)) {
      return;
    }

    const result = this.pattern.exec({ pathname });
    const { $$nested, ...params } = /** @type {import("./router").Params} */ (result?.pathname.groups ?? {}); // prettier-ignore
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
      params: /** @type {import("./router").Params} */ (params),
      searchParams,
    };
  }

  /**
   * @param {import("./route-group").RouteGroup<Component>} parent
   */
  setParent(parent) {
    this.parent = parent;
    this.router = parent.router;
    this.fullPath = join(parent.fullPath, this.path);

    this.pattern = !this.slot //
      ? new URLPattern({ pathname: this.fullPath })
      : parent.pattern;

    this.invalidatePattern = !this.slot //
      ? compileInvalidatePattern(this.fullPath)
      : parent.invalidatePattern;
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
}
