import { Task } from "./Task";

export class Route {
  router;
  parent;

  loading = false;

  constructor(routeInit = {}) {
    this.path = routeInit.path ?? "";
    this.page = routeInit.page ?? undefined;
    this.fallback = routeInit.fallback;

    this.load = routeInit.load ? new Task(routeInit.load) : undefined;

    this.lazy = routeInit.lazy //
      ? new Task(() => routeInit.lazy().then((module) => module.default))
      : undefined;
  }

  get fullPath() {
    return (this.parent?.fullPath ?? "") + (this.path ?? "");
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

  getData() {
    if (!this.load) {
      return {};
    } else {
      return this.router.cache("pageData:" + this.fullPath, this.load);
    }
  }
}
