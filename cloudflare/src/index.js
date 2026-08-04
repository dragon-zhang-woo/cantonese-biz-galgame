import {
  hashClientKey,
  PublicBudgetExhausted,
  readClientKey,
  reservePublicTurn,
  snapshotPublicBudget,
} from "./budget.js";
import { dualModelReady, providerName, readConfig } from "./config.js";
import { playDualModelTurn } from "./providers.js";
import { RequestValidationError, validateTurnRequest } from "./validation.js";

const MAX_TURN_BODY_BYTES = 24 * 1024;

function responseHeaders(request, config) {
  const headers = new Headers({
    "Cache-Control": "no-store",
    "Content-Type": "application/json; charset=utf-8",
    "Referrer-Policy": "no-referrer",
    "X-Content-Type-Options": "nosniff",
  });
  const origin = request.headers.get("Origin")?.replace(/\/$/, "");
  if (origin && config.allowedOrigins.includes(origin)) {
    headers.set("Access-Control-Allow-Origin", origin);
    headers.set("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
    headers.set("Access-Control-Allow-Headers", "Content-Type");
    headers.set("Vary", "Origin");
  }
  return headers;
}

function json(request, config, payload, status = 200) {
  return new Response(JSON.stringify(payload), {
    status,
    headers: responseHeaders(request, config),
  });
}

function errorResponse(request, config, status, code, message, recoverable = true) {
  return json(
    request,
    config,
    { detail: { code, message, recoverable } },
    status,
  );
}

function originAllowed(request, config) {
  const origin = request.headers.get("Origin")?.replace(/\/$/, "");
  return !origin || config.allowedOrigins.includes(origin);
}

async function parseTurnBody(request) {
  const declaredLength = Number(request.headers.get("Content-Length") || 0);
  if (declaredLength > MAX_TURN_BODY_BYTES) {
    throw new RequestValidationError("Request body is too large.");
  }
  const raw = await request.text();
  if (new TextEncoder().encode(raw).byteLength > MAX_TURN_BODY_BYTES) {
    throw new RequestValidationError("Request body is too large.");
  }
  return validateTurnRequest(JSON.parse(raw));
}

function speechCapabilities() {
  return {
    configured: false,
    live_supported: false,
    upload_supported: false,
    accepted_mime_types: [
      "audio/webm",
      "audio/mp4",
      "audio/mpeg",
      "audio/wav",
      "audio/x-wav",
      "audio/aac",
      "audio/ogg",
    ],
    max_upload_bytes: 25 * 1024 * 1024,
    recording_limits_ms: {
      campaign_turn: 90_000,
      practice_turn: 90_000,
      custom_turn: 120_000,
      scenario_intake: 300_000,
    },
  };
}

export function createWorker({ fetchImpl = fetch } = {}) {
  return {
    async fetch(request, env) {
      let config;
      try {
        config = readConfig(env);
      } catch {
        config = readConfig({});
        return errorResponse(
          request,
          config,
          500,
          "invalid_server_configuration",
          "云端服务配置无效，请继续使用离线训练。",
        );
      }

      if (!originAllowed(request, config)) {
        return errorResponse(
          request,
          config,
          403,
          "origin_not_allowed",
          "此网页来源无权调用公开 API。",
          false,
        );
      }
      if (request.method === "OPTIONS") {
        return new Response(null, {
          status: 204,
          headers: responseHeaders(request, config),
        });
      }

      const path = new URL(request.url).pathname.replace(/\/$/, "") || "/";
      const ready = dualModelReady(env);
      const budgetReady = Boolean(
        env.DB &&
          typeof env.PUBLIC_AI_CLIENT_HASH_SALT === "string" &&
          env.PUBLIC_AI_CLIENT_HASH_SALT.trim(),
      );
      const deploymentReady = ready && budgetReady;
      const provider = providerName(env);

      if (request.method === "GET" && path === "/health") {
        return json(
          request,
          config,
          {
            status: deploymentReady ? "ok" : "degraded",
            provider,
            dual_model_ready: ready,
          },
          deploymentReady ? 200 : 503,
        );
      }

      if (request.method === "GET" && path === "/api/public/quota") {
        try {
          const quota = await snapshotPublicBudget(env.DB, config);
          return json(request, config, {
            provider,
            dual_model_ready: ready,
            ...quota,
          });
        } catch {
          return errorResponse(
            request,
            config,
            503,
            "budget_store_unavailable",
            "云端额度记录暂时不可用，请继续使用离线训练。",
          );
        }
      }

      if (
        request.method === "GET" &&
        path === "/api/speech/capabilities"
      ) {
        return json(request, config, speechCapabilities());
      }

      if (request.method === "POST" && path === "/api/scenario/compose") {
        return errorResponse(
          request,
          config,
          503,
          "offline_composer_required",
          "公开版使用浏览器本地规则编排。",
        );
      }

      if (request.method === "POST" && path === "/api/game/turn") {
        if (!ready) {
          return errorResponse(
            request,
            config,
            503,
            "dual_model_unavailable",
            "云端双模型尚未完整配置，请继续使用离线训练。",
          );
        }
        if (!budgetReady) {
          return errorResponse(
            request,
            config,
            503,
            "budget_store_unavailable",
            "云端额度记录暂时不可用，请继续使用离线训练。",
          );
        }

        let turnRequest;
        try {
          turnRequest = await parseTurnBody(request);
        } catch {
          return errorResponse(
            request,
            config,
            422,
            "invalid_request",
            "本轮输入不符合公开 API 的安全边界。",
            false,
          );
        }

        try {
          const clientHash = await hashClientKey(
            readClientKey(request),
            env.PUBLIC_AI_CLIENT_HASH_SALT,
          );
          await reservePublicTurn(env.DB, clientHash, config);
        } catch (error) {
          if (error instanceof PublicBudgetExhausted) {
            return errorResponse(
              request,
              config,
              429,
              "public_budget_exhausted",
              "公开演示的云端增强额度已用完，请继续使用离线训练。",
            );
          }
          return errorResponse(
            request,
            config,
            503,
            "budget_store_unavailable",
            "云端额度记录暂时不可用，请继续使用离线训练。",
          );
        }

        const result = await playDualModelTurn(
          turnRequest,
          env,
          config,
          fetchImpl,
        );
        return json(request, config, result);
      }

      return errorResponse(
        request,
        config,
        404,
        "not_found",
        "API 路径不存在。",
        false,
      );
    },
  };
}

export default createWorker();
