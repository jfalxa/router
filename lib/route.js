import { Routable } from "./routable";
import { Task } from "./task";

/**
 * @template Component
 * @template Data
 * @template {import("./router").Actions} Actions
 * @typedef {Object} _RouteInit
 * @property {Component} [page]
 * @property {import("./router").LazyPage<Component>} [lazy]
 */

/**
 * @template Component
 * @template Data
 * @template {import("./router").Actions} Actions
 * @typedef {import("./routable").RoutableInit<Component, Data, Actions> & _RouteInit<Component, Data, Actions>} RouteInit
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
 * @extends {Routable<Component, Data, Actions>}
 */
export class Route extends Routable {
  /**
   * @param {RouteInit<Component, Data, Actions>} routeInit
   */
  constructor(routeInit = {}) {
    super(routeInit);
    this.page = routeInit.page ?? undefined;

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

    const { $$nested, ...params } = this.match(pathname);
    const searchParams = new URLSearchParams(location.search);

    const page = this.getPage();
    const data = this.getData({ path: pathname, params, searchParams });
    const actions = this.getActions();

    return {
      hash: btoa(`${pathname}?${searchParams.toString()}#${JSON.stringify(data.data)}`),
      path: pathname,
      page: page.loading ? this.fallback : page.data,
      data: data.data,
      loading: data.loading ?? false,
      error: data.error,
      actions,
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
}
