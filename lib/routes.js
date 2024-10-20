import { Route } from "./route";
import { Task } from "./Task";
import { join, normalize } from "./utils";

export class Routes {
  parent;
  pattern;

  constructor(routesInit = {}) {
    this.router = routesInit.router;
    this.path = routesInit.path ?? "";
    this.fullPath = routesInit.path ?? "";
    this.layout = routesInit.layout;
    this.fallback = routesInit.fallback;
    this.routes = normalize(routesInit.routes, this);
    this.pattern = new URLPattern({ pathname: join(this.path, ":$nested(.*)?") });

    this.load = routesInit.load ? new Task(routesInit.load) : undefined;

    this.lazy = routesInit.lazy
      ? new Task(() => routesInit.lazy().then((module) => normalize(module.default, this)), [])
      : undefined;
  }

  resolve(pathname, withFallback) {
    const pattern = this.pattern.exec({ pathname });
    const { $nested, ...params } = pattern.pathname.groups;
    const searchParams = new URLSearchParams(location.search);
    const layoutPathname = pathname.replace($nested, "");

    const match = this.match(pathname);

    const data =
      withFallback || match //
        ? this.getData(layoutPathname, { params, searchParams })
        : undefined;

    if (!withFallback && !match) {
      return;
    }

    return {
      path: this.fullPath,
      layout: this.layout,
      children: withFallback ? match ?? { page: this.fallback } : match,
      data: data.data,
      loading: data.loading,
      error: data.error,
      params,
      searchParams,
    };
  }

  match(pathname) {
    const routes = this.getRoutes();

    if (routes.loading) {
      return;
    }

    // 1. try to find a route that matches
    for (const route of routes.data) {
      if (route instanceof Route && route.pattern.test({ pathname })) {
        return route.resolve(pathname);
      }
    }

    // 2. try to find a route group that has a route that matches
    for (const route of routes.data) {
      if (route instanceof Routes && route.pattern.test({ pathname })) {
        const resolved = route.resolve(pathname);
        if (resolved) return resolved;
      }
    }

    // 3. try to find a route group that matches
    for (const route of routes.data) {
      if (route instanceof Routes && route.pattern.test({ pathname })) {
        return route.resolve(pathname, true);
      }
    }
  }

  setParent(parent) {
    this.parent = parent;
    this.router = parent.router;
    this.fullPath = join(this.parent.fullPath, this.path);
    this.pattern = new URLPattern({ pathname: join(this.fullPath, ":$nested(.*)?") });

    for (const route of this.routes) {
      route.setParent(this);
    }
  }

  getRoutes() {
    if (!this.lazy) {
      return { data: this.routes };
    } else {
      return this.router.cache("routes:" + this.fullPath, this.lazy);
    }
  }

  getData(pathname, args) {
    if (!this.load) {
      return {};
    } else {
      const key = `layoutData:${pathname}?${args.searchParams.toString()}`;
      return this.router.cache(key, this.load, args);
    }
  }
}
