import { QueryClient } from "@tanstack/react-query";
import { createRouter } from "@tanstack/react-router";
import { savesSettled } from "./lib/browser-save";
import { identityFor, noteAddress, toInternalPath, toPublicPath } from "./lib/portal-url";
import { routeTree } from "./routeTree.gen";

/** true: every move to another page is a full document reload (it flashes between pages). false: instant in-app transitions; the address and tab title still change on every page. */
const FULL_PAGE_LOADS = false;

export const getRouter = () => {
  // One client per request: a module-level QueryClient leaks cached data between SSR requests.
  const queryClient = new QueryClient();

  const router = createRouter({
    routeTree,
    context: { queryClient },
    scrollRestoration: true,
    // Lets Query own freshness; set caching defaults on the QueryClient, not the router.
    defaultPreloadStaleTime: 0,
    // Public addresses look like /ulls/student/student/daily-schedule; the app's own routes stay short (/schedule).
    rewrite: {
      input: ({ url }) => {
        const hit = toInternalPath(url.pathname);
        if (!hit) return url;
        noteAddress(hit.path, hit.identity);
        url.pathname = hit.path;
        return url;
      },
      output: ({ url }) => {
        const pub = toPublicPath(url.pathname, identityFor(url.pathname));
        if (pub) url.pathname = pub;
        return url;
      },
    },
  });

  if (FULL_PAGE_LOADS && typeof window !== "undefined") {
    const navigate = router.navigate.bind(router);
    router.navigate = (async (options: Parameters<typeof navigate>[0]) => {
      // Let a change that was just made reach browser storage first: the next page reads it straight away.
      await new Promise((resolve) => setTimeout(resolve, 25));
      await savesSettled();
      return navigate({ ...options, reloadDocument: true } as Parameters<typeof navigate>[0]);
    }) as unknown as typeof router.navigate;
  }

  return router;
};
