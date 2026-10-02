package com.webchat.util;

/** 业务异常基类，GlobalExceptionHandler 据此返回 400 */
public class BusinessException extends RuntimeException {

    /** 显式声明，避免序列化/反序列化时因 JVM 自动生成值不同而抛 InvalidClassException */
    private static final long serialVersionUID = 1L;

    public BusinessException(String message) {
        super(message);
    }
}
