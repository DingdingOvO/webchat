package com.webchat.config;

import static org.assertj.core.api.Assertions.assertThat;

import com.webchat.util.BusinessException;
import com.webchat.util.UnauthorizedException;
import java.util.Map;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.servlet.resource.NoResourceFoundException;

/**
 * 全局异常映射的测试。
 *
 * <p>这里曾有一个真实问题：{@code NoResourceFoundException}（路径不存在） 落到了
 * {@code @ExceptionHandler(Exception.class)} 的兜底分支， 被报成 500「服务器内部错误」并打 ERROR 日志。
 *
 * <p>危害是误导排查方向：前端调了一个拼错的或尚未实现的接口， 表现却是「后端崩了」，于是去查服务端故障，而真实原因只是路由不存在。
 *
 * <p>测试锁死「路径不存在 → 404」这一映射。
 */
class GlobalExceptionHandlerTest {

    private final GlobalExceptionHandler handler = new GlobalExceptionHandler();

    @Test
    @DisplayName("路径不存在必须返回 404，不能伪装成 500")
    void missingResourceMapsTo404() {
        ResponseEntity<?> res =
                handler.handleNotFound(
                        new NoResourceFoundException(
                                org.springframework.http.HttpMethod.GET, "/api/health"));

        assertThat(res.getStatusCode()).isEqualTo(HttpStatus.NOT_FOUND);
        assertThat(res.getBody()).isInstanceOf(Map.class);
    }

    @Test
    @DisplayName("未授权必须是 401")
    void unauthorizedMapsTo401() {
        ResponseEntity<?> res = handler.handleUnauthorized(new UnauthorizedException("未授权"));

        assertThat(res.getStatusCode()).isEqualTo(HttpStatus.UNAUTHORIZED);
    }

    @Test
    @DisplayName("业务异常必须是 400，并保留原始消息")
    void businessExceptionMapsTo400WithMessage() {
        ResponseEntity<?> res = handler.handleBusiness(new BusinessException("用户名已存在"));

        assertThat(res.getStatusCode()).isEqualTo(HttpStatus.BAD_REQUEST);
        assertThat(String.valueOf(res.getBody())).contains("用户名已存在");
    }

    @Test
    @DisplayName("真·未知异常仍然是 500 —— 不要把兜底也改没了")
    void genuineUnexpectedErrorStillMapsTo500() {
        ResponseEntity<?> res = handler.handleGeneric(new IllegalStateException("boom"));

        assertThat(res.getStatusCode())
                .as("修复 404 的同时不能把真正的服务端错误也变成 404")
                .isEqualTo(HttpStatus.INTERNAL_SERVER_ERROR);
    }
}
