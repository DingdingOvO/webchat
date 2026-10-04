/**
 * 统一的 API 客户端。
 *
 * 为什么需要它：
 * 此前 18 处 `fetch()` 散落在 6 个页面/组件里，每处都手工重复
 *   headers: { Authorization: `Bearer ${token}`, 'X-Auth-Token': token }
 * 这段样板。一旦遗漏 X-Auth-Token，本地正常、公网 401
 * （部署平台网关会覆盖 Authorization，后端因此优先读 X-Auth-Token）。
 *
 * 这里把「鉴权头拼装 + JSON 解析 + 错误归一化」收敛到一处：
 * 调用方只关心「要什么」，不再关心「怎么带 token」。
 */

/** 后端业务异常（带 code 与消息），由 api 层统一抛出。 */
export class ApiError extends Error {
  readonly status: number;

  constructor(message: string, status: number) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
  }
}

/**
 * token 由 AuthContext 在每次请求前注入，避免 api 模块反向依赖 React。
 * 未登录时为空字符串。
 */
let authToken = '';

export function setAuthToken(token: string | null) {
  authToken = token ?? '';
}

/** 组装鉴权头。两个头都发：Authorization 给标准中间件，X-Auth-Token 给网关穿透。 */
function authHeaders(): Record<string, string> {
  if (!authToken) return {};
  return { Authorization: `Bearer ${authToken}`, 'X-Auth-Token': authToken };
}

/** 把非 2xx 响应转成可读错误，尽量取后端返回的 message。 */
async function toError(res: Response): Promise<ApiError> {
  let message = `请求失败（${res.status}）`;
  try {
    const text = await res.text();
    if (text) {
      try {
        const body = JSON.parse(text);
        message = body.message ?? body.error ?? message;
      } catch {
        // 非 JSON 响应（如网关的纯文本报错），保留原文便于排查
        message = text.slice(0, 200) || message;
      }
    }
  } catch {
    /* 读流失败则用默认消息 */
  }
  return new ApiError(message, res.status);
}

type Options = Omit<RequestInit, 'headers'> & { headers?: Record<string, string> };

async function request<T>(path: string, options: Options = {}): Promise<T> {
  const { headers, ...rest } = options;
  const res = await fetch(path, {
    ...rest,
    headers: { 'Content-Type': 'application/json', ...authHeaders(), ...headers },
  });
  if (!res.ok) throw await toError(res);
  // 204 或空响应体
  if (res.status === 204) return undefined as T;
  const text = await res.text();
  return (text ? JSON.parse(text) : undefined) as T;
}

/** GET 便捷方法。 */
export function apiGet<T>(path: string, options?: Options): Promise<T> {
  return request<T>(path, { ...options, method: 'GET' });
}

/** POST（自动 JSON 序列化 body）。 */
export function apiPost<T>(path: string, body?: unknown, options?: Options): Promise<T> {
  return request<T>(path, {
    ...options,
    method: 'POST',
    body: body === undefined ? undefined : JSON.stringify(body),
  });
}

/** PUT。 */
export function apiPut<T>(path: string, body?: unknown, options?: Options): Promise<T> {
  return request<T>(path, {
    ...options,
    method: 'PUT',
    body: body === undefined ? undefined : JSON.stringify(body),
  });
}

/** DELETE。 */
export function apiDelete<T>(path: string, options?: Options): Promise<T> {
  return request<T>(path, { ...options, method: 'DELETE' });
}

/** 带查询参数的 GET：自动 encode，避免手写 encodeURIComponent 漏掉。 */
export function apiGetWithQuery<T>(path: string, query: Record<string, string | number>): Promise<T> {
  const qs = new URLSearchParams(Object.entries(query).map(([k, v]) => [k, String(v)])).toString();
  return apiGet<T>(qs ? `${path}?${qs}` : path);
}
