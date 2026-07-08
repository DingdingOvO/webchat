package com.webchat.model;

import jakarta.persistence.*;
import java.time.LocalDateTime;

/**
 * 用户反馈 — BUG 报告、功能建议、使用体验
 * 对应 Microsoft Forms 问卷的完整字段
 */
@Entity
@Table(name = "feedbacks")
public class Feedback {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    /** 反馈类型 */
    @Column(nullable = false, length = 20)
    @Enumerated(EnumType.STRING)
    private Type type = Type.SUGGESTION;

    /** 提交者 GitHub 用户名（允许匿名） */
    @Column(length = 100)
    private String githubUsername;

    /** 如果已登录，关联的用户 ID */
    private Long userId;

    /** 使用的部署形式 */
    @Column(nullable = false, length = 30)
    @Enumerated(EnumType.STRING)
    private Deployment deployment = Deployment.SELF_HOSTED;

    /** 反馈标题 */
    @Column(length = 200)
    private String title;

    /** 详细描述 */
    @Column(nullable = false, columnDefinition = "TEXT")
    private String description;

    /** 复现步骤（仅 BUG） */
    @Column(columnDefinition = "TEXT")
    private String stepsToReproduce;

    /** 期望行为 */
    @Column(columnDefinition = "TEXT")
    private String expectedBehavior;

    /** 实际行为 */
    @Column(columnDefinition = "TEXT")
    private String actualBehavior;

    /** 截图/日志等附件 URL（JSON 数组字符串） */
    @Column(columnDefinition = "TEXT")
    private String attachments;

    /** 浏览器 / 设备信息 */
    @Column(length = 500)
    private String userAgent;

    /** 页面路径 */
    @Column(length = 200)
    private String pageUrl;

    /** 提交者联系方式（邮箱等） */
    @Column(length = 200)
    private String contact;

    /** 是否已读（管理员用） */
    private boolean read = false;

    @Column(nullable = false, updatable = false)
    private LocalDateTime createdAt = LocalDateTime.now();

    // === 枚举 ===

    public enum Type {
        BUG("🐛 报告 Bug"),
        SUGGESTION("💡 功能建议"),
        EXPERIENCE("📋 使用体验"),
        OTHER("🔧 其他");

        public final String label;
        Type(String label) { this.label = label; }
    }

    public enum Deployment {
        OFFICIAL("官方/标准实例"),
        SELF_HOSTED("自行部署"),
        MODIFIED("其他用户修改版");

        public final String label;
        Deployment(String label) { this.label = label; }
    }

    // === Constructors ===

    public Feedback() {}

    // === Getters / Setters ===

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public Type getType() { return type; }
    public void setType(Type type) { this.type = type; }

    public String getGithubUsername() { return githubUsername; }
    public void setGithubUsername(String githubUsername) { this.githubUsername = githubUsername; }

    public Long getUserId() { return userId; }
    public void setUserId(Long userId) { this.userId = userId; }

    public Deployment getDeployment() { return deployment; }
    public void setDeployment(Deployment deployment) { this.deployment = deployment; }

    public String getTitle() { return title; }
    public void setTitle(String title) { this.title = title; }

    public String getDescription() { return description; }
    public void setDescription(String description) { this.description = description; }

    public String getStepsToReproduce() { return stepsToReproduce; }
    public void setStepsToReproduce(String stepsToReproduce) { this.stepsToReproduce = stepsToReproduce; }

    public String getExpectedBehavior() { return expectedBehavior; }
    public void setExpectedBehavior(String expectedBehavior) { this.expectedBehavior = expectedBehavior; }

    public String getActualBehavior() { return actualBehavior; }
    public void setActualBehavior(String actualBehavior) { this.actualBehavior = actualBehavior; }

    public String getAttachments() { return attachments; }
    public void setAttachments(String attachments) { this.attachments = attachments; }

    public String getUserAgent() { return userAgent; }
    public void setUserAgent(String userAgent) { this.userAgent = userAgent; }

    public String getPageUrl() { return pageUrl; }
    public void setPageUrl(String pageUrl) { this.pageUrl = pageUrl; }

    public String getContact() { return contact; }
    public void setContact(String contact) { this.contact = contact; }

    public boolean isRead() { return read; }
    public void setRead(boolean read) { this.read = read; }

    public LocalDateTime getCreatedAt() { return createdAt; }
    public void setCreatedAt(LocalDateTime createdAt) { this.createdAt = createdAt; }
}
