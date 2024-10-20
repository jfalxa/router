import { Route } from "./route";
import { Task } from "./Task";
import { join, normalize } from "./utils";

export class Routes {
  parent;
  pattern;

  constructor(routesInit = {}) {
    this.router = routesInit.router;
    this.slot = routesInit.slot;
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
    if (!this.pattern.test({ pathname })) {
      return;
    }

    const result = this.pattern.exec({ pathname });
    const { $$nested, ...params } = result.pathname.groups;
    const searchParams = new URLSearchParams(location.search);
    const layoutPathname = pathname.replace($$nested, "");

    const children = this.children(pathname);
    const slots = this.slots(pathname);

    const data =
      withFallback || children //
        ? this.getData(layoutPathname, { params, searchParams })
        : undefined;

    if (!withFallback && !children) {
      return;
    }

    return {
      path: this.fullPath,
      layout: this.layout,
      children: withFallback ? children ?? { page: this.fallback } : children,
      data: data.data,
      loading: data.loading,
      error: data.error,
      params,
      searchParams,
      slots,
    };
  }

  children(pathname) {
    const routes = this.getRoutes();

    // 1. try to find a route that matches
    for (const route of routes.data) {
      if (!route.slot && route instanceof Route) {
        const resolved = route.resolve(pathname);
        if (resolved) return resolved;
      }
    }

    // 2. try to find a route group that has a route that matches
    for (const route of routes.data) {
      if (!route.slot && route instanceof Routes) {
        const resolved = route.resolve(pathname);
        if (resolved) return resolved;
      }
    }

    // 3. try to find a route group that matches
    for (const route of routes.data) {
      if (!route.slot && route instanceof Routes) {
        const resolved = route.resolve(pathname, true);
        if (resolved) return resolved;
      }
    }
  }

  slots(pathname) {
    const routes = this.getRoutes();

    const slots = {};

    for (const route of routes.data) {
      if (route.slot) {
        const resolved = route.resolve(pathname);
        if (resolved) slots[route.slot] = resolved;
      }
    }

    return slots;
  }

  setParent(parent) {
    this.parent = parent;
    this.router = parent.router;
    this.fullPath = join(this.parent.fullPath, this.path);

    this.pattern = !this.slot
      ? new URLPattern({ pathname: join(this.fullPath, ":$$nested(.*)?") })
      : parent.pattern;

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
