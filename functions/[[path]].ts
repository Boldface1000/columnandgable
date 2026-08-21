// Cloudflare Pages Functions catch-all.
// Delegates every request to the Workers-format module TanStack Start
// already builds at dist/server/server.js (export default { fetch }).
// Pages' function bundler resolves this relative import at deploy time,
// so the SSR server runs as a Pages Function instead of a standalone Worker.

type ServerEntry = {
  fetch: (request: Request, env: unknown, ctx: unknown) => Promise<Response> | Response;
};

// eslint-disable-next-line @typescript-eslint/no-explicit-any
let entry: Promise<ServerEntry> | undefined;

async function getEntry(): Promise<ServerEntry> {
  if (!entry) {
    // Path is relative to this file's location once bundled.
    entry = import("../dist/server/server.js").then((m) => (m.default ?? m) as ServerEntry);
  }
  return entry;
}

export const onRequest: PagesFunction = async (context) => {
  const server = await getEntry();
  return server.fetch(context.request, context.env, context);
};
