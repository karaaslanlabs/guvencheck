import assert from "node:assert/strict";
import { createServer } from "node:http";
import { pathToFileURL } from "node:url";

const platformEntry = process.env.AGENT_PLATFORM_API_ENTRY;
assert.ok(platformEntry, "AGENT_PLATFORM_API_ENTRY is required");
const { createLocalTaskRuntime } = await import(pathToFileURL(platformEntry).href);
let nextId = 0;
const api = createLocalTaskRuntime({
  createTaskId: () => `m2-2-runtime-${++nextId}`,
  now: () => new Date().toISOString(),
});

const server = createServer(async (incoming, outgoing) => {
  const chunks = [];
  for await (const chunk of incoming) chunks.push(chunk);
  const address = server.address();
  assert.ok(address && typeof address === "object");
  const request = new Request(`http://127.0.0.1:${address.port}${incoming.url}`, {
    method: incoming.method,
    headers: incoming.headers,
    body: chunks.length ? Buffer.concat(chunks) : undefined,
  });
  const response = await api(request);
  outgoing.writeHead(response.status, Object.fromEntries(response.headers));
  outgoing.end(Buffer.from(await response.arrayBuffer()));
});

server.listen(0, "127.0.0.1", () => {
  const address = server.address();
  assert.ok(address && typeof address === "object");
  process.stdout.write(`${JSON.stringify({ baseUrl: `http://127.0.0.1:${address.port}` })}\n`);
});

for (const signal of ["SIGINT", "SIGTERM"]) process.on(signal, () => server.close(() => process.exit(0)));
