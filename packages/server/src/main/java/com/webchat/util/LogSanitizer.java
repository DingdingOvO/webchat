package com.webchat.util;

/**
 * 日志安全工具。
 *
 * <p>用户输入（异常消息、群名、会话 id 等）直接写入日志时存在 <b>日志注入（CRLF injection）</b>风险：攻击者构造含 {@code \n} / {@code \r}
 * 的内容，可在日志文件中伪造出额外的日志行，污染审计记录， 甚至伪装成其他用户的动作。
 *
 * <p>修法不是不记日志（那样会丢掉排查线索），而是把控制字符转义成 可见形式后再输出。
 */
public final class LogSanitizer {

    private LogSanitizer() {}

    /**
     * 将换行、回车等控制字符替换为可读的转义序列。
     *
     * @param raw 可能包含用户输入的原始文本，可为 null
     * @return 可安全写入日志的文本
     */
    public static String safe(String raw) {
        if (raw == null) {
            return "null";
        }
        StringBuilder sb = new StringBuilder(raw.length());
        for (int i = 0; i < raw.length(); i++) {
            char ch = raw.charAt(i);
            switch (ch) {
                case '\n' -> sb.append("\\n");
                case '\r' -> sb.append("\\r");
                case '\t' -> sb.append("\\t");
                default -> {
                    // 其余控制字符一律转义，避免终端转义序列注入
                    if (ch < 0x20 || ch == 0x7f) {
                        sb.append(String.format("\\x%02x", (int) ch));
                    } else {
                        sb.append(ch);
                    }
                }
            }
        }
        return sb.toString();
    }
}
