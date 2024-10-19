import { Route } from "./route";
import { Task } from "./Task";

export class Routes {
  parent;
  pattern;

  constructor(routesInit = {}) {
    this.router = routesInit.router;
    this.path = routesInit.path ?? "";
    this.fullPath = routesInit.path ?? "";
    this.layout = routesInit.layout;
    this.fallback = routesInit.fallback;
    this.routes = Routes.normalize(this, routesInit.routes);
    this.pattern = new URLPattern({ pathname: Route.join(this.path, ":$nested(.*)?") });

    this.load = routesInit.load ? new Task(routesInit.load) : undefined;

    this.lazy = routesInit.lazy
      ? new Task(() => routesInit.lazy().then((module) => Routes.normalize(this, module.default)), []) // prettier-ignore
      : undefined;
  }

  static normalize(group, routes) {
    if (!routes) return [];

    let _routes = Array.isArray(routes) //
      ? routes.flat(Infinity)
      : [routes];

    for (const route of _routes) {
      route.setParent(group);
    }

    return _routes;
  }

  setParent(parent) {
    this.parent = parent;
    this.router = parent.router;
    this.fullPath = Route.join(this.parent.fullPath, this.path);
    this.pattern = new URLPattern({ pathname: Route.join(this.fullPath, ":$nested(.*)?") });

    for (const route of this.routes) {
      route.setParent(this);
    }
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
        const match = route.match(pathname);
        if (match) return route.resolve(pathname, match);
      }
    }

    // 3. try to find a route group that matches
    for (const route of routes.data) {
      if (route instanceof Routes && route.pattern.test({ pathname })) {
        return route.resolve(pathname, { page: route.fallback });
      }
    }
  }

  resolve(pathname, match) {
    const pattern = this.pattern.exec({ pathname });
    const { $nested, ...params } = pattern.pathname.groups;
    const searchParams = new URLSearchParams(location.search);

    const layoutPathname = pathname.replace($nested, "");
    const data = this.getData(layoutPathname, { params, searchParams });

    return {
      path: this.fullPath,
      layout: this.layout,
      child: match,
      data: data.data,
      loading: data.loading,
      error: data.error,
      params,
      searchParams,
    };
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
