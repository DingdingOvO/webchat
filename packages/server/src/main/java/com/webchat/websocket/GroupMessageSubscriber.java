package com.webchat.websocket;

import com.webchat.model.ChatGroupMember;
import com.webchat.repository.ChatGroupMemberRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.data.redis.connection.Message;
import org.springframework.data.redis.connection.MessageListener;
import org.springframework.stereotype.Component;

import java.util.List;

/**
 * Redis Pub/Sub 订户：监听 group:* 频道，收到群消息后
 * 通过 WebSocket 转发给群内所有在线成员。
 */
@Component
public class GroupMessageSubscriber implements MessageListener {

    private static final Logger log = LoggerFactory.getLogger(GroupMessageSubscriber.class);

    private final ChatGroupMemberRepository memberRepo;
    private final WebSocketSessionManager sessionManager;

    public GroupMessageSubscriber(ChatGroupMemberRepository memberRepo,
                                  WebSocketSessionManager sessionManager) {
        this.memberRepo = memberRepo;
        this.sessionManager = sessionManager;
    }

    @Override
    public void onMessage(Message message, byte[] pattern) {
        String channel = new String(message.getChannel());
        String body = new String(message.getBody());
        if (!channel.startsWith("group:")) return;

        try {
            Long groupId = Long.parseLong(channel.substring(6));
            List<ChatGroupMember> members = memberRepo.findByGroupId(groupId);
            for (ChatGroupMember member : members) {
                sessionManager.sendToUser(member.getUserId(), body);
            }
        } catch (Exception e) {
            log.error("转发群消息失败 channel={}", channel, e);
        }
    }
}
