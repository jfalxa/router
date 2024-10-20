import { Task } from "./Task";
import { join } from "./utils";

export class Route {
  router;
  parent;
  pattern;

  constructor(routeInit = {}) {
    this.path = routeInit.path ?? "";
    this.slot = routeInit.slot;
    this.fullPath = routeInit.path ?? "";
    this.page = routeInit.page ?? undefined;
    this.fallback = routeInit.fallback;
    this.pattern = new URLPattern({ pathname: this.fullPath });

    this.load = routeInit.load ? new Task(routeInit.load) : undefined;

    this.lazy = routeInit.lazy //
      ? new Task(() => routeInit.lazy().then((module) => module.default))
      : undefined;
  }

  resolve(pathname) {
    if (!this.pattern.test({ pathname })) {
      return;
    }

    const result = this.pattern.exec({ pathname });
    const { $$nested, ...params } = result.pathname.groups;
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
    this.fullPath = join(parent.fullPath, this.path);

    this.pattern = !this.slot //
      ? new URLPattern({ pathname: this.fullPath })
      : parent.pattern;
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
