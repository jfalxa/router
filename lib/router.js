import { Route } from "./route";
import { Routes } from "./routes";
import { Task } from "./task";

/**
 * @template Component
 * @typedef {Object} RouterInit
 * @property {(tree: RouteNode<Component> | undefined) => unknown} render
 * @property {NestedRoutes<Component>} [routes]
 * @property {Component} [fallback]
 * @property {Component} [layout]
 */

/**
 * @template Component
 */
export class Router {
  /** @type {Routes<Component>} */
  root;

  /** @type {Record<string, import("./task").TaskSnapshot<unknown>>} */
  #cache = {};

  #updating = false;
  #render;

  /**
   * @param {RouterInit<Component>} routerInit
   */
  constructor(routerInit) {
    this.#render = routerInit.render;

    this.root = new Routes({
      router: this,
      path: "/",
      routes: routerInit.routes,
      fallback: routerInit.fallback,
      layout: routerInit.layout,
    });

    window.addEventListener("popstate", this.requestUpdate);
    this.requestUpdate();
  }

  /**
   * @param {string} pathname
   */
  push(pathname) {
    history.pushState(undefined, "", pathname);
    this.requestUpdate();
  }

  /**
   * @param {string} pathname
   */
  replace(pathname) {
    history.replaceState(undefined, "", pathname);
    this.requestUpdate();
  }

  forward() {
    history.forward();
  }

  back() {
    history.back();
  }

  /**
   * @param {HTMLAnchorElement} anchor
   */
  link = (anchor) => {
    anchor.addEventListener("click", this.#pushAnchor);
  };

  /**
   * @template Data
   * @template Args
   * @param {string} key
   * @param {import("./task").Task<Data, Args>} task
   * @param {Args} [args]
   * @returns {import("./task").TaskSnapshot<Data>}
   */
  cache(key, task, args) {
    if (key in this.#cache) {
      return /** @type {import("./task").TaskSnapshot<Data>} */ (this.#cache[key]);
    }

    // initialize cache with empty value
    this.#cache[key] = Task.snapshot(undefined, undefined, true);

    // run task asynchronously, then save result in cache
    task.run(/** @type  {Args} */ (args)).then((snapshot) => {
      this.#cache[key] = snapshot;
      this.requestUpdate();
    });

    return /** @type {import("./task").TaskSnapshot<Data>} */ (this.#cache[key]);
  }

  /**
   * @param {string} path
   */
  invalidate(path) {
    invalidate("layoutData:" + path, this.#cache);
    invalidate("pageData:" + path, this.#cache);
    this.requestUpdate();
  }

  update = () => {
    const tree = this.root.resolve(location.pathname, true);
    this.#render?.(tree);
    this.updating = false;
  };

  requestUpdate = () => {
    if (this.#updating) return;

    this.updating = true;
    queueMicrotask(this.update);
  };

  #pushAnchor = (/** @type {MouseEvent} */ e) => {
    if (e.button === 0) {
      e.preventDefault();
      this.push(/** @type {HTMLAnchorElement} */ (e.currentTarget).href);
    }
  };
}

/**
 * @param {string} path
 * @param {Record<string, unknown>} store
 */
export function invalidate(path, store) {
  for (const storePath in store) {
    if (storePath.startsWith(path)) {
      delete store[storePath];
    }
  }
}

/**
 * @param  {...string} parts
 * @returns {string}
 */
export function join(...parts) {
  const joined = parts
    .map((part) => part.replace(/^\/+|\/+$/g, ""))
    .filter((part) => part !== "")
    .join("/");

  if (parts[0].startsWith("/")) {
    return "/" + joined;
  }

  return joined;
}

/**
 * @template Component
 * @param {NestedRoutes<Component> | undefined} routes
 * @param {Routes<Component>} parent
 * @returns {(Routable<Component>)[]}
 */
export function normalize(routes, parent) {
  if (!routes) return [];

  let _routes = Array.isArray(routes) ? routes : [routes];

  for (const route of _routes) {
    route.setParent(parent);
  }

  return _routes;
}

/** @typedef {Record<string, string>} Params */

/** @typedef {{ params: Params, searchParams: URLSearchParams }} LoadArgs */

/**
 * @template Component
 * @typedef {Route<Component> | Routes<Component>} Routable
 */

/**
 * @template Component
 * @typedef {(Routable<Component>) | (Routable<Component>)[]} NestedRoutes
 */

/**
 * @template Data
 * @typedef {(args: LoadArgs) => Promise<Data>} Load
 */

/**
 * @template Component
 * @typedef {() => Promise<{ default: NestedRoutes<Component> }>} LazyRoutes
 */

/**
 * @template Component
 * @typedef {() => Promise<{ default: Component }>} LazyPage
 */

/**
 * @template Component
 * @template [Data=unknown]
 * @typedef {{
 * path: string,
 * page?: Component,
 * layout?: Component,
 * children?: RouteNode<Component> | undefined,
 * slots?: Record<string, RouteNode<Component>>,
 * data: Data | undefined,
 * loading: boolean,
 * error: Error | undefined,
 * params: import("./router").Params,
 * searchParams: URLSearchParams,
 * }} RouteNode
 */
