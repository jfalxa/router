declare module "lib/task" {
    /**
     * @template Data
     * @template {unknown[]} Args
     * @param {TaskFunction<Data, Args>} task
     * @param {Data} [initialData]
     * @returns {Task<Data, Args>}
     */
    export function task<Data, Args extends unknown[]>(task: TaskFunction<Data, Args>, initialData?: Data | undefined): Task<Data, Args>;
    /**
     * @template [Data=unknown]
     * @template {unknown[]} [Args=unknown[]]
     */
    export class Task<Data = unknown, Args extends unknown[] = unknown[]> {
        /**
         * @param {TaskFunction<Data, Args>} task
         * @param {Data} [initialData]
         */
        constructor(task: TaskFunction<Data, Args>, initialData?: Data | undefined);
        /** @type {boolean} */
        loading: boolean;
        /** @type {Data | undefined} */
        data: Data | undefined;
        /** @type {Error | undefined} */
        error: Error | undefined;
        /**
         * @returns {TaskSnapshot<Data>}
         */
        snapshot(): TaskSnapshot<Data>;
        invalidate(): void;
        /**
         * @param {Args} args
         * @param {(task: TaskSnapshot<Data>) => void} [onChange]
         * @returns {TaskSnapshot<Data>}
         */
        cache(args: Args, onChange?: ((task: TaskSnapshot<Data>) => void) | undefined): TaskSnapshot<Data>;
        /**
         * @param {Args} args
         * @returns {Promise<TaskSnapshot<Data>>}
         */
        run(...args: Args): Promise<TaskSnapshot<Data>>;
        #private;
    }
    export type TaskFunction<Data, Args extends unknown[]> = (...args: Args) => Promise<Data>;
    export type TaskSnapshot<Data> = {
        loading: boolean;
        data: Data | undefined;
        error: Error | undefined;
    };
}
declare module "lib/route-group" {
    /**
     * @template Component
     * @template Data
     * @typedef {Object} RoutesInit
     * @property {import("./router").Router<Component>} [router]
     * @property {import("./route-group").RouteGroup<Component>} [parent]
     * @property {string} [path]
     * @property {string} [slot]
     * @property {Component} [layout]
     * @property {Component} [fallback]
     * @property {import("./router").Load<Data>} [load]
     * @property {import("./router").LazyRoutes<Component>} [lazy]
     * @property {import("./router").NestedRoutes<Component>} [routes]
     */
    /**
     * @template Component
     * @template Data
     * @param {RoutesInit<Component, Data>} routesInit
     * @returns
     */
    export function createRouteGroup<Component, Data>(routesInit: RoutesInit<Component, Data>): RouteGroup<Component, Data>;
    /**
     * @template Component
     * @template [Data=unknown]
     */
    export class RouteGroup<Component, Data = unknown> {
        /**
         * @param {RoutesInit<Component, Data>} routesInit
         */
        constructor(routesInit?: RoutesInit<Component, Data>);
        router: import("router").Router<Component, any>;
        parent: RouteGroup<Component, any>;
        slot: string | undefined;
        path: string;
        fullPath: string;
        layout: Component | undefined;
        fallback: Component | undefined;
        routes: import("router").Routable<Component>[];
        pattern: URLPattern;
        load: Task<Data, [args: import("router").LoadArgs]> | undefined;
        /** @type {Task<import("./router").Routable<Component>[], []> | undefined} */
        lazy: Task<import("router").Routable<Component>[], []> | undefined;
        /**
         * @param {string} path
         */
        invalidate(path: string): void;
        /**
         * @param {string} pathname
         */
        test(pathname: string): boolean;
        /**
         * @param {string} pathname
         * @param {boolean} [withFallback]
         * @returns {import("./router").RouteNode<Component> | undefined}
         */
        resolve(pathname: string, withFallback?: boolean | undefined): import("router").RouteNode<Component> | undefined;
        /**
         * @param {string} pathname
         * @returns {import("./router").RouteNode<Component> | undefined}
         */
        children(pathname: string): import("router").RouteNode<Component> | undefined;
        /**
         * @param {string} pathname
         * @returns {Record<string,  import("./router").RouteNode<Component>>}
         */
        slots(pathname: string): Record<string, import("router").RouteNode<Component>>;
        /**
         * @param {RouteGroup<Component>} parent
         */
        setParent(parent: RouteGroup<Component>): void;
        /**
         * @returns {import("./task").TaskSnapshot<(import("./router").Routable<Component>)[]> | undefined}
         */
        getRoutes(): import("router").TaskSnapshot<(import("router").Routable<Component>)[]> | undefined;
        /**
         * @param {import("./router").LoadArgs} args
         * @returns {import("./task").TaskSnapshot<Data> | undefined}
         */
        getData(args: import("router").LoadArgs): import("router").TaskSnapshot<Data> | undefined;
    }
    export type RoutesInit<Component, Data> = {
        router?: import("router").Router<Component, any> | undefined;
        parent?: RouteGroup<Component, any> | undefined;
        path?: string | undefined;
        slot?: string | undefined;
        layout?: Component | undefined;
        fallback?: Component | undefined;
        load?: import("router").Load<Data> | undefined;
        lazy?: import("router").LazyRoutes<Component> | undefined;
        routes?: import("router").NestedRoutes<Component> | undefined;
    };
    import { Task } from "lib/task";
}
declare module "lib/route" {
    /**
     * @template [Data=unknown]
     * @template {unknown[]} [Args=unknown[]]
     * @typedef {ActionFunction<Data, Args> & ActionStatic<Data>} Action
     */
    /**
     * @template [Data=unknown]
     * @template {unknown[]} [Args=unknown[]]
     * @typedef {(...args: Args) => Promise<Data>} ActionFunction
     */
    /**
     * @template [Data=unknown]
     * @typedef {Object} ActionStatic
     * @property {boolean} loading
     * @property {Data} [data]
     * @property {Error} [error]
     * @property {(e: SubmitEvent) => void} submit
     */
    /**
     * @template Component
     * @template Data
     * @typedef {Object} RouteInit
     * @property {import("./router").Router<Component>} [router]
     * @property {import("./route-group").RouteGroup<Component>} [parent]
     * @property {string} [path]
     * @property {string} [slot]
     * @property {Component} [page]
     * @property {Component} [fallback]
     * @property {import("./router").Load<Data>} [load]
     * @property {import("./router").LazyPage<Component>} [lazy]
     * @property {Record<string, ActionFunction>} [actions]
     */
    /**
     * @template Component
     * @template Data
     * @param {RouteInit<Component, Data>} routeInit
     * @return
     */
    export function createRoute<Component, Data>(routeInit: RouteInit<Component, Data>): Route<Component, Data>;
    /**
     * @template Component
     * @template [Data=unknown]
     */
    export class Route<Component, Data = unknown> {
        /**
         * @param {RouteInit<Component, Data>} routeInit
         */
        constructor(routeInit?: RouteInit<Component, Data>);
        router: import("router").Router<Component, any>;
        parent: import("router").RouteGroup<Component, any>;
        path: string;
        slot: string | undefined;
        fullPath: string;
        page: NonNullable<Component> | undefined;
        fallback: Component | undefined;
        pattern: URLPattern;
        load: Task<Data, [args: import("router").LoadArgs]> | undefined;
        lazy: Task<Component, []> | undefined;
        /** @type {Record<string, Action>} */
        actions: Record<string, Action>;
        /**
         * @param {string} path
         */
        invalidate(path: string): void;
        /**
         * @param {string} pathname
         */
        test(pathname: string): boolean;
        /**
         *
         * @param {string} pathname
         * @returns {import("./router").RouteNode<Component> | undefined}
         */
        resolve(pathname: string): import("router").RouteNode<Component> | undefined;
        /**
         * @param {import("./route-group").RouteGroup<Component>} parent
         */
        setParent(parent: import("router").RouteGroup<Component>): void;
        /**
         * @returns {import("./task").TaskSnapshot<Component> | undefined}
         */
        getPage(): import("router").TaskSnapshot<Component> | undefined;
        /**
         * @param {import("./router").LoadArgs} args
         * @returns {import("./task").TaskSnapshot<Data> | undefined}
         */
        getData(args: import("router").LoadArgs): import("router").TaskSnapshot<Data> | undefined;
        getActions(): void;
    }
    export type Action<Data = unknown, Args extends unknown[] = unknown[]> = ActionFunction<Data, Args> & ActionStatic<Data>;
    export type ActionFunction<Data = unknown, Args extends unknown[] = unknown[]> = (...args: Args) => Promise<Data>;
    export type ActionStatic<Data = unknown> = {
        loading: boolean;
        data?: Data | undefined;
        error?: Error | undefined;
        submit: (e: SubmitEvent) => void;
    };
    export type RouteInit<Component, Data> = {
        router?: import("router").Router<Component, any> | undefined;
        parent?: import("router").RouteGroup<Component, any> | undefined;
        path?: string | undefined;
        slot?: string | undefined;
        page?: Component | undefined;
        fallback?: Component | undefined;
        load?: import("router").Load<Data> | undefined;
        lazy?: import("router").LazyPage<Component> | undefined;
        actions?: Record<string, ActionFunction<unknown, unknown[]>> | undefined;
    };
    import { Task } from "lib/task";
}
declare module "lib/router" {
    /**
     * @template Component
     * @template Data
     * @typedef {import("./route-group").RoutesInit<Component, Data>} RouterInit
     */
    /**
     * @template Component
     * @template Data
     * @param {RouterInit<Component, Data>} routerInit
     * @returns {Router<Component, Data>}
     */
    export function createRouter<Component, Data>(routerInit: RouterInit<Component, Data>): Router<Component, Data>;
    /**
     * @param  {...string} parts
     * @returns {string}
     */
    export function join(...parts: string[]): string;
    /**
     * @template Component
     * @param {NestedRoutes<Component> | undefined} routes
     * @param {RouteGroup<Component>} parent
     * @returns {(Routable<Component>)[]}
     */
    export function normalize<Component>(routes: NestedRoutes<Component> | undefined, parent: RouteGroup<Component>): (Routable<Component>)[];
    /**
     * @param {string} previousPath
     * @param {string} nextPath
     * @returns {string | undefined}
     */
    export function exitedPath(previousPath: string, nextPath: string): string | undefined;
    /**
     * @template Component
     * @template [Data=unknown]
     */
    export class Router<Component, Data = unknown> {
        /**
         * @param {RouterInit<Component, Data>} routerInit
         */
        constructor(routerInit: RouterInit<Component, Data>);
        /** @type {RouteGroup<Component>} */
        root: RouteGroup<Component>;
        /**
         * @param {string} pathname
         */
        push(pathname: string): void;
        /**
         * @param {string} pathname
         */
        replace(pathname: string): void;
        forward(): void;
        back(): void;
        /**
         * @param {Subscriber<Component>} subscriber
         */
        subscribe(subscriber: Subscriber<Component>): void;
        /**
         * @param {Subscriber<Component>} subscriber
         */
        unsubscribe(subscriber: Subscriber<Component>): void;
        clear(): void;
        /**
         * @param {HTMLAnchorElement} anchor
         */
        link: (anchor: HTMLAnchorElement) => void;
        /**
         * @param {string} path
         */
        invalidate(path: string): void;
        update: () => void;
        updating: boolean | undefined;
        requestUpdate: () => void;
        #private;
    }
    export type RouterInit<Component, Data> = import("router").RoutesInit<Component, Data>;
    export type Params = Record<string, string>;
    export type LoadArgs = {
        params: Params;
        searchParams: URLSearchParams;
    };
    export type Subscriber<Component> = (tree: RouteNode<Component> | undefined) => void;
    export type Routable<Component> = Route<Component> | RouteGroup<Component>;
    export type NestedRoutes<Component> = (Routable<Component>) | (Routable<Component>)[];
    export type Load<Data> = (args: LoadArgs) => Promise<Data>;
    export type LazyRoutes<Component> = () => Promise<{
        default: NestedRoutes<Component>;
    }>;
    export type LazyPage<Component> = () => Promise<{
        default: Component;
    }>;
    export type RouteNode<Component, Data = unknown> = {
        hash: string;
        path: string;
        page?: Component | undefined;
        layout?: Component | undefined;
        children?: RouteNode<Component, unknown> | undefined;
        slots?: Record<string, RouteNode<Component, unknown>> | undefined;
        loading: boolean;
        data?: Data | undefined;
        error?: Error | undefined;
        params: Params;
        searchParams: URLSearchParams;
    };
    import { RouteGroup } from "lib/route-group";
    import { Route } from "lib/route";
}
declare module "router" {
    export * from "lib/router";
    export * from "lib/route-group";
    export * from "lib/route";
    export * from "lib/task";
}
