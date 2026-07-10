package com.webchat.util;

/** 业务异常基类，GlobalExceptionHandler 据此返回 400 */
public class BusinessException extends RuntimeException {
    public BusinessException(String message) {
        super(message);
    }
}
