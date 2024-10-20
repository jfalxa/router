export function invalidate(path, store) {
  for (const storePath in store) {
    if (storePath.startsWith(path)) {
      delete store[storePath];
    }
  }
}

export function join(...parts) {
  const joined = parts
    .map((part) => part.replace(/^\/+|\/+$/g, ""))
    .filter((part) => part !== "")
    .join("/");

  if (parts[0].startsWith("/")) {
    return "/" + joined;
  }

  return joined;
}

export function normalize(routes, parent) {
  if (!routes) return [];

  let _routes = Array.isArray(routes) //
    ? routes.flat(Infinity)
    : [routes];

  for (const route of _routes) {
    route.setParent(parent);
  }

  return _routes;
}
