import { createRequestHandler } from "react-router";
import { proxy } from "hono/proxy";
import { Hono } from "hono";

const requestHandler = createRequestHandler(
  //@ts-expect-error - this is a virtual module
  () => import("virtual:react-router/server-build"),
);

const app = new Hono();

app.get("*", async (c, next) => {
  if (c.req.header("Host") === "iterate.com") {
    return c.redirect("https://www.iterate.com", 301);
  }
  return next();
});

// PostHog proxy routes (order matters - most specific first)
app.all("/ingest/decide", async (c) => {
  const url = new URL(c.req.url);
  const targetUrl = `https://eu.i.posthog.com/decide${url.search}`;
  return proxy(targetUrl, { ...c.req });
});

app.all("/ingest/static/*", async (c) => {
  const url = new URL(c.req.url);
  const path = url.pathname.replace("/ingest/static", "");
  const targetUrl = `https://eu-assets.i.posthog.com/static${path}${url.search}`;
  return proxy(targetUrl, { ...c.req });
});

app.all("/ingest/*", async (c) => {
  const url = new URL(c.req.url);
  const path = url.pathname.replace("/ingest", "");
  const targetUrl = `https://eu.i.posthog.com${path}${url.search}`;
  return proxy(targetUrl, { ...c.req });
});

app.get("/content-images/*", async (c) => {
  const url = new URL(c.req.url);
  const imagePath = url.pathname.replace("/content-images/", "");

  try {
    const images = import.meta.glob("../content/**/*.{png,jpg,jpeg,gif,svg,webp}", {
      eager: false,
      query: "?url",
      import: "default",
    });

    const imageKey = `../content/${imagePath}`;
    const imageImport = images[imageKey];

    if (imageImport) {
      const imageUrl = (await imageImport()) as string;
      return c.redirect(imageUrl);
    }
  } catch (error) {
    console.error("Error loading image:", error);
  }

  return c.notFound();
});

// React Router fallback for 404s
app.notFound((c) => {
  return requestHandler(c.req.raw);
});

// Export the Hono app directly as the default export
// Cloudflare Workers will use the fetch method from the Hono app
export default app;
