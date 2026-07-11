/**
 * 在 app 入口处调用，全局 patch fetch 自动追加 sandbox 代理参数。
 * 预览环境的 webview proxy 需要在每个请求中保留
 * x-cs-sandbox-id / x-cs-sandbox-port 参数才能正确路由到后端。
 */
export function patchFetch() {
  const origFetch = window.fetch.bind(window);
  window.fetch = (input: RequestInfo | URL, init?: RequestInit): Promise<Response> => {
    const search = window.location.search;
    if (!search) return origFetch(input, init);

    const url = typeof input === 'string' ? input : input instanceof URL ? input.href : input.url;
    const separator = url.includes('?') ? '&' : '?';
    const patchedUrl = `${url}${separator}${search.slice(1)}`;
    return origFetch(patchedUrl, init);
  };
}
