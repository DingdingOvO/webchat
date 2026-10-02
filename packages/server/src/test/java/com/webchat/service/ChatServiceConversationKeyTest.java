package com.webchat.service;

import static org.assertj.core.api.Assertions.assertThat;

import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

/**
 * 会话键生成规则的测试。
 *
 * <p>{@code conversationKey} 决定了消息归属哪个会话。它有一个隐蔽但致命 的正确性要求：**对称性** —— A 发给 B 和 B 发给 A 必须落到同一个 key。
 *
 * <p>若哪天有人把 {@code Math.min/Math.max} 改成直接用 {@code id1 + ":" + id2}， 后果是：两个人各自看到一半聊天记录，互相收不到对方的消息，
 * 而数据库里数据看起来都「存在」——极难排查。用测试把它钉住。
 */
class ChatServiceConversationKeyTest {

    @Test
    @DisplayName("P2P 键必须对称：双方顺序不同也要得到同一个 key")
    void p2pKeyIsSymmetric() {
        String ab = ChatService.conversationKey("P2P", 3L, 5L);
        String ba = ChatService.conversationKey("P2P", 5L, 3L);

        assertThat(ab).as("A→B 与 B→A 必须归入同一会话，否则双方各自只能看到一半消息").isEqualTo(ba);
        assertThat(ab).isEqualTo("p2p:3:5");
    }

    @Test
    @DisplayName("P2P 键按小 id 在前归一化")
    void p2pKeyNormalisesOrder() {
        assertThat(ChatService.conversationKey("P2P", 100L, 2L)).isEqualTo("p2p:2:100");
        assertThat(ChatService.conversationKey("P2P", 1L, 999999L)).isEqualTo("p2p:1:999999");
    }

    @Test
    @DisplayName("群聊键只取群 id，与发送者无关")
    void groupKeyDependsOnlyOnGroupId() {
        String fromAlice = ChatService.conversationKey("GROUP", 3L, 77L);
        String fromBob = ChatService.conversationKey("GROUP", 9L, 77L);

        assertThat(fromAlice).isEqualTo("group:77");
        assertThat(fromBob).as("任何成员在同一个群里发言都必须落到同一个会话").isEqualTo(fromAlice);
    }

    @Test
    @DisplayName("不同类型不会串会话")
    void p2pAndGroupKeysDoNotCollide() {
        assertThat(ChatService.conversationKey("P2P", 7L, 7L))
                .isNotEqualTo(ChatService.conversationKey("GROUP", 7L, 7L));
    }
}
