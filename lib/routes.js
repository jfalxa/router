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
    this.pattern = new URLPattern({ pathname: this.path });

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
    this.pattern = new URLPattern({ pathname: this.fullPath });

    for (const route of this.routes) {
      route.setParent(this);
    }
  }

  match(href) {
    const routes = this.getRoutes();

    if (routes.loading) {
      return;
    }

    // 1. try to find a route that matches
    for (const route of routes.data) {
      const routePath = route.fullPath;

      if (route instanceof Route && routePath === href) {
        const page = route.getPage();
        const data = route.getData();

        return {
          path: routePath,
          page: page.loading ? route.fallback : page.data,
          data: data.data,
          loading: data.loading,
          error: data.error,
          pageName: page.loading ? route.fallback?.name : page.data?.name,
        };
      }
    }

    // 2. try to find a route group that has a route that matches
    for (const route of routes.data) {
      const routePath = route.fullPath;

      if (route instanceof Routes && href.startsWith(routePath)) {
        const match = route.match(href);

        if (match) {
          const data = route.getData();

          return {
            path: routePath,
            layout: route.layout,
            child: match,
            data: data.data,
            loading: data.loading,
            error: data.error,
            layoutName: route.layout?.name,
          };
        }
      }
    }

    // 3. try to find a route group that matches
    for (const route of routes.data) {
      const routePath = route.fullPath;

      if (route instanceof Routes && href.startsWith(routePath)) {
        const data = route.getData();

        return {
          path: routePath,
          layout: route.layout,
          child: { page: route.fallback, pageName: route.fallback?.name },
          data: data.data,
          loading: data.loading,
          error: data.error,
          layoutName: route.layout?.name,
        };
      }
    }
  }

  getRoutes() {
    if (!this.lazy) {
      return { data: this.routes };
    } else {
      return this.router.cache("routes:" + this.fullPath, this.lazy);
    }
  }

  getData() {
    if (!this.load) {
      return {};
    } else {
      return this.router.cache("layoutData:" + this.fullPath, this.load);
    }
  }
}
