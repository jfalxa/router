declare module "lib/task" {
    /**
     * @template Data
     * @template Args
     * @param {TaskFunction<Data, Args>} task
     * @param {Data} [initialData]
     * @returns {Task<Data, Args>}
     */
    export function task<Data, Args>(task: TaskFunction<Data, Args>, initialData?: Data | undefined): Task<Data, Args>;
    /**
     * @template Data
     * @template Args
     */
    export class Task<Data, Args> {
        /**
         * @template Data
         * @param {Data | undefined} [data]
         * @param {Error | undefined} [error]
         * @param {boolean} [loading]
         * @returns {TaskSnapshot<Data>}
         */
        static snapshot<Data_1>(data?: Data_1 | undefined, error?: Error | undefined, loading?: boolean | undefined): TaskSnapshot<Data_1>;
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
         * @param {Args} args
         * @returns {Promise<TaskSnapshot<Data>>}
         */
        run(args: Args): Promise<TaskSnapshot<Data>>;
        #private;
    }
    export type TaskFunction<Data, Args> = (args: Args) => Promise<Data>;
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
        /** @type {import("./router").Router<Component>} */
        router: import("router").Router<Component>;
        /** @type {import("./route-group").RouteGroup<Component>} */
        parent: import("lib/route-group").RouteGroup<Component>;
        /** @type {URLPattern} */
        pattern: URLPattern;
        /** @type {Task<import("./router").Routable<Component>[], void> | undefined} */
        lazy: Task<import("router").Routable<Component>[], void> | undefined;
        /** @type {Task<Data, import("./router").LoadArgs> | undefined} */
        load: Task<Data, import("router").LoadArgs> | undefined;
        slot: string | undefined;
        path: string;
        fullPath: string;
        layout: Component | undefined;
        fallback: Component | undefined;
        routes: import("router").Routable<Component>[];
        /**
         * @param {string} pathname
         * @param {boolean} [withFallback]
         * @returns {import("./router").RouteNode<Component> | undefined}
         */
        match(pathname: string, withFallback?: boolean | undefined): import("router").RouteNode<Component> | undefined;
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
         * @returns {import("./task").TaskSnapshot<(import("./router").Routable<Component>)[]>}
         */
        getRoutes(): import("router").TaskSnapshot<(import("router").Routable<Component>)[]>;
        /**
         * @param {string} pathname
         * @param {import("./router").LoadArgs} args
         * @returns {import("./task").TaskSnapshot<Data>}
         */
        getData(pathname: string, args: import("router").LoadArgs): import("router").TaskSnapshot<Data>;
    }
    export type RoutesInit<Component, Data> = {
        router?: import("router").Router<Component> | undefined;
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
        /** @type {import("./router").Router<Component>} */ router: import("router").Router<Component>;
        /** @type {import("./route-group").RouteGroup<Component>} */ parent: import("router").RouteGroup<Component>;
        /** @type {URLPattern} */ pattern: URLPattern;
        path: string;
        slot: string | undefined;
        fullPath: string;
        page: NonNullable<Component> | undefined;
        fallback: Component | undefined;
        load: Task<Data, import("router").LoadArgs> | undefined;
        lazy: Task<Component, any> | undefined;
        /**
         *
         * @param {string} pathname
         * @returns {import("./router").RouteNode<Component> | undefined}
         */
        match(pathname: string): import("router").RouteNode<Component> | undefined;
        /**
         * @param {import("./route-group").RouteGroup<Component>} parent
         */
        setParent(parent: import("router").RouteGroup<Component>): void;
        /**
         * @returns {import("./task").TaskSnapshot<Component>}
         */
        getPage(): import("router").TaskSnapshot<Component>;
        /**
         * @param {string} pathname
         * @param {import("./router").LoadArgs} args
         * @returns {import("./task").TaskSnapshot<Data>}
         */
        getData(pathname: string, args: import("router").LoadArgs): import("router").TaskSnapshot<Data>;
    }
    export type RouteInit<Component, Data> = {
        router?: import("router").Router<Component> | undefined;
        parent?: import("router").RouteGroup<Component, any> | undefined;
        path?: string | undefined;
        slot?: string | undefined;
        page?: Component | undefined;
        fallback?: Component | undefined;
        load?: import("router").Load<Data> | undefined;
        lazy?: import("router").LazyPage<Component> | undefined;
    };
    import { Task } from "lib/task";
}
declare module "lib/router" {
    /**
     * @template Component
     * @typedef {Object} RouterInit
     * @property {NestedRoutes<Component>} [routes]
     * @property {Component} [fallback]
     * @property {Component} [layout]
     */
    /**
     * @template Component
     * @param {RouterInit<Component>} routerInit
     * @returns {Router<Component>}
     */
    export function createRouter<Component>(routerInit: RouterInit<Component>): Router<Component>;
    /**
     * @param {string} path
     * @param {Record<string, unknown>} store
     */
    export function invalidate(path: string, store: Record<string, unknown>): void;
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
     * @template Component
     */
    export class Router<Component> {
        /**
         * @param {RouterInit<Component>} routerInit
         */
        constructor(routerInit: RouterInit<Component>);
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
         * @template Data
         * @template Args
         * @param {string} key
         * @param {import("./task").Task<Data, Args>} task
         * @param {Args} [args]
         * @returns {import("./task").TaskSnapshot<Data>}
         */
        cache<Data, Args>(key: string, task: import("lib/task").Task<Data, Args>, args?: Args | undefined): import("router").TaskSnapshot<Data>;
        /**
         * @param {string} path
         */
        invalidate(path: string): void;
        update: () => void;
        updating: boolean | undefined;
        requestUpdate: () => void;
        #private;
    }
    export type RouterInit<Component> = {
        routes?: NestedRoutes<Component> | undefined;
        fallback?: Component | undefined;
        layout?: Component | undefined;
    };
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
        page?: Component;
        layout?: Component;
        children?: RouteNode<Component> | undefined;
        slots?: Record<string, RouteNode<Component>>;
        data: Data | undefined;
        loading: boolean;
        error: Error | undefined;
        params: Params;
        searchParams: URLSearchParams;
    };
    import { RouteGroup } from "lib/route-group";
    import { Task } from "lib/task";
    import { Route } from "lib/route";
}
declare module "router" {
    export * from "lib/router";
    export * from "lib/route-group";
    export * from "lib/route";
    export * from "lib/task";
}
