import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import {
  Outlet,
  Link,
  createRootRouteWithContext,
  useRouter,
  HeadContent,
  Scripts,
  type ErrorComponentProps,
} from "@tanstack/react-router";
import { useEffect, type ReactNode } from "react";

import appCss from "../styles.css?url";
import { reportLovableError } from "../lib/lovable-error-reporting";
import { PortalStoreProvider } from "../lib/portal-store";
import { SchoolStoreProvider } from "../lib/school-store";
import { ErrorPage } from "../components/common/ErrorPage";
import { Toaster } from "../components/ui/sonner";
import { PortalTitle } from "../components/common/PortalTitle";

function NotFoundComponent() {
  return <ErrorPage title="Page Not Found" message="There is no page for the URL specified." />;
}

function ErrorComponent({ error, reset }: ErrorComponentProps) {
  console.error(error);
  const router = useRouter();
  useEffect(() => {
    reportLovableError(error, { boundary: "tanstack_root_error_component" });
  }, [error]);

  return <ErrorPage title="Something Went Wrong" message="This page couldn't be shown." detail={`${error.message || "An unexpected error occurred."} Please contact your support representative if the problem continues.`}><button onClick={() => { router.invalidate(); reset(); }} className="mt-4 h-[28px] bg-[#333] px-4 text-[12px] text-white">Try again</button></ErrorPage>;
}

export const Route = createRootRouteWithContext<{ queryClient: QueryClient }>()({
  head: () => ({
    // Replace these placeholders with the app's name and description when first building the app.
    // Each content route, / included, must still set its own head(). Never add og:image or
    // twitter:image here: every page without its own would inherit the root's preview image.
    meta: [
      { charSet: "utf-8" },
      { name: "viewport", content: "width=device-width, initial-scale=1" },
      { title: "Cedar Ridge Academy Portal" },
      { name: "description", content: "Cedar Ridge Academy student information system." },
      { property: "og:title", content: "Cedar Ridge Academy Portal" },
      { property: "og:description", content: "Cedar Ridge Academy student information system." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
    links: [
      {
        rel: "stylesheet",
        href: appCss,
      },
      { rel: "icon", type: "image/png", href: "/favicon.png" },
      { rel: "preconnect", href: "https://fonts.googleapis.com" },
      { rel: "preconnect", href: "https://fonts.gstatic.com", crossOrigin: "anonymous" },
      { rel: "stylesheet", href: "https://fonts.googleapis.com/css2?family=Source+Sans+3:ital,wght@0,300;0,400;0,600;0,700;1,400&display=swap" },
    ],
  }),
  shellComponent: RootShell,
  component: RootComponent,
  notFoundComponent: NotFoundComponent,
  errorComponent: ErrorComponent,
});

function RootShell({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <head>
        <HeadContent />
        {/* Until the saved school data has loaded (PortalTitle sets data-ready) the page background is the soft panel gray, so a refresh never flashes white. */}
        <style dangerouslySetInnerHTML={{ __html: "html:not([data-ready]) body{background-color:oklch(0.965 0.002 250)}" }} />
      </head>
      <body>
        {children}
        <Scripts />
      </body>
    </html>
  );
}

function RootComponent() {
  const { queryClient } = Route.useRouteContext();

  return (
    <QueryClientProvider client={queryClient}>
      {/* Required: nested routes render here. Removing <Outlet /> breaks all child routes. */}
      <SchoolStoreProvider>
        <PortalStoreProvider>
          
          <Outlet />
          <PortalTitle />
          <Toaster />
        </PortalStoreProvider>
      </SchoolStoreProvider>
    </QueryClientProvider>
  );
}
