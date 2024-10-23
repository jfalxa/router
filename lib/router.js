import { Route } from "./route";
import { RouteGroup } from "./route-group";
import { getExitedPath } from "./utils";

/**
 * @template Component
 * @template Data
 * @template {Actions} RouterActions
 * @typedef {import("./route-group").RouteGroupInit<Component, Data, RouterActions>} RouterInit
 */

/**
 * @template Component
 * @template Data
 * @template {Actions} RouterActions
 * @param {RouterInit<Component, Data, RouterActions>} routerInit
 * @returns {Router<Component, Data, RouterActions>}
 */
export function createRouter(routerInit) {
  return new Router(routerInit);
}

/**
 * @template Data
 * @param {Action<[FormData, Data?], Data>} action
 * @returns {(event: SubmitEvent) => void}
 */
export function submit(action) {
  return (event) => {
    event.preventDefault();

    const form = /** @type {HTMLFormElement} */ (event.currentTarget);
    const data = new FormData(form);

    action(data, action.data);
  };
}

/**
 * @template Component
 * @template [Data=unknown]
 * @template {Actions} [RouterActions=Actions]
 */
export class Router {
  /** @type {RouteGroup<Component>} */
  root;

  /** @type {Set<Subscriber<Component>>} */
  #subscribers = new Set();

  /** @type {boolean} */
  #updating = false;

  /**
   * @param {RouterInit<Component, Data, RouterActions>} routerInit
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
    const exited = getExitedPath(location.pathname, entered);
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
    const exited = getExitedPath(location.pathname, entered);
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
   * @param {string} path
   */
  invalidate(path) {
    this.root.invalidate(path);
    this.requestUpdate();
  }

  update = () => {
    const tree = this.root.resolve(location.pathname, true);
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

/** @typedef {Record<string, string>} Params */

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
 * @template Component
 * @typedef {() => Promise<{ default: NestedRoutes<Component> }>} LazyRoutes
 */

/**
 * @template Component
 * @typedef {() => Promise<{ default: Component }>} LazyPage
 */

/**
 * @template Data
 * @typedef {(args: LoadArgs) => Promise<Data>} Load
 */

/**
 * @typedef {Object} LoadArgs
 * @property {string} path
 * @property {Params} params
 * @property {URLSearchParams} searchParams
 */

/** @typedef {Record<string, ActionFunction>} Actions */

/**
 * @template {unknown[]} [Args=unknown[]]
 * @template [Data=unknown]
 * @typedef {ActionFunction<Args, import("./task").TaskSnapshot<Data>> & import("./task").TaskSnapshot<Data>} Action
 */

/**
 * @template {unknown[]} [Args=unknown[]]
 * @template [Data=unknown]
 * @typedef {(...args: Args) => Promise<Data>} ActionFunction
 */

/**
 * @typedef {Object} SubmitEvent
 * @property {Function} preventDefault
 * @property {EventTarget | null} currentTarget
 */

/**
 * @template Component
 * @template [Data=unknown]
 * @template {Actions} [RouteActions=Actions]
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
 * @property {RouteActions} [actions]
 */
