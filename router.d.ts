declare module "lib/task" {
    /**
     * @template {unknown[]} Args
     * @template Data
     * @param {TaskFunction<Args, Data>} task
     * @param {Data} [initialData]
     * @returns {Task<Args, Data>}
     */
    export function task<Args extends unknown[], Data>(task: TaskFunction<Args, Data>, initialData?: Data | undefined): Task<Args, Data>;
    /**
     * @template {unknown[]} [Args=unknown[]]
     * @template [Data=unknown]
     */
    export class Task<Args extends unknown[] = unknown[], Data = unknown> {
        /**
         * @param {TaskFunction<Args, Data>} task
         * @param {Data} [initialData]
         */
        constructor(task: TaskFunction<Args, Data>, initialData?: Data | undefined);
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
         * @param {TaskCallback<Data>} [callback]
         * @returns {Promise<TaskSnapshot<Data>>}
         */
        run(args: Args, callback?: TaskCallback<Data> | undefined): Promise<TaskSnapshot<Data>>;
        /**
         * @param {Args} args
         * @param {TaskCallback<Data>} [callback]
         * @returns {TaskSnapshot<Data>}
         */
        cache(args: Args, callback?: TaskCallback<Data> | undefined): TaskSnapshot<Data>;
        #private;
    }
    export type TaskFunction<Args extends unknown[], Data> = (...args: Args) => Promise<Data>;
    export type TaskCallback<Data> = (snapshot: TaskSnapshot<Data>) => void;
    export type TaskSnapshot<Data> = {
        loading: boolean;
        data?: Data | undefined;
        error?: Error | undefined;
    };
}
declare module "lib/route-group" {
    /**
     * @template Component
     * @template Data
     * @template {import("./router").Actions} Actions
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
     * @property {Actions} [actions]
     */
    /**
     * @template Component
     * @template Data
     * @template {import("./router").Actions} Actions
     * @param {RoutesInit<Component, Data, Actions>} routesInit
     * @returns
     */
    export function createRouteGroup<Component, Data, Actions extends import("router").Actions>(routesInit: RoutesInit<Component, Data, Actions>): RouteGroup<Component, Data, Actions>;
    /**
     * @template Component
     * @template [Data=unknown]
     * @template {import("./router").Actions} [Actions=import("./router").Actions]
     */
    export class RouteGroup<Component, Data = unknown, Actions extends import("router").Actions = import("router").Actions> {
        /**
         * @param {RoutesInit<Component, Data, Actions>} routesInit
         */
        constructor(routesInit?: RoutesInit<Component, Data, Actions>);
        router: import("router").Router<Component, any, import("router").Actions>;
        parent: RouteGroup<Component, any, import("router").Actions>;
        slot: string | undefined;
        path: string;
        fullPath: string;
        layout: Component | undefined;
        fallback: Component | undefined;
        routes: import("router").Routable<Component>[];
        pattern: URLPattern;
        load: Task<[args: import("router").LoadArgs], Data> | undefined;
        /** @type {Task<[], import("./router").Routable<Component>[]> | undefined} */
        lazy: Task<[], import("router").Routable<Component>[]> | undefined;
        /** @type {Record<string, import("./router").Action>} */
        actions: Record<string, import("router").Action>;
        /**
         * @param {string} pathname
         */
        invalidate(pathname: string): void;
        /**
         * @param {string} pathname
         * @returns {import("./router").Params}
         */
        match(pathname: string): import("router").Params;
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
        getChildren(pathname: string): import("router").RouteNode<Component> | undefined;
        /**
         * @param {string} pathname
         * @returns {Record<string, import("./router").RouteNode<Component>>}
         */
        getSlots(pathname: string): Record<string, import("router").RouteNode<Component>>;
        /**
         * @returns {import("./task").TaskSnapshot<(import("./router").Routable<Component>)[]>}
         */
        getRoutes(): import("router").TaskSnapshot<(import("router").Routable<Component>)[]>;
        /**
         * @param {import("./router").LoadArgs} args
         * @returns {import("./task").TaskSnapshot<Data>}
         */
        getData(args: import("router").LoadArgs): import("router").TaskSnapshot<Data>;
        /**
         * @param {RouteGroup<Component>} parent
         */
        setParent(parent: RouteGroup<Component>): void;
        #private;
    }
    export type RoutesInit<Component, Data, Actions extends import("router").Actions> = {
        router?: import("router").Router<Component, any, import("router").Actions> | undefined;
        parent?: RouteGroup<Component, any, import("router").Actions> | undefined;
        path?: string | undefined;
        slot?: string | undefined;
        layout?: Component | undefined;
        fallback?: Component | undefined;
        load?: import("router").Load<Data> | undefined;
        lazy?: import("router").LazyRoutes<Component> | undefined;
        routes?: import("router").NestedRoutes<Component> | undefined;
        actions?: Actions | undefined;
    };
    import { Task } from "lib/task";
}
declare module "lib/route" {
    /**
     * @template Component
     * @template Data
     * @template {import("./router").Actions} Actions
     * @typedef {Object} RouteInit
     * @property {import("./router").Router<Component>} [router]
     * @property {import("./route-group").RouteGroup<Component>} [parent]
     * @property {string} [path]
     * @property {string} [slot]
     * @property {Component} [page]
     * @property {Component} [fallback]
     * @property {import("./router").Load<Data>} [load]
     * @property {import("./router").LazyPage<Component>} [lazy]
     * @property {Actions} [actions]
     */
    /**
     * @template Component
     * @template Data
     * @template {import("./router").Actions} Actions
     * @param {RouteInit<Component, Data, Actions>} routeInit
     * @return
     */
    export function createRoute<Component, Data, Actions extends import("router").Actions>(routeInit: RouteInit<Component, Data, Actions>): Route<Component, Data, Actions>;
    /**
     * @template Component
     * @template [Data=unknown]
     * @template {import("./router").Actions} [Actions=import("./router").Actions]
     */
    export class Route<Component, Data = unknown, Actions extends import("router").Actions = import("router").Actions> {
        /**
         * @param {RouteInit<Component, Data, Actions>} routeInit
         */
        constructor(routeInit?: RouteInit<Component, Data, Actions>);
        router: import("router").Router<Component, any, import("router").Actions>;
        parent: import("router").RouteGroup<Component, any, import("router").Actions>;
        path: string;
        slot: string | undefined;
        fullPath: string;
        page: NonNullable<Component> | undefined;
        fallback: Component | undefined;
        pattern: URLPattern;
        load: Task<[args: import("router").LoadArgs], Data> | undefined;
        lazy: Task<[], Component> | undefined;
        /** @type {Record<string, import("./router").Action>} */
        actions: Record<string, import("router").Action>;
        /**
         * @param {string} pathname
         */
        invalidate(pathname: string): void;
        /**
         * @param {string} pathname
         * @returns {import("./router").Params}
         */
        match(pathname: string): import("router").Params;
        /**
         *
         * @param {string} pathname
         * @returns {import("./router").RouteNode<Component> | undefined}
         */
        resolve(pathname: string): import("router").RouteNode<Component> | undefined;
        /**
         * @returns {import("./task").TaskSnapshot<Component>}
         */
        getPage(): import("router").TaskSnapshot<Component>;
        /**
         * @param {import("./router").LoadArgs} args
         * @returns {import("./task").TaskSnapshot<Data>}
         */
        getData(args: import("router").LoadArgs): import("router").TaskSnapshot<Data>;
        /**
         * @param {import("./route-group").RouteGroup<Component>} parent
         */
        setParent(parent: import("router").RouteGroup<Component>): void;
        #private;
    }
    export type RouteInit<Component, Data, Actions extends import("router").Actions> = {
        router?: import("router").Router<Component, any, import("router").Actions> | undefined;
        parent?: import("router").RouteGroup<Component, any, import("router").Actions> | undefined;
        path?: string | undefined;
        slot?: string | undefined;
        page?: Component | undefined;
        fallback?: Component | undefined;
        load?: import("router").Load<Data> | undefined;
        lazy?: import("router").LazyPage<Component> | undefined;
        actions?: Actions | undefined;
    };
    import { Task } from "lib/task";
}
declare module "lib/router" {
    /**
     * @template Component
     * @template Data
     * @template {Actions} RouterActions
     * @typedef {import("./route-group").RoutesInit<Component, Data, RouterActions>} RouterInit
     */
    /**
     * @template Component
     * @template Data
     * @template {Actions} RouterActions
     * @param {RouterInit<Component, Data, RouterActions>} routerInit
     * @returns {Router<Component, Data, RouterActions>}
     */
    export function createRouter<Component, Data, RouterActions extends Actions>(routerInit: RouterInit<Component, Data, RouterActions>): Router<Component, Data, RouterActions>;
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
     * @param {string} path
     * @returns {RegExp}
     */
    export function compileInvalidatePattern(path: string): RegExp;
    /**
     * @param {string} previousPath
     * @param {string} nextPath
     * @returns {string | undefined}
     */
    export function exitedPath(previousPath: string, nextPath: string): string | undefined;
    /**
     * @template Data
     * @param {Action<[FormData, Data?], Data>} action
     * @returns {(event: SubmitEvent) => void}
     */
    export function submit<Data>(action: Action<[FormData, Data?], Data>): (event: SubmitEvent) => void;
    /**
     * @template Component
     * @template [Data=unknown]
     * @template {Actions} [RouterActions=Actions]
     */
    export class Router<Component, Data = unknown, RouterActions extends Actions = Actions> {
        /**
         * @param {RouterInit<Component, Data, RouterActions>} routerInit
         */
        constructor(routerInit: RouterInit<Component, Data, RouterActions>);
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
        /**
         * @template Data
         * @template {unknown[]} Args
         * @param {import("./task").TaskFunction<Args, Data>} actionFunction
         * @returns {Action<Args, Data>}
         */
        action<Data_1, Args extends unknown[]>(actionFunction: import("router").TaskFunction<Args, Data_1>): Action<Args, Data_1>;
        update: () => void;
        updating: boolean | undefined;
        requestUpdate: () => void;
        #private;
    }
    export type RouterInit<Component, Data, RouterActions extends Actions> = import("router").RoutesInit<Component, Data, RouterActions>;
    export type Params = Record<string, string>;
    export type Subscriber<Component> = (tree: RouteNode<Component> | undefined) => void;
    export type Routable<Component> = Route<Component> | RouteGroup<Component>;
    export type NestedRoutes<Component> = (Routable<Component>) | (Routable<Component>)[];
    export type LazyRoutes<Component> = () => Promise<{
        default: NestedRoutes<Component>;
    }>;
    export type LazyPage<Component> = () => Promise<{
        default: Component;
    }>;
    export type Load<Data> = (args: LoadArgs) => Promise<Data>;
    export type LoadArgs = {
        path: string;
        params: Params;
        searchParams: URLSearchParams;
    };
    export type Actions = Record<string, ActionFunction>;
    export type Action<Args extends unknown[] = unknown[], Data = unknown> = ActionFunction<Args, import("router").TaskSnapshot<Data>> & ActionStatic<Data> & import("router").TaskSnapshot<Data>;
    export type ActionFunction<Args extends unknown[] = unknown[], Data = unknown> = (...args: Args) => Promise<Data>;
    export type ActionStatic<Data = unknown> = {
        invalidate: () => void;
    };
    export type SubmitEvent = {
        preventDefault: Function;
        currentTarget: EventTarget | null;
    };
    export type RouteNode<Component, Data = unknown, RouteActions extends Actions = Actions> = {
        hash: string;
        path: string;
        page?: Component | undefined;
        layout?: Component | undefined;
        children?: RouteNode<Component, unknown, Actions> | undefined;
        slots?: Record<string, RouteNode<Component, unknown, Actions>> | undefined;
        loading: boolean;
        data?: Data | undefined;
        error?: Error | undefined;
        params: Params;
        searchParams: URLSearchParams;
        actions?: RouteActions | undefined;
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
