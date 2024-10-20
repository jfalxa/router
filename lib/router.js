import { Routes } from "./routes";
import { invalidate } from "./utils";

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
      layout: routerInit.root,
    });

    window.addEventListener("popstate", this.requestUpdate);
    this.update();
  }

  push(href) {
    history.pushState(undefined, "", href);
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

  cache(key, task, args) {
    if (key in this.#cache) {
      return this.#cache[key];
    }

    this.#cache[key] = {
      loading: true,
      data: undefined,
      error: undefined,
    };

    task.run(args).then(() => {
      this.#cache[key] = {
        loading: false,
        data: task.data,
        error: task.error,
      };

      this.requestUpdate();
    });

    return this.#cache[key];
  }

  invalidate(path) {
    invalidate("layoutData:" + path, this.#cache);
    invalidate("pageData:" + path, this.#cache);
    this.requestUpdate();
  }

  update = async () => {
    const tree = await this.routes.resolve(location.pathname, true);
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
