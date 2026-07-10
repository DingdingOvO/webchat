package com.webchat.config;

import com.webchat.util.BusinessException;
import com.webchat.util.UnauthorizedException;
import org.springframework.core.io.ClassPathResource;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.MissingRequestHeaderException;
import org.springframework.web.bind.annotation.ControllerAdvice;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.servlet.resource.NoResourceFoundException;

import java.nio.charset.StandardCharsets;
import java.util.Map;

@ControllerAdvice
public class GlobalExceptionHandler {

    @ExceptionHandler(UnauthorizedException.class)
    public ResponseEntity<?> handleUnauthorized(UnauthorizedException e) {
        return ResponseEntity.status(401).body(Map.of("error", e.getMessage() != null ? e.getMessage() : "未授权"));
    }

    @ExceptionHandler(MissingRequestHeaderException.class)
    public ResponseEntity<?> handleMissingHeader(MissingRequestHeaderException e) {
        return ResponseEntity.status(401).body(Map.of("error", "未授权"));
    }

    @ExceptionHandler(BusinessException.class)
    public ResponseEntity<?> handleBusiness(BusinessException e) {
        return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
    }

    /** SPA 路由 fallback：未匹配到的路径返回 index.html（仅 HTML 请求）。 */
    @ExceptionHandler(NoResourceFoundException.class)
    public ResponseEntity<?> handleSpaFallback(NoResourceFoundException e) {
        String resourcePath = e.getResourcePath();
        // API 路径和明确静态资源走 404
        if (resourcePath != null
                && (resourcePath.startsWith("api/")
                        || resourcePath.contains(".")
                        || resourcePath.startsWith("ws"))) {
            return ResponseEntity.status(404).body(Map.of("error", "Not found"));
        }
        try {
            ClassPathResource index = new ClassPathResource("static/index.html");
            byte[] bytes = index.getInputStream().readAllBytes();
            return ResponseEntity.ok()
                    .contentType(MediaType.TEXT_HTML)
                    .body(new String(bytes, StandardCharsets.UTF_8));
        } catch (Exception ex) {
            return ResponseEntity.status(500).body(Map.of("error", "SPA fallback missing"));
        }
    }

    @ExceptionHandler(RuntimeException.class)
    public ResponseEntity<?> handleRuntime(RuntimeException e) {
        String msg = e.getMessage();
        if (msg != null && (msg.contains("未授权") || msg.contains("无效 token"))) {
            return ResponseEntity.status(401).body(Map.of("error", msg));
        }
        return ResponseEntity.badRequest().body(Map.of("error", msg != null ? msg : "请求失败"));
    }

    @ExceptionHandler(Exception.class)
    public ResponseEntity<?> handleGeneric(Exception e) {
        return ResponseEntity.status(500).body(Map.of("error", "服务器内部错误"));
    }
}
