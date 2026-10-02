/**
 * 头像色相：按对象 id 稳定映射到 8 组配色之一。
 *
 * 为什么单独抽出来：聊天列表、联系人列表、消息分组头都要用同一套映射，
 * 否则同一个人在不同位置会显示成不同颜色，反而更乱。
 */
export const HUE_COUNT = 8;

/** 把任意 id（数字或字符串）稳定地映射为 0..HUE_COUNT-1 */
export function hueIndex(id: number | string): number {
  const n =
    typeof id === 'number'
      ? id
      : [...String(id)].reduce((acc, ch) => acc + ch.charCodeAt(0), 0);
  return Math.abs(n) % HUE_COUNT;
}
