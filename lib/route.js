import { Task } from "./Task";

export class Route {
  router;
  parent;
  pattern;

  constructor(routeInit = {}) {
    this.path = routeInit.path ?? "";
    this.fullPath = routeInit.path ?? "";
    this.page = routeInit.page ?? undefined;
    this.fallback = routeInit.fallback;
    this.pattern = new URLPattern({ pathname: this.fullPath });

    this.load = routeInit.load ? new Task(routeInit.load) : undefined;

    this.lazy = routeInit.lazy //
      ? new Task(() => routeInit.lazy().then((module) => module.default))
      : undefined;
  }

  static join(...parts) {
    const joined = parts
      .map((part) => part.replace(/^\/+|\/+$/g, ""))
      .filter((part) => part !== "")
      .join("/");

    if (parts[0].startsWith("/")) {
      return "/" + joined;
    }

    return joined;
  }

  resolve(pathname) {
    const pattern = this.pattern.exec({ pathname });
    const params = pattern.pathname.groups;
    const searchParams = new URLSearchParams(location.search);

    const page = this.getPage();
    const data = this.getData(pathname, { params, searchParams });

    return {
      path: this.fullPath,
      page: page.loading ? this.fallback : page.data,
      data: data.data,
      loading: data.loading,
      error: data.error,
      params,
      searchParams,
    };
  }

  setParent(parent) {
    this.parent = parent;
    this.router = parent.router;
    this.fullPath = Route.join(this.parent.fullPath, this.path);
    this.pattern = new URLPattern({ pathname: this.fullPath });
  }

  setRouter(router) {
    this.router = router;
  }

  getPage() {
    if (!this.lazy) {
      return { data: this.page };
    } else {
      return this.router.cache("page:" + this.fullPath, this.lazy);
    }
  }

  getData(pathname, args) {
    if (!this.load) {
      return {};
    } else {
      const key = `pageData:${pathname}?${args.searchParams.toString()}`;
      return this.router.cache(key, this.load, args);
    }
  }
}
