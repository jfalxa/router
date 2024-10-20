// @ts-ignore: Property 'UrlPattern' does not exist
if (!globalThis.URLPattern) {
  await import("urlpattern-polyfill");
}

export * from "./router";
export * from "./routes";
export * from "./route";
export * from "./task";
