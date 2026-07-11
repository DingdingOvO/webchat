# Fluid Design System

**Fluid** 是 WebChat 的设计语言。名称源自聊天的本质——消息像水一样流动，界面不打断这种流动。

> 汲取 WeChat 的设计直觉（绿色发送信号、非对称气泡、胶囊输入框），
> 但使用更中性的蓝绿体系，适配全球化通讯场景。
> **每个决策带理由，不为装饰而装饰。**

---

## 一、设计原则

### 1. 内容即界面
聊天 App 的核心是对话气泡。所有 UI 元素退到气泡之后，不抢视线。
侧栏、按钮、标签——都是气泡舞台的幕后工作人员。

### 2. 信号清晰，噪音归零
绿色 = 发送/在线；蓝色 = 可点击/跳转；红色 = 未读/错误。
用户不需要思考颜色含义，每个信号有文化通感基础。

### 3. 节奏一致
4px 基线网格保证所有间距对齐。按钮、输入框、列表项高度统一在 8px 网格上。
页面切换 0.2s，hover 反馈 0.12s——用户形成肌肉记忆。

### 4. 不打扰
没有弹窗没有祝贺动画。操作立即生效（乐观更新）。
加载状态用微妙骨架/文字提示，不用转圈圈。

### 5. 从 WeChat 来，但不是 WeChat
| 借鉴 | 理由 | 差异化 |
|------|------|--------|
| 绿色发送按钮 | 绿色=确认/安全是人类本能 | 我们使用更中性的 `#16a34a` 而非 WeChat 的 `#07c160` |
| 非对称气泡圆角 | 区分发送方/接收方，一眼可辨 | 我们的蓝色气泡亮度更高，阴影更轻 |
| 胶囊输入框 | 视觉上更像"容器"，提示用户在此输入 | 圆角 20px 而非完全椭圆 |
| 底部 tab | 移动端拇指热区 | 桌面端保留左侧栏，不隐藏导航 |

---

## 二、色板

### 2.1 品牌色

| Token | 值 | 用途 | 色块 |
|-------|-----|------|------|
| `--fluid-blue` | `#2563ea` | 主色 — 按钮、链接、选中态。**为什么用蓝？** 通讯工具蓝色用户信任度高（Slack、Teams、Telegram 均用蓝） | 🔵 |
| `--fluid-blue-hover` | `#1d4ed8` | 主色悬停 | |
| `--fluid-blue-active` | `#1e40af` | 按下态 | |
| `--fluid-blue-light` | `#eff6ff` | 浅蓝底 — 选中项、通知横幅 | |

### 2.2 动作色

| Token | 值 | 用途 | 色块 |
|-------|-----|------|------|
| `--fluid-green` | `#16a34a` | **发送 / 在线 / 已读**。WeChat 启发：绿色=可操作/已送达。人类对绿色本能关联"安全/确认" | 🟢 |
| `--fluid-green-hover` | `#15803d` | 发送按钮悬停 | |
| `--fluid-green-light` | `#dcfce7` | 在线状态背景 | |

### 2.3 语义色

| Token | 值 | 用途 |
|-------|-----|------|
| `--fluid-red` | `#dc2626` | 错误、未读徽标、退出/删除 |
| `--fluid-red-light` | `#fef2f2` | 错误提示背景 |
| `--fluid-amber` | `#d97706` | 警告、等待中 |
| `--fluid-amber-light` | `#fffbeb` | 警告背景 |

### 2.4 中性色

| Token | 值 | 用途 |
|-------|-----|------|
| `--surface-0` | `#ffffff` | 最表层（气泡自己、卡片） |
| `--surface-1` | `#f8f9fa` | 默认表面（页面背景） |
| `--surface-2` | `#f1f3f5` | 第二层（hover 状态、输入框背景） |
| `--surface-chat` | `#f5f6f8` | 聊天区背景，比 surface-1 略暖，视觉上区分功能区 |

### 2.5 文字色

| Token | 值 | 对比度 (vs white) | 用途 |
|-------|-----|-------------------|------|
| `--text-primary` | `#212529` | 15.4:1 (AAA) | 正文 |
| `--text-secondary` | `#868e96` | 5.6:1 (AA) | 辅助文字、描述 |
| `--text-tertiary` | `#adb5bd` | 3.8:1 | 时间戳、占位符 |
| `--text-link` | `#2563ea` | — | 链接 |
| `--text-inverse` | `#ffffff` | — | 深色背景上的文字（气泡内） |

### 2.6 阴影层级

| Token | 值 | 适用场景 |
|-------|-----|---------|
| `--elevation-1` | 0 1px 3px rgba(37,99,234,0.06) | 普通卡片、气泡 |
| `--elevation-2` | 0 4px 12px rgba(37,99,234,0.08) | 下拉菜单、弹窗 |
| `--elevation-3` | 0 8px 24px rgba(37,99,234,0.10) | 模态框 |
| `--elevation-4` | 0 12px 40px rgba(37,99,234,0.14) | 通知/Toast |

> **为什么用蓝色阴影？** 统一的光源色温避免杂色阴影，增强视觉整体感。

---

## 三、字体

### 3.1 字体栈

```css
font-family: -apple-system, BlinkMacSystemFont, "Segoe UI",
             "PingFang SC", "Hiragino Sans GB", "Microsoft YaHei",
             Helvetica, Arial, sans-serif;
```

中文优先 PingFang → Hiragino → YaHei，系统字体保证各平台最佳渲染。

### 3.2 字号层级

| Token | 值 | 行高 | 用途 |
|-------|-----|------|------|
| `--text-3xl` | 36px | 1.25 | 落地页标题 |
| `--text-2xl` | 28px | 1.25 | 页面大标题 |
| `--text-xl` | 24px | 1.25 | 文档页 H1 |
| `--text-lg` | 20px | 1.25 | 弹窗标题、H2 |
| `--text-md` | 17px | 1.5 | 联系人名称 |
| **`--text-base`** | **15px** | **1.5** | **正文基线** |
| `--text-sm` | 13px | 1.5 | 辅助文字、导航 |
| `--text-caption` | 12px | 1.5 | 按钮标签、徽标 |
| `--text-xs` | 11px | 1.5 | 时间戳、角标 |

---

## 四、间距与布局

### 4.1 4px 网格

```css
--space-1:   4px    --space-2:   8px    --space-3:  12px
--space-4:  16px    --space-5:  20px    --space-6:  24px
--space-8:  32px    --space-10: 40px    --space-12: 48px
--space-16: 64px    --space-20: 80px
```

所有 padding/margin/gap 必须是 4 的倍数。

### 4.2 圆角体系

| Token | 值 | 场景 |
|-------|-----|------|
| `--radius-sm` | 6px | 图标按钮、标签 |
| `--radius-md` | 8px | 普通按钮、输入框聚焦 glow |
| `--radius-lg` | 12px | 气泡、卡片、弹窗 |
| `--radius-xl` | 16px | 大卡片 |
| `--radius-2xl` | 20px | 胶囊输入框（WeChat 启发） |
| `--radius-full` | 9999px | 圆形头像、完全胶囊 |

### 4.3 布局尺寸

| 区域 | 宽度 |
|------|------|
| 聊天布局最大宽度 | 1100px |
| 侧栏（联系人/会话） | 340px |
| 聊天消息区 | 自适应 |
| 文档阅读区 | 720px max |
| 弹窗 | 360px |
| 内容安全边距 | 16px（移动端可缩至 12px） |

---

## 五、动效规范

| 场景 | 时长 | 曲线 | 说明 |
|------|------|------|------|
| hover/focus | 0.12s | ease-in-out | 快速反馈，不拖沓 |
| 弹窗出现 | 0.2s | ease-out | 从 0.95 缩放到 1.0，同时淡入 |
| 页面切换 | 0.2s | ease-in-out | 内容区交叉淡入淡出 |
| 消息出现 | 0.15s | ease-out | 新气泡轻量放大 (0.98→1.0) |
| 骨架加载 | 0.8s | ease-in-out | 脉冲动画 |

---

## 六、组件规范

### 6.1 按钮

| 类型 | 高度 | 圆角 | 背景 | 文字 |
|------|------|------|------|------|
| 主要 | 40px | 8px | `--fluid-blue` | 15px 中粗 白色 |
| 主色悬停 | — | — | `--fluid-blue-hover` | — |
| 次要（描边） | 40px | 8px | 透明 + 1.5px `--border-default` | `--text-primary` |
| 文本按钮 | auto | — | 透明 | `--fluid-blue` |
| 图标按钮 | 32px | 6px | 透明 → hover `--surface-2` | icon 16px |

### 6.2 输入框

| 状态 | 边框 | 背景 | 圆角 |
|------|------|------|------|
| 默认 | 1.5px `--border-default` | `--surface-2` | 8px |
| 聚焦 | 1.5px `--border-focus` + 3px glow | `--surface-0` | 8px |
| 禁用 | 1.5px `--border-default` | `--surface-2` opacity 0.5 | 8px |
| 胶囊（聊天输入） | 1.5px `--border-default` | `--surface-2` | **20px** |

### 6.3 消息气泡

| 属性 | 自己发送 | 对方发送 |
|------|----------|----------|
| 背景 | `--fluid-blue` | `--surface-0` |
| 文字 | `#ffffff` | `--text-primary` |
| 圆角 | 12px 12px **4px** 12px | 12px 12px 12px **4px** |
| 阴影 | `--elevation-1` | `--elevation-1` |
| 最大宽度 | 70% | 70% |

> 非对称圆角参考 WeChat：说话方右下/左下圆角更小，形成"指向"对话对象的视觉暗示。

### 6.4 头像

| Token | 尺寸 | 场景 |
|-------|------|------|
| `--avatar-xs` | 24px | 搜索列表、评论 |
| `--avatar-sm` | 32px | 侧栏联系人、聊天 header |
| `--avatar-md` | 40px | 默认会话列表 |
| `--avatar-lg` | 48px | 个人资料页 |

所有头像圆形裁剪。在线指示器为 10px 绿色圆点，位于头像右下角（2px 白色描边分隔）。

### 6.5 会话列表

- 列表项高度：52px（含 8px 上下内边距）
- 选中态：`--fluid-blue-light` 背景
- 未读徽标：红色 `--radius-full` 标签，最小宽度 18px

### 6.6 弹窗 (Modal)

| 属性 | 值 |
|------|-----|
| 背景遮罩 | rgba(0,0,0,0.4) |
| 面板宽度 | 360px |
| 面板圆角 | 12px |
| 入场动画 | opacity 0→1 + scale(0.95→1) 0.2s ease-out |

---

## 七、暗色模式（预备）

暗色模式已定义好变量结构（见 `global.css` 注释段），待后续实现 toggle 时启用 `.dark` class 即可翻转全部 token。

暗色参考微信夜间模式：
- 背景：`#1e1e1e`
- 卡片/气泡：`#2d2d2d`
- 文字：`#e0e0e0`
- 阴影：黑色 rgba，opacity 提高至 0.3~0.6

---

## 八、CSS 变量速查

```css
/* 品牌色 */
--fluid-blue / --fluid-blue-hover / --fluid-blue-active / --fluid-blue-light / --fluid-blue-dark
--fluid-green / --fluid-green-hover / --fluid-green-light
--fluid-red   / --fluid-red-light
--fluid-amber / --fluid-amber-light

/* 表面层 */
--surface-0 / --surface-1 / --surface-2 / --surface-chat

/* 文字 */
--text-primary / --text-secondary / --text-tertiary / --text-link / --text-inverse

/* 边框 */
--border-default / --border-light / --border-focus

/* 阴影 */
--elevation-0 / --elevation-1 / --elevation-2 / --elevation-3 / --elevation-4

/* 字体 */
--font / --font-mono
--text-xs / --text-caption / --text-sm / --text-base / --text-md / --text-lg / --text-xl

/* 间距 */
--space-1 ~ --space-20

/* 圆角 */
--radius-sm / --radius-md / --radius-lg / --radius-xl / --radius-2xl / --radius-full

/* 动效 */
--duration-fast(0.12s) / --duration-normal(0.2s) / --duration-slow(0.35s)
--ease-out / --ease-in / --ease-in-out / --ease-spring

/* 聊天专用 */
--bubble-mine-bg / --bubble-mine-color / --bubble-mine-radius
--bubble-other-bg / --bubble-other-color / --bubble-other-radius
--bubble-shadow
--input-height / --input-radius / --input-bg / --input-border
--avatar-xs / --avatar-sm / --avatar-md / --avatar-lg
--sidebar-width

/* 兼容别名（旧组件使用） */
--primary / --primary-hover / --primary-press / --primary-light / --primary-bg
--bg-surface / --bg-page / --bg-chat / --bg-input / --bg-hover
--text / --text-muted / --text-faint
--border / --border-light
--shadow-xs ~ --shadow-xl
--fs-* / --p* / --r* 系列
```
