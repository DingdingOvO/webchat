package com.webchat.document;

import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.index.CompoundIndex;
import org.springframework.data.mongodb.core.index.Indexed;
import org.springframework.data.mongodb.core.mapping.Document;

import java.time.Instant;

@Document(collection = "messages")
@CompoundIndex(name = "conv_time_idx", def = "{'conversationKey': 1, 'createdAt': -1}")
public class MessageDoc {

    @Id
    private String id;

    @Indexed
    private Long senderId;

    private String senderName;

    /**
     * 会话键：P2P 格式 "p2p:{uid1}:{uid2}"（uid1 < uid2），GROUP 格式 "group:{groupId}"
     */
    @Indexed
    private String conversationKey;

    /** P2P / GROUP */
    private String type;

    private String content;

    @Indexed
    private Instant createdAt;

    public MessageDoc() {}

    public MessageDoc(Long senderId, String senderName, String conversationKey, String type, String content) {
        this.senderId = senderId;
        this.senderName = senderName;
        this.conversationKey = conversationKey;
        this.type = type;
        this.content = content;
        this.createdAt = Instant.now();
    }

    public String getId() { return id; }
    public void setId(String id) { this.id = id; }
    public Long getSenderId() { return senderId; }
    public void setSenderId(Long senderId) { this.senderId = senderId; }
    public String getSenderName() { return senderName; }
    public void setSenderName(String senderName) { this.senderName = senderName; }
    public String getConversationKey() { return conversationKey; }
    public void setConversationKey(String conversationKey) { this.conversationKey = conversationKey; }
    public String getType() { return type; }
    public void setType(String type) { this.type = type; }
    public String getContent() { return content; }
    public void setContent(String content) { this.content = content; }
    public Instant getCreatedAt() { return createdAt; }
    public void setCreatedAt(Instant createdAt) { this.createdAt = createdAt; }
}
