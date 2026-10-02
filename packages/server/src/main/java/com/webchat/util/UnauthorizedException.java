package com.webchat.util;

/**
 * 未授权异常。
 *
 * <p>除消息外还支持携带根因（cause）：鉴权失败可能源于 token 过期、 签名不匹配、或依赖服务不可用等多种原因。若只保留一句「未授权」，
 * 排查时无法区分「用户凭证有问题」与「服务端故障」，会把运维方向带偏。
 */
public class UnauthorizedException extends RuntimeException {

    /** 显式声明，避免序列化/反序列化时因 JVM 自动生成值不同而抛 InvalidClassException */
    private static final long serialVersionUID = 1L;

    public UnauthorizedException(String message) {
        super(message);
    }

    public UnauthorizedException(String message, Throwable cause) {
        super(message, cause);
    }
}
