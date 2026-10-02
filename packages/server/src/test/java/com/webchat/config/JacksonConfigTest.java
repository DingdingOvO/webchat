package com.webchat.config;

import static org.assertj.core.api.Assertions.assertThat;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.webchat.dto.MessageDTO;
import java.time.Instant;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.http.converter.json.Jackson2ObjectMapperBuilder;

/**
 * 时间序列化契约的回归测试。
 *
 * <p>背景：这里曾出过一个影响三个功能的 bug。Jackson 的 {@code WRITE_DATES_AS_TIMESTAMPS} 默认为 {@code true}，导致 {@code
 * Instant} 被写成浮点秒数 {@code 1790926583.909997129}。 前端该字段声明为 string，于是：
 *
 * <ul>
 *   <li>{@code new Date("1790926583.909")} → Invalid Date，界面显示空白
 *   <li>对话列表按时间排序时算出 {@code NaN}，比较恒为 false，排序静默失效
 * </ul>
 *
 * <p>这些测试锁死「必须输出 ISO-8601 字符串」这一约定， 防止有人日后不小心移除 {@code featuresToDisable(...)} 而重新引入同样的 bug。
 */
class JacksonConfigTest {

    private final ObjectMapper mapper =
            new JacksonConfig().objectMapper(new Jackson2ObjectMapperBuilder());

    @Test
    @DisplayName("Instant 必须序列化为 ISO-8601 字符串，而不是浮点秒数")
    void instantSerializesAsIsoString() throws Exception {
        MessageDTO dto =
                new MessageDTO(
                        "m1",
                        1L,
                        "演示用户",
                        2L,
                        "P2P",
                        "hello",
                        Instant.parse("2026-10-02T07:36:23.909997129Z"));

        String json = mapper.writeValueAsString(dto);

        assertThat(json)
                .as("时间必须是 ISO-8601 字符串")
                .contains("\"createdAt\":\"2026-10-02T07:36:23.909997129Z\"")
                .doesNotContain("1790926583");
    }

    @Test
    @DisplayName("回归护栏：createdAt 在 JSON 里必须是带引号的字符串，而不是裸数字")
    void createdAtIsQuotedInJson() throws Exception {
        MessageDTO dto = new MessageDTO("m2", 1L, "a", 2L, "P2P", "x", Instant.now());

        String json = mapper.writeValueAsString(dto);

        // 定位 createdAt 之后紧跟的第一个字符：若是引号则为字符串，是数字则为时间戳
        int idx = json.indexOf("\"createdAt\":");
        assertThat(idx).isGreaterThanOrEqualTo(0);
        char next = json.charAt(idx + "\"createdAt\":".length());
        assertThat(next)
                .as("createdAt 后必须是引号（字符串）。若是数字，说明 WRITE_DATES_AS_TIMESTAMPS 又被打开了")
                .isEqualTo('"');
    }

    @Test
    @DisplayName("前端用 Date.parse 能解析该输出（模拟前端读取路径）")
    void outputIsParseableByStandardDateParser() throws Exception {
        Instant original = Instant.parse("2026-10-02T07:36:23.909997129Z");
        MessageDTO dto = new MessageDTO("m3", 1L, "a", 2L, "P2P", "x", original);

        String json = mapper.writeValueAsString(dto);
        String iso = json.split("\"createdAt\":\"")[1].split("\"")[0];

        // 这正是前端 new Date(...) 会走的路径
        Instant parsed = Instant.parse(iso);
        assertThat(parsed).isEqualTo(original);
    }
}
