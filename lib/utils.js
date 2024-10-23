/**
 * @param  {...string} parts
 * @returns {string}
 */
export function joinPath(...parts) {
  const joined = parts
    .map((part) => part.replace(/^\/+|\/+$/g, ""))
    .filter((part) => part !== "")
    .join("/");

  if (parts[0].startsWith("/")) {
    return "/" + joined;
  }

  return joined;
}

/**
 * @template Component
 * @param {import("./router").NestedRoutes<Component> | undefined} routes
 * @param {import("./route-group").RouteGroup<Component>} parent
 * @returns {(import("./router").Routable<Component>)[]}
 */
export function normalizeRoutes(routes, parent) {
  if (!routes) return [];

  let _routes = Array.isArray(routes) ? routes : [routes];

  for (const route of _routes) {
    route.setParent(parent);
  }

  return _routes;
}

/**
 * @param {string} path
 * @returns {RegExp}
 */
export function compileInvalidatePattern(path) {
  const pattern = path
    .split("/")
    .filter(Boolean)
    .reduceRight((pattern, part) => {
      if (part[0] === ":") part = "[^/]+";
      return `(/${part}${pattern})?`;
    }, "");

  return new RegExp(`^${pattern}/?$`);
}

/**
 * @param {string} previousPath
 * @param {string} nextPath
 * @returns {string | undefined}
 */
export function getExitedPath(previousPath, nextPath) {
  if (previousPath === nextPath) return undefined;

  const previousParts = previousPath.split("/");
  const nextParts = nextPath.split("/");

  const length = Math.max(previousParts.length, nextParts.length);

  /** @type {string[]} */
  const exitedParts = [];

  for (let i = 0; i < length; i++) {
    exitedParts.push(previousParts[i]);
    if (previousParts[i] !== nextParts[i]) break;
  }

  return exitedParts.join("/");
}
