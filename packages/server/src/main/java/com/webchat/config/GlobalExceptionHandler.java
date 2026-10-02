package com.webchat.config;

import com.webchat.util.BusinessException;
import com.webchat.util.LogSanitizer;
import com.webchat.util.UnauthorizedException;
import edu.umd.cs.findbugs.annotations.SuppressFBWarnings;
import java.util.Map;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.MissingRequestHeaderException;
import org.springframework.web.bind.annotation.ControllerAdvice;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.servlet.resource.NoResourceFoundException;

@ControllerAdvice
public class GlobalExceptionHandler {

    private static final Logger LOG = LoggerFactory.getLogger(GlobalExceptionHandler.class);

    /** 响应体统一的错误字段名。集中成常量，避免同一字面量散落在各处。 */
    private static final String FIELD_ERROR = "error";

    @ExceptionHandler(UnauthorizedException.class)
    public ResponseEntity<?> handleUnauthorized(UnauthorizedException ex) {
        return ResponseEntity.status(401)
                .body(Map.of(FIELD_ERROR, ex.getMessage() != null ? ex.getMessage() : "未授权"));
    }

    @ExceptionHandler(MissingRequestHeaderException.class)
    public ResponseEntity<?> handleMissingHeader(MissingRequestHeaderException ex) {
        return ResponseEntity.status(401).body(Map.of(FIELD_ERROR, "未授权"));
    }

    @ExceptionHandler(BusinessException.class)
    public ResponseEntity<?> handleBusiness(BusinessException ex) {
        return ResponseEntity.badRequest().body(Map.of(FIELD_ERROR, ex.getMessage()));
    }

    /**
     * 路径不存在要如实返回 404。
     *
     * <p>若不加这个处理器，{@code NoResourceFoundException} 会被下面的 {@link #handleGeneric(Exception)} 兜底成
     * 500「服务器内部错误」， 并打出 ERROR 级日志。后果是：任何拼错的路径、前端调用尚未实现的 接口，都表现为「后端崩了」，把排查方向引向服务端故障，而真实原因 只是路由不存在。
     */
    @ExceptionHandler(NoResourceFoundException.class)
    public ResponseEntity<?> handleNotFound(NoResourceFoundException ex) {
        return ResponseEntity.status(404).body(Map.of(FIELD_ERROR, "接口不存在"));
    }

    @SuppressFBWarnings(
            value = "CRLF_INJECTION_LOGS",
            justification = "msg 已经 LogSanitizer.safe() 转义换行与控制字符后再写入日志")
    @ExceptionHandler(RuntimeException.class)
    public ResponseEntity<?> handleRuntime(RuntimeException ex) {
        String msg = ex.getMessage();
        if (msg != null && (msg.contains("未授权") || msg.contains("无效 token"))) {
            return ResponseEntity.status(401).body(Map.of(FIELD_ERROR, msg));
        }
        // 转义后再记录：异常消息可能包含用户可控内容，
        // 直接写入会被 CRLF 注入伪造日志行。
        if (LOG.isWarnEnabled()) {
            LOG.warn("请求处理失败: {}", LogSanitizer.safe(msg), ex);
        }
        return ResponseEntity.badRequest().body(Map.of(FIELD_ERROR, msg != null ? msg : "请求失败"));
    }

    @ExceptionHandler(Exception.class)
    public ResponseEntity<?> handleGeneric(Exception ex) {
        LOG.error("未捕获异常", ex);
        return ResponseEntity.status(500).body(Map.of(FIELD_ERROR, "服务器内部错误"));
    }
}
