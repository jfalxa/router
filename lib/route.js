import { join } from "./router";
import { Task } from "./task";

/**
 * @template Component
 * @template Data
 * @typedef {Object} RouteInit
 * @property {import("./router").Router<Component>} [router]
 * @property {import("./routes").Routes<Component>} [parent]
 * @property {string} [path]
 * @property {string} [slot]
 * @property {Component} [page]
 * @property {Component} [fallback]
 * @property {import("./router").Load<Data>} [load]
 * @property {import("./router").LazyPage<Component>} [lazy]
 */

/**
 * @template [Component=unknown]
 * @template [Data=unknown]
 */
export class Route {
  /** @type {import("./router").Router<Component>} */ router;
  /** @type {import("./routes").Routes} */ parent;
  /** @type {URLPattern} */ pattern;

  /**
   * @param {RouteInit<Component, Data>} routeInit
   */
  constructor(routeInit = {}) {
    this.router = /** @type {import("./router").Router<Component>} */ (routeInit.router);
    this.parent = /** @type {import("./routes").Routes<Component>} */ (routeInit.parent);

    this.path = routeInit.path ?? "";
    this.slot = routeInit.slot;
    this.fullPath = routeInit.path ?? "";
    this.page = routeInit.page ?? undefined;
    this.fallback = routeInit.fallback;
    this.pattern = new URLPattern({ pathname: this.fullPath });

    if (routeInit.load) {
      this.load = new Task(routeInit.load);
    }

    if (routeInit.lazy) {
      const lazy = routeInit.lazy;
      this.lazy = new Task(() => lazy().then((module) => module.default));
    }
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

    const result = this.pattern.exec({ pathname });
    const { $$nested, ...params } = /** @type {import("./router").Params} */ (result?.pathname.groups ?? {}); // prettier-ignore
    const searchParams = new URLSearchParams(location.search);

    const page = this.getPage();
    const data = this.getData(pathname, { params, searchParams });

    return {
      path: this.fullPath,
      page: page?.loading ? this.fallback : page?.data,
      data: data?.data,
      loading: data?.loading ?? false,
      error: data?.error,
      params: /** @type {import("./router").Params} */ (params),
      searchParams,
    };
  }

  /**
   * @param {import("./routes").Routes} parent
   */
  setParent(parent) {
    this.parent = parent;
    this.router = parent.router;
    this.fullPath = join(parent.fullPath, this.path);

    this.pattern = !this.slot //
      ? new URLPattern({ pathname: this.fullPath })
      : parent.pattern;
  }

  /**
   * @returns {import("./task").TaskSnapshot<Component>}
   */
  getPage() {
    if (this.lazy) {
      return this.router.cache("page:" + this.fullPath, this.lazy);
    } else {
      return Task.snapshot(this.page);
    }
  }

  /**
   * @param {string} pathname
   * @param {import("./router").LoadArgs} args
   * @returns {import("./task").TaskSnapshot<Data>}
   */
  getData(pathname, args) {
    if (this.load) {
      const key = `pageData:${pathname}?${args.searchParams.toString()}`;
      return this.router.cache(key, this.load, args);
    } else {
      return Task.snapshot(/** @type {Data} */ (undefined));
    }
  }
}
