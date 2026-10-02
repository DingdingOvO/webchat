/**
 * 后端返回的时间戳是 **epoch 秒**（浮点数字，如 1790909901.969），
 * 但 TS 类型上被声明为 string。
 *
 * 直接 `new Date(sec)` 会得到 1970 年的错误时间；
 * 直接 `new Date("1790909901.969")` 会得到 Invalid Date（进而 getTime() 为 NaN，
 * 让任何基于时间的排序静默失效）。
 *
 * 这里统一归一化为毫秒。
 */
export function toMillis(ts: string | number | null | undefined): number {
  if (ts === null || ts === undefined) return 0;
  const n = typeof ts === 'number' ? ts : Number(ts);
  if (Number.isFinite(n)) {
    // 10 位以内按秒，13 位及以上按毫秒
    return n < 1e12 ? n * 1000 : n;
  }
  const parsed = Date.parse(String(ts));
  return Number.isFinite(parsed) ? parsed : 0;
}

/** 格式化为 HH:mm */
export function formatTime(ts: string | number | null | undefined): string {
  const ms = toMillis(ts);
  if (!ms) return '';
  return new Date(ms).toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' });
}
