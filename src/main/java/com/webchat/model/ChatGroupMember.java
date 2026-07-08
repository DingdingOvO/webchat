package com.webchat.model;

import jakarta.persistence.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "group_members")
public class ChatGroupMember {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne
    @JoinColumn(name = "group_id", nullable = false)
    private ChatGroup group;

    @Column(nullable = false)
    private Long userId;

    @Column(nullable = false)
    private LocalDateTime joinedAt = LocalDateTime.now();

    public ChatGroupMember() {}

    public ChatGroupMember(ChatGroup group, Long userId) {
        this.group = group;
        this.userId = userId;
        this.joinedAt = LocalDateTime.now();
    }

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }
    public ChatGroup getGroup() { return group; }
    public void setGroup(ChatGroup group) { this.group = group; }
    public Long getUserId() { return userId; }
    public void setUserId(Long userId) { this.userId = userId; }
    public LocalDateTime getJoinedAt() { return joinedAt; }
}
