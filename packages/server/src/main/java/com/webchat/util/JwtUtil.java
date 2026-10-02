package com.webchat.util;

import edu.umd.cs.findbugs.annotations.SuppressFBWarnings;
import io.jsonwebtoken.*;
import io.jsonwebtoken.security.Keys;
import java.nio.charset.StandardCharsets;
import java.time.Instant;
import java.util.Date;
import javax.crypto.SecretKey;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;

@Component
public class JwtUtil {

    private final SecretKey key;
    private final long expirationMs;

    /**
     * 构造器在密钥不合法时会抛异常，这是有意的：宁可启动即失败， 也不要带着一个弱/非法密钥运行到线上。
     *
     * <p>SpotBugs 的 CT_CONSTRUCTOR_THROW 提示「构造器抛异常在子类化时 有风险」。本类是 final 语义的 Spring 组件、无子类，属确认的误报。
     */
    @SuppressFBWarnings(
            value = "CT_CONSTRUCTOR_THROW",
            justification = "本类为 Spring 组件且无子类，启动期校验密钥合法性是预期行为")
    public JwtUtil(
            @Value("${jwt.secret}") String secret,
            @Value("${jwt.expiration-ms}") long expirationMs) {
        this.key = Keys.hmacShaKeyFor(secret.getBytes(StandardCharsets.UTF_8));
        this.expirationMs = expirationMs;
    }

    public String generateToken(Long userId, String username) {
        Instant now = Instant.now();
        return Jwts.builder()
                .subject(userId.toString())
                .claim("username", username)
                // jjwt 0.12 的 issuedAt/expiration 只接受 java.util.Date，
                // 这是库本身的 API 约束（PMD ReplaceJavaUtilDate 在此属无法规避
                // 的第三方接口要求）。内部一律走 java.time，仅在边界处转换。
                .issuedAt(Date.from(now))
                .expiration(Date.from(now.plusMillis(expirationMs)))
                .signWith(key)
                .compact();
    }

    public Long getUserIdFromToken(String token) {
        return Long.parseLong(
                Jwts.parser()
                        .verifyWith(key)
                        .build()
                        .parseSignedClaims(token)
                        .getPayload()
                        .getSubject());
    }

    public boolean validateToken(String token) {
        try {
            Jwts.parser().verifyWith(key).build().parseSignedClaims(token);
            return true;
        } catch (JwtException | IllegalArgumentException ex) {
            return false;
        }
    }
}
