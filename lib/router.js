import { Routes } from "./routes";

export class Router {
  _render;
  routes;

  #cache = {};
  #updating = false;

  constructor(routerInit) {
    this._render = routerInit.render;

    this.routes = new Routes({
      router: this,
      path: "/",
      routes: routerInit.routes,
      fallback: routerInit.fallback,
      layout: routerInit.layout,
    });

    window.addEventListener("popstate", this.requestUpdate);
    this.requestUpdate();
  }

  push(href) {
    history.pushState(undefined, "", href);
    this.invalidate(location.pathname);
    this.requestUpdate();
  }

  replace(href) {
    history.replaceState(undefined, "", href);
    this.requestUpdate();
  }

  forward() {
    history.forward();
  }

  back() {
    history.back();
  }

  link = (anchor) => {
    anchor.addEventListener("click", this.#pushAnchor);
  };

  cache(path, task) {
    if (path in this.#cache) {
      return this.#cache[path];
    }

    this.#cache[path] = task.snapshot();
    this.#cache[path].loading = true;

    task.run().then(() => {
      this.#cache[path] = task.snapshot();
      this.requestUpdate();
    });

    return this.#cache[path];
  }

  invalidate(path) {
    invalidate("layoutData:" + path, this.#cache);
    invalidate("pageData:" + path, this.#cache);
    this.requestUpdate();
  }

  update = async () => {
    const tree = await this.routes.match(location.pathname);
    this._render?.(tree);
    this.updating = false;
  };

  requestUpdate = () => {
    // if an update was already requested in the current main task, stop here
    if (this.#updating) return;

    // run the effects right after the current main task is finished
    // so we can queue all the signals that were changed together
    this.updating = true;
    queueMicrotask(this.update);
  };

  #pushAnchor = (e) => {
    if (e.button === 0) {
      e.preventDefault();
      this.push(e.currentTarget.href);
    }
  };
}

function invalidate(path, store) {
  for (const storePath in store) {
    if (storePath.startsWith(path)) {
      delete store[storePath];
    }
  }
}
