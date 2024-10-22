import { Route } from "./route";
import { RouteGroup } from "./route-group";
import { Task } from "./task";

/**
 * @template Component
 * @template Data
 * @typedef {import("./route-group").RoutesInit<Component, Data>} RouterInit
 */

/**
 * @template Component
 * @template Data
 * @param {RouterInit<Component, Data>} routerInit
 * @returns {Router<Component, Data>}
 */
export function createRouter(routerInit) {
  return new Router(routerInit);
}

/**
 * @template Component
 * @template [Data=unknown]
 */
export class Router {
  /** @type {RouteGroup<Component>} */
  root;

  /** @type {Record<string, import("./task").TaskSnapshot<unknown>>} */
  #cache = {};

  /** @type {Set<Subscriber<Component>>} */
  #subscribers = new Set();

  #updating = false;

  /**
   * @param {RouterInit<Component, Data>} routerInit
   */
  constructor(routerInit) {
    this.root = new RouteGroup({
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
    const url = new URL(pathname, "http://localhost");
    const entered = url.pathname + url.search;
    const exited = exitedPath(location.pathname, entered);
    history.pushState(undefined, "", entered);
    if (exited) this.invalidate(exited);
    this.requestUpdate();
  }

  /**
   * @param {string} pathname
   */
  replace(pathname) {
    const url = new URL(pathname, "http://localhost");
    const entered = url.pathname + url.search;
    const exited = exitedPath(location.pathname, entered);
    history.replaceState(undefined, "", entered);
    if (exited) this.invalidate(exited);
    this.requestUpdate();
  }

  forward() {
    history.forward();
  }

  back() {
    history.back();
  }

  /**
   * @param {Subscriber<Component>} subscriber
   */
  subscribe(subscriber) {
    this.#subscribers.add(subscriber);
  }

  /**
   * @param {Subscriber<Component>} subscriber
   */
  unsubscribe(subscriber) {
    this.#subscribers.delete(subscriber);
  }

  clear() {
    this.#subscribers.clear();
    window.removeEventListener("popstate", this.requestUpdate);
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
    invalidate("load:route-group:" + path, this.#cache);
    invalidate("load:route:" + path, this.#cache);
    this.requestUpdate();
  }

  update = () => {
    const tree = this.root.match(location.pathname, true);
    for (const subscriber of this.#subscribers) subscriber(tree);
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
 * @param {RouteGroup<Component>} parent
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

/**
 * @param {string} previousPath
 * @param {string} nextPath
 * @returns {string | undefined}
 */
export function exitedPath(previousPath, nextPath) {
  if (previousPath === nextPath) return undefined;

  const previousParts = previousPath.split("/");
  const nextParts = nextPath.split("/");

  const length = Math.min(previousParts.length, nextParts.length);

  /** @type {string[]} */
  const exitedParts = [];

  for (let i = 0; i < length; i++) {
    exitedParts.push(previousParts[i]);
    if (previousParts[i] !== nextParts[i]) break;
  }

  return exitedParts.join("/");
}

/** @typedef {Record<string, string>} Params */

/** @typedef {{ params: Params, searchParams: URLSearchParams }} LoadArgs */

/**
 * @template Component
 * @typedef {(tree: RouteNode<Component> | undefined) => void} Subscriber
 */

/**
 * @template Component
 * @typedef {Route<Component> | RouteGroup<Component>} Routable
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
 * @typedef {Object} RouteNode
 * @property {string} hash
 * @property {string} path
 * @property {Component} [page]
 * @property {Component} [layout]
 * @property {RouteNode<Component>} [children]
 * @property {Record<string, RouteNode<Component>>} [slots]
 * @property {boolean} loading
 * @property {Data} [data]
 * @property {Error} [error]
 * @property {Params} params
 * @property {URLSearchParams} searchParams
 */
