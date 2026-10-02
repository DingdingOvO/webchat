package com.webchat.websocket;

import com.webchat.model.ChatGroupMember;
import com.webchat.repository.ChatGroupMemberRepository;
import com.webchat.util.LogSanitizer;
import edu.umd.cs.findbugs.annotations.SuppressFBWarnings;
import java.nio.charset.StandardCharsets;
import java.util.List;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.data.redis.connection.Message;
import org.springframework.data.redis.connection.MessageListener;
import org.springframework.stereotype.Component;

/** Redis Pub/Sub 订户：监听 group:* 频道，收到群消息后 通过 WebSocket 转发给群内所有在线成员。 */
@Component
public class GroupMessageSubscriber implements MessageListener {

    private static final Logger LOG = LoggerFactory.getLogger(GroupMessageSubscriber.class);

    private static final String CHANNEL_PREFIX = "group:";

    private final ChatGroupMemberRepository memberRepo;
    private final WebSocketSessionManager sessionManager;

    public GroupMessageSubscriber(
            ChatGroupMemberRepository memberRepo, WebSocketSessionManager sessionManager) {
        this.memberRepo = memberRepo;
        this.sessionManager = sessionManager;
    }

    /**
     * Redis Pub/Sub 回调。
     *
     * <p>PMD 的 AvoidCatchingGenericException 在此为有意为之：此方法运行在 Redis 订阅线程上，
     * 任何异常逃逸都会导致订阅链路断开（表现为「所有群消息停止转发」）， 因此必须就地兜住并留痕，而不能向上抛。
     */
    @SuppressWarnings("PMD.AvoidCatchingGenericException")
    @SuppressFBWarnings(
            value = "CRLF_INJECTION_LOGS",
            justification = "channel 已经 LogSanitizer.safe() 转义后再写入日志")
    @Override
    public void onMessage(Message message, byte[] pattern) {
        // 必须显式指定 UTF-8。Redis 里存的 JSON 是 UTF-8 编码，
        // 若依赖平台默认字符集，在 locale 非 UTF-8 的容器（如 C/POSIX）
        // 中会把中文解成乱码——本机开发环境往往恰好是 UTF-8，测不出来。
        String channel = new String(message.getChannel(), StandardCharsets.UTF_8);
        String body = new String(message.getBody(), StandardCharsets.UTF_8);
        if (!channel.startsWith(CHANNEL_PREFIX)) {
            return;
        }

        try {
            Long groupId = Long.parseLong(channel.substring(CHANNEL_PREFIX.length()));
            List<ChatGroupMember> members = memberRepo.findByGroupId(groupId);
            for (ChatGroupMember member : members) {
                sessionManager.sendToUser(member.getUserId(), body);
            }
        } catch (NumberFormatException ex) {
            // 频道名不是 group:<数字>，说明收到了非预期频道，记录后忽略。
            if (LOG.isWarnEnabled()) {
                LOG.warn("群消息频道名异常: {}", LogSanitizer.safe(channel));
            }
        } catch (RuntimeException ex) {
            // Redis 回调线程里绝不能抛出：异常逃逸会导致订阅链路断开，
            // 表现为「所有群消息停止转发」。因此按「转发失败」统一兜住并留痕。
            if (LOG.isErrorEnabled()) {
                LOG.error("转发群消息失败 channel={}", LogSanitizer.safe(channel), ex);
            }
        }
    }
}
