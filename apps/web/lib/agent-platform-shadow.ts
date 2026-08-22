export type GuvenCheckAnalysisInput = {
  type: "text" | "link" | "image";
  content?: string;
  imageData?: string;
};

export type ShadowObservation = {
  accepted: boolean;
  latencyMs: number;
  taskId?: string;
  failureCode?: "SHADOW_DISABLED" | "SHADOW_SUBMISSION_FAILED";
};

type ShadowOptions = {
  platformUrl?: string;
  timeoutMs?: number;
  fetchImpl?: typeof fetch;
  nowMs?: () => number;
  observe?: (observation: ShadowObservation) => void;
};

function observeSafely(options: ShadowOptions, observation: ShadowObservation) {
  try {
    options.observe?.(observation);
  } catch {
    // Shadow telemetry is best-effort and never owns the product result.
  }
}

export function toAgentPlatformTask(input: GuvenCheckAnalysisInput, requestId: string) {
  const content = input.type === "image"
    ? { kind: "screenshot_reference", reference: `asset://guvencheck/request/${requestId}/screenshot` }
    : input.type === "link"
      ? { kind: "link", url: input.content || "" }
      : { kind: "message", text: input.content || "" };

  return { type: "guvencheck.content.analyze", payload: { content } };
}

/**
 * Submits an observational task after GüvenCheck has produced its result.
 * Raw image data and the product risk result are deliberately not forwarded.
 */
export async function submitAnalysisShadow(
  input: GuvenCheckAnalysisInput,
  requestId: string,
  options: ShadowOptions = {},
): Promise<ShadowObservation> {
  const platformUrl = options.platformUrl ?? process.env.AGENT_PLATFORM_SHADOW_URL;
  const startedAt = (options.nowMs ?? Date.now)();
  if (!platformUrl) {
    const observation = { accepted: false, latencyMs: 0, failureCode: "SHADOW_DISABLED" as const };
    observeSafely(options, observation);
    return observation;
  }

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), options.timeoutMs ?? 750);
  try {
    const response = await (options.fetchImpl ?? fetch)(`${platformUrl.replace(/\/$/, "")}/tasks`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(toAgentPlatformTask(input, requestId)),
      signal: controller.signal,
    });
    if (!response.ok) throw new Error(`SHADOW_HTTP_${response.status}`);
    const body = await response.json() as { task?: { id?: string } };
    const observation = {
      accepted: true,
      latencyMs: (options.nowMs ?? Date.now)() - startedAt,
      taskId: body.task?.id,
    };
    observeSafely(options, observation);
    return observation;
  } catch {
    const observation = {
      accepted: false,
      latencyMs: (options.nowMs ?? Date.now)() - startedAt,
      failureCode: "SHADOW_SUBMISSION_FAILED" as const,
    };
    observeSafely(options, observation);
    return observation;
  } finally {
    clearTimeout(timeout);
  }
}

export async function preserveProductResultWithShadow<TResult>(
  result: TResult,
  input: GuvenCheckAnalysisInput,
  requestId: string,
  options?: ShadowOptions,
): Promise<TResult> {
  await submitAnalysisShadow(input, requestId, options);
  return result;
}
