package com.webchat.util;

import static org.assertj.core.api.Assertions.assertThat;

import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

/**
 * JWT 校验的测试。
 *
 * <p>这里的重点是「非法输入必须被拒绝且不抛异常」。{@code validateToken} 是所有鉴权路径的入口，若它对畸形 token 抛异常而非返回 false，
 * 异常会穿透到全局处理器，把 401 变成 500。
 */
class JwtUtilTest {

    private static final String SECRET =
            "WebChat2026SecretKeyMustBe256BitsLongForHS512Algorithm!!_ABCDEFGH";
    private final JwtUtil jwt = new JwtUtil(SECRET, 86_400_000L);

    @Test
    @DisplayName("签发的 token 可被验证，并能取回正确的 userId")
    void issuedTokenIsValidAndCarriesUserId() {
        String token = jwt.generateToken(42L, "alice");

        assertThat(jwt.validateToken(token)).isTrue();
        assertThat(jwt.getUserIdFromToken(token)).isEqualTo(42L);
    }

    @Test
    @DisplayName("畸形 token 必须返回 false，而不是抛异常")
    void malformedTokenReturnsFalse() {
        assertThat(jwt.validateToken("not-a-jwt")).isFalse();
        assertThat(jwt.validateToken("")).isFalse();
        assertThat(jwt.validateToken("a.b.c")).isFalse();
        assertThat(jwt.validateToken(null)).isFalse();
    }

    @Test
    @DisplayName("换密钥签发的 token 必须被拒绝（防伪造）")
    void tokenSignedWithDifferentKeyIsRejected() {
        JwtUtil attacker =
                new JwtUtil(
                        "AttackerKeyMustAlsoBe256BitsLongToAvoidWeakKeyExceptions!!!_XXXX",
                        86_400_000L);
        String forged = attacker.generateToken(1L, "attacker");

        assertThat(jwt.validateToken(forged)).as("用别的密钥签的 token 不能通过校验").isFalse();
    }

    @Test
    @DisplayName("已过期的 token 必须被拒绝")
    void expiredTokenIsRejected() {
        // 负过期时间 → 签发即过期
        JwtUtil shortLived = new JwtUtil(SECRET, -1_000L);
        String expired = shortLived.generateToken(1L, "bob");

        assertThat(shortLived.validateToken(expired)).isFalse();
    }
}
