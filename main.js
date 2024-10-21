// @ts-ignore: Property 'UrlPattern' does not exist
if (!globalThis.URLPattern) {
  await import("urlpattern-polyfill");
}

export * from "./lib/router";
export * from "./lib/routes";
export * from "./lib/route";
export * from "./lib/task";
