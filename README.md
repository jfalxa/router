# Router


## Example

```js
import { render } from "your-framework"
import { createRouter, createRoute as Route, createRouteGroup as RouteGroup } from "router";

// async operations
import { loadBlog, saveBlog, loadBlogPost } from "@/api";

// components of your framework
import Loading from "@/components/loading";
import BlogLayout from "@/routes/layout";
import HeaderSlot from "@/routes/header";
import PostPage from "@/routes/post_id";

const router = createRouter({
  layout: BlogLayout,
  load: loadBlog,
  actions: { saveBlog },

  routes: [
    Route({
      slot: "header",
      page: HeaderSlot,
    }),

    Route({
      path: ":post_id",
      page: PostPage,
      load: loadBlogPost,
    }),

    Route({
      path: "specific-post",
      lazy: () => import("./specific-post"),
      fallback: Loading,
    }),

    RouteGroup({
      path: "subpath",
      lazy: () => import("./subpath/routes"),
      fallback: Loading,
    }),
  ],
});

// watch changes in routing to rerender the new route tree with your own framework
router.subscribe((routeTreeRoot) => render(routeTreeRoot))

// go to the `/specific-post` page
router.push('/specific-post')
```

The `routeTreeRoot` object fed to the subscribe callback has the following structure :

```ts
// `ComponentType` is the type of the components of your framework
// `LoadDataType` is the type returned by the load() route property

type RouteTreeNode = {
  path: string;
  params: { [key: string]: string };
  searchParams: URLSearchParams;

  page?: ComponentType;
  layout?: ComponentType;
  children?: RouteTreeNode;
  slots?: { [key: string]: RouteTreeNode };

  loading: boolean;
  data?: LoadDataType;
  error?: Error;

  actions?: { [key: string]: Action<unknown[], unknown> };
};

type Action<Args, Data> = ((...args: Args) => Promise<{ data?: Data; error?: Error }>) & {
  loading: boolean
  data?: Data
  error?: Error
}
```