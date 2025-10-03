import { type RouteConfig, index, route } from "@react-router/dev/routes";

export default [
  // Public routes (no auth required)
  route("/login", "./routes/login.tsx"),
  route("/no-access", "./routes/no-access.tsx"),

  // Root index - will handle redirect logic to org/estate routes
  index("./routes/root-redirect.tsx"),

  // New organization creation
  route("/new-organization", "./routes/new-organization.tsx"),

  // Admin routes (admin only, no estate context required)
  route("/admin", "./routes/admin-layout.tsx", [
    index("./routes/admin-redirect.tsx"),
    route("session-info", "./routes/admin-session-info.tsx"),
    route("slack-notification", "./routes/admin-slack-notification.tsx"),
    route("db-tools", "./routes/admin-db-tools.tsx"),
    route("trpc-tools", "./routes/admin-trpc-tools.tsx"),
    route("estates", "./routes/admin-estates.tsx"),
  ]),

  // All organization routes (with or without estate context)
  route(":organizationId", "./routes/org-layout.tsx", [
    // Organization-level routes
    index("./routes/org-redirect.tsx"),
    route("settings", "./routes/org-settings.tsx"),
    route("team", "./routes/org-team.tsx"),

    // Estate-specific routes
    route(":estateId", "./routes/home.tsx"),
    route(":estateId/integrations", "./routes/integrations.tsx"),
    route(":estateId/integrations/mcp-params", "./routes/integrations.mcp-params.tsx"),
    route(":estateId/integrations/redirect", "./routes/integrations.redirect.tsx"),
    route(":estateId/estate", "./routes/estate.tsx"),
    route(":estateId/agents", "./routes/agents-index.tsx"),
    route(":estateId/agents/start-slack", "./routes/agents.start-slack.tsx"),
    route(":estateId/agents/:agentClassName/:durableObjectName", "./routes/agents.tsx"),
  ]),

  // Catch-all route for 404
  route("*", "./routes/404.tsx"),
] satisfies RouteConfig;
