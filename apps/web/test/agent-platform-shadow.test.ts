import assert from "node:assert/strict";
import test from "node:test";
import {
  preserveProductResultWithShadow,
  submitAnalysisShadow,
  toAgentPlatformTask,
} from "../lib/agent-platform-shadow.ts";

test("maps the real payload contract without forwarding image bytes or risk output", () => {
  assert.deepEqual(toAgentPlatformTask({ type: "text", content: "controlled" }, "req-1"), {
    type: "guvencheck.content.analyze",
    payload: { content: { kind: "message", text: "controlled" } },
  });
  assert.deepEqual(toAgentPlatformTask({ type: "link", content: "https://example.com" }, "req-2"), {
    type: "guvencheck.content.analyze",
    payload: { content: { kind: "link", url: "https://example.com" } },
  });
  const imageTask = toAgentPlatformTask({ type: "image", imageData: "data:image/png;base64,secret" }, "req-3");
  assert.deepEqual(imageTask, {
    type: "guvencheck.content.analyze",
    payload: { content: { kind: "screenshot_reference", reference: "asset://guvencheck/request/req-3/screenshot" } },
  });
  assert.equal(JSON.stringify(imageTask).includes("secret"), false);
});

test("is fail-open and preserves the exact product result object", async () => {
  const result = { level: "high", score: 91 };
  const returned = await preserveProductResultWithShadow(result, { type: "text", content: "controlled" }, "req-4", {
    platformUrl: "http://agent-platform.local",
    fetchImpl: async () => { throw new Error("injected outage"); },
  });
  assert.equal(returned, result);
});

test("telemetry failures cannot escape the shadow boundary", async () => {
  const observation = await submitAnalysisShadow({ type: "text", content: "controlled" }, "req-5", {
    platformUrl: "http://agent-platform.local",
    fetchImpl: async () => new Response(JSON.stringify({ task: { id: "task-1" } }), { status: 201 }),
    observe: () => { throw new Error("telemetry unavailable"); },
  });
  assert.equal(observation.accepted, true);
  assert.equal(observation.taskId, "task-1");
});
