package com.webchat.config;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.SerializationFeature;
import com.fasterxml.jackson.datatype.jsr310.JavaTimeModule;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.context.annotation.Primary;
import org.springframework.http.converter.json.Jackson2ObjectMapperBuilder;

/**
 * 共享 Jackson ObjectMapper（避免各 service 各自 new）。
 *
 * <p>关键约定：时间统一序列化为 ISO-8601 字符串，例如 {@code "2026-10-02T18:56:23.909Z"}，而不是浮点秒数。
 *
 * <p>背景：{@code JavaTimeModule} 注册后，Jackson 的 {@link SerializationFeature#WRITE_DATES_AS_TIMESTAMPS}
 * 默认值仍为 {@code true}， 会把 {@code Instant} 写成 {@code 1790926583.909997129} 这样的浮点秒。 前端若按声明为 string
 * 的字段去 {@code new Date(...)} 解析，会得到 Invalid Date（字符串形式）或 1970 年（数字形式），导致时间显示错误、 排序因 {@code NaN}
 * 而静默失效。因此必须显式关闭该特性。
 *
 * <p>另一个易踩的坑：本 bean 会被 service 层（Redis 缓存读写、WebSocket 消息推送）使用，而 Spring MVC 的 HTTP 响应体走的是 Boot 自动配置的
 * ObjectMapper。若两者行为不一致，同一个 DTO 经 REST 与经 WebSocket 会得到两种时间格式——这正是此前问题的成因。所以这里通过 {@link
 * Jackson2ObjectMapperBuilder} 构建并标注 {@code @Primary}， 让自动配置与手工注入共享同一套序列化规则。
 */
@Configuration
public class JacksonConfig {

    @Bean
    @Primary
    public ObjectMapper objectMapper(Jackson2ObjectMapperBuilder builder) {
        return builder.modules(new JavaTimeModule())
                // 关闭“日期写成时间戳”，改为 ISO-8601 字符串
                .featuresToDisable(SerializationFeature.WRITE_DATES_AS_TIMESTAMPS)
                .build();
    }
}
