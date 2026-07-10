/**
 * Aero Message Protocol (AMP) v1
 * 自研消息协议：结构化帧格式
 *
 * 帧结构:
 *   Frame {
 *     version: 1,               // 协议版本
 *     type: 'request' | 'push', // 帧类型
 *     topic: string,            // 主题 (message / typing / read / online / ack)
 *     seq: number,              // 序列号（单调递增，用于去重和排序）
 *     payload: T,               // 业务负载
 *     meta: {                   // 元数据
 *       sender: number,         // 发送者ID
 *       timestamp: number,      // Unix毫秒时间戳
 *       ack?: number,          // 确认的序列号（响应时回填）
 *     }
 *   }
 */

export interface AmpFrame<T = unknown> {
  version: 1;
  type: 'request' | 'push';
  topic: AmpTopic;
  seq: number;
  payload: T;
  meta: AmpMeta;
}

export type AmpTopic = 'message' | 'typing' | 'read' | 'online' | 'ack' | 'error';

export interface AmpMeta {
  sender: number;
  timestamp: number;
  ack?: number;
}

/* ---- 消息负载 ---- */

export interface MessagePayload {
  type: 'p2p' | 'group';
  receiverId: number;
  content: string;
}

export interface MessagePush {
  id: string;
  senderId: number;
  senderName: string;
  receiverId: number;
  type: 'P2P' | 'GROUP';
  content: string;
  createdAt: string;
}

export interface TypingPayload {
  conversationKey: string;
  userId: number;
}

export interface ReadPayload {
  conversationKey: string;
}

export interface OnlinePush {
  userId: number;
  nickname: string;
  online: boolean;
}

/* ---- 工厂函数 ---- */

let seqCounter = 0;

export function createFrame<T>(type: 'request' | 'push', topic: AmpTopic, payload: T, senderId: number): AmpFrame<T> {
  return {
    version: 1,
    type,
    topic,
    seq: ++seqCounter,
    payload,
    meta: { sender: senderId, timestamp: Date.now() },
  };
}

export function createAck(frame: AmpFrame, senderId: number): AmpFrame<{ ok: boolean }> {
  return {
    version: 1,
    type: 'push',
    topic: 'ack',
    seq: ++seqCounter,
    payload: { ok: true },
    meta: { sender: senderId, timestamp: Date.now(), ack: frame.seq },
  };
}
