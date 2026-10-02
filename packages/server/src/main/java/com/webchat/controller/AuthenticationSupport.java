package com.webchat.controller;

import com.webchat.model.User;
import com.webchat.service.AuthService;
import com.webchat.util.BusinessException;
import com.webchat.util.UnauthorizedException;
import org.springframework.stereotype.Component;

/**
 * 请求鉴权的公共实现。
 *
 * <p>此前每个控制器各自复制了一份 {@code extractToken} + {@code authenticate}，且把 {@code "X-Auth-Token"} / {@code
 * "Authorization"} / {@code "Bearer "} 三个字面量重复了 7 遍。一旦网关侧的头部名调整，需要同时改 5 个文件、漏一处就是线上 401。 现统一收拢到此组件。
 *
 * <p>做成独立组件而非控制器基类，是因为 {@code AuthController} 自身既有公开接口（注册/登录）又有受保护接口（/me）， 不适合整体继承一个「需要鉴权」的基类。
 */
@Component
public class AuthenticationSupport {

    /** 网关会改写 Authorization，因此部署环境以 X-Auth-Token 为主，Authorization 仅作回退。 */
    public static final String HEADER_X_AUTH_TOKEN = "X-Auth-Token";

    public static final String HEADER_AUTHORIZATION = "Authorization";

    private static final String BEARER_PREFIX = "Bearer ";

    private final AuthService authService;

    public AuthenticationSupport(AuthService authService) {
        this.authService = authService;
    }

    /** 校验请求头部中的 token 并返回当前用户；未携带或校验失败时抛 401。 */
    public User authenticate(String xAuth, String auth) {
        String token = extractToken(xAuth, auth);
        if (token == null) {
            throw new UnauthorizedException("未授权");
        }
        try {
            return authService.validateToken(token);
        } catch (BusinessException | IllegalArgumentException ex) {
            // 保留原始异常作为 cause：否则 token 过期、签名错误、用户不存在
            // 全都退化成同一句「未授权」，排查时无法区分是凭证问题还是数据问题。
            throw new UnauthorizedException("未授权", ex);
        }
    }

    /** 提取 token：优先 X-Auth-Token（网关会改写 Authorization，故部署环境用此头）， 回退 Authorization: Bearer。 */
    private static String extractToken(String xAuth, String auth) {
        if (xAuth != null && !xAuth.isBlank()) {
            return xAuth.startsWith(BEARER_PREFIX)
                    ? xAuth.substring(BEARER_PREFIX.length())
                    : xAuth.trim();
        }
        if (auth != null && auth.startsWith(BEARER_PREFIX)) {
            return auth.substring(BEARER_PREFIX.length());
        }
        return null;
    }
}
