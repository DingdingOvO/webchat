package com.webchat.controller;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.when;

import com.webchat.model.User;
import com.webchat.service.AuthService;
import com.webchat.util.BusinessException;
import com.webchat.util.UnauthorizedException;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

/**
 * 鉴权公共层的回归测试。
 *
 * <p>重点覆盖两点：头部解析的优先级/回退规则，以及异常原因的保留。 这两处此前在 5 个控制器里各复制了一份，任一处的行为漂移都会造成线上 401。
 */
class AuthenticationSupportTest {

    private AuthService authService;
    private AuthenticationSupport support;

    @BeforeEach
    void setUp() {
        authService = mock(AuthService.class);
        support = new AuthenticationSupport(authService);
    }

    @Test
    @DisplayName("X-Auth-Token 优先于 Authorization")
    void prefersXAuthTokenHeader() {
        User fromXAuth = new User();
        fromXAuth.setId(7L);
        // 网关会改写 Authorization，因此 X-Auth-Token 必须优先被采用。
        when(authService.validateToken("gateway-token")).thenReturn(fromXAuth);

        User result = support.authenticate("gateway-token", "Bearer other-token");

        assertThat(result.getId()).isEqualTo(7L);
    }

    @Test
    @DisplayName("X-Auth-Token 带 Bearer 前缀时也会被剥掉")
    void stripsBearerPrefixFromXAuthToken() {
        User user = new User();
        user.setId(1L);
        when(authService.validateToken("abc")).thenReturn(user);

        assertThat(support.authenticate("Bearer abc", null)).isSameAs(user);
    }

    @Test
    @DisplayName("无 X-Auth-Token 时回退解析 Authorization: Bearer")
    void fallsBackToAuthorizationHeader() {
        User user = new User();
        user.setId(2L);
        when(authService.validateToken("fallback")).thenReturn(user);

        assertThat(support.authenticate(null, "Bearer fallback")).isSameAs(user);
    }

    @Test
    @DisplayName("Authorization 缺少 Bearer 前缀时不接受")
    void rejectsAuthorizationWithoutBearerPrefix() {
        // 裸 token 放在 Authorization 里属于非预期格式，不能默默放行。
        assertThatThrownBy(() -> support.authenticate(null, "raw-token"))
                .isInstanceOf(UnauthorizedException.class);
    }

    @Test
    @DisplayName("两个头部都为空时抛 401")
    void rejectsWhenNoTokenPresent() {
        assertThatThrownBy(() -> support.authenticate(null, null))
                .isInstanceOf(UnauthorizedException.class);
        assertThatThrownBy(() -> support.authenticate("   ", ""))
                .isInstanceOf(UnauthorizedException.class);
    }

    @Test
    @DisplayName("校验失败时保留原始异常作为 cause")
    void preservesOriginalCauseOnFailure() {
        BusinessException rootCause = new BusinessException("无效 token");
        when(authService.validateToken(anyString())).thenThrow(rootCause);

        assertThatThrownBy(() -> support.authenticate("bad-token", null))
                .isInstanceOf(UnauthorizedException.class)
                // 关键：cause 不能被丢弃，否则「凭证过期」与「服务故障」无法区分。
                .hasCauseInstanceOf(BusinessException.class)
                .hasRootCauseMessage("无效 token");
    }
}
