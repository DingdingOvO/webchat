# 设计语言

**Aero Design System** 是 WebChat 的设计语言，核心理念是**简洁、可靠、有节奏**。
本规范定义了颜色、字体、间距、组件等设计基础，供开发者遵循一致的界面标准。

---

## 一、设计原则

### 1. 内容优先
每个页面有明确的重点，避免无关元素干扰用户目标。消息列表专注聊天，侧栏专注联系人。

### 2. 清晰导航
用户始终知道身在何处、可往何处。侧栏联系人分区、聊天头部标识当前会话。

### 3. 反馈及时
消息发送即时展示（乐观更新），操作按钮有 hover/active 状态，加载有过渡动画。

### 4. 一致统一
所有页面使用相同的颜色、字体、间距、圆角体系，每个组件在不同页面表现一致。

---

## 二、色板

| 色值 | CSS 变量 | 用途 |
|------|----------|------|
| <span style="display:inline-block;width:12px;height:12px;background:#2563eb;border-radius:2px;vertical-align:middle"></span> #2563eb | `--primary` | 主色 — 按钮、链接、选中态 |
| <span style="display:inline-block;width:12px;height:12px;background:#1d4ed8;border-radius:2px;vertical-align:middle"></span> #1d4ed8 | `--primary-hover` | 主色悬停 |
| <span style="display:inline-block;width:12px;height:12px;background:#eff6ff;border-radius:2px;vertical-align:middle"></span> #eff6ff | `--primary-light` | 主色浅色背景 — 选中项、通知条 |
| <span style="display:inline-block;width:12px;height:12px;background:#212529;border-radius:2px;vertical-align:middle"></span> #212529 | `--text` | 正文颜色 |
| <span style="display:inline-block;width:12px;height:12px;background:#868e96;border-radius:2px;vertical-align:middle"></span> #868e96 | `--text-secondary` | 辅助文字 — 描述、时间戳 |
| <span style="display:inline-block;width:12px;height:12px;background:#adb5bd;border-radius:2px;vertical-align:middle"></span> #adb5bd | `--text-tertiary` | 禁用文字、占位符 |
| <span style="display:inline-block;width:12px;height:12px;background:#e9ecef;border-radius:2px;vertical-align:middle"></span> #e9ecef | `--border` | 边框 — 输入框、分割线 |
| <span style="display:inline-block;width:12px;height:12px;background:#f1f3f5;border-radius:2px;vertical-align:middle"></span> #f1f3f5 | `--border-light` | 浅色边框 — 卡片、列表间隔 |
| <span style="display:inline-block;width:12px;height:12px;background:#10b981;border-radius:2px;vertical-align:middle"></span> #10b981 | `--green` | 在线状态、成功提示 |
| <span style="display:inline-block;width:12px;height:12px;background:#ef4444;border-radius:2px;vertical-align:middle"></span> #ef4444 | `--red` | 错误提示、未读徽标 |

---

## 三、字体

字体使用系统字体栈，保证各平台最优渲染：

```css
font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Noto Sans SC", sans-serif;
```

| 字号 | CSS | 行高 | 使用场景 |
|------|-----|------|---------|
| 28 | `--text-2xl` | 1.25 | 页面标题 |
| 20 | `--text-lg` | 1.25 | 弹窗标题、分组标题 |
| 17 | `--text-md` | 1.5 | 联系人名称 |
| 15 | `--text-base` | 1.5 | 正文、消息文本、按钮 |
| 13 | `--text-sm` | 1.5 | 辅助文字、导航、元信息 |
| 11 | `--text-xs` | 1.5 | 时间戳、徽标、角标 |

---

## 四、间距与布局

采用 **4px 基线网格**，所有边距、间隔、内边距均为 4 的倍数。页面内容区与屏幕边缘保持至少 **16px 安全边距**，阅读类页面内容宽度不超过 **720px**。

| Token | 值 | 使用场景 |
|-------|-----|---------|
| `--space-4` | 16px | 内容安全边距、卡片内边距 |
| `--space-5` | 20px | 列表项内边距、表单字段间距 |
| `--space-6` | 24px | 区块间隔、消息气泡间距 |
| `--space-8` | 32px | 页面分区间隔 |
| `--space-10` | 40px | 大段内容间隔 |

---

## 五、组件规范

### 5.1 按钮

| 类型 | 高度 | 圆角 | 背景 | 文字 |
|------|------|------|------|------|
| 主要按钮 | 40px | 8px | 主色 `#2563eb` | 白色 15px 中粗 |
| 次要按钮 | 40px | 8px | 透明，有边框 | 正文色 15px |
| 图标按钮 | 32px | 6px | 透明 hover 变灰 | 16px icon |

### 5.2 输入框

| 状态 | 边框 | 背景 | 圆角 |
|------|------|------|------|
| 默认 | 1.5px `--border` | `--gray-50` | 8px |
| 聚焦 | 1.5px `--primary` | 白色 | 8px + 3px glow |
| 禁用 | 1.5px `--border` | `--gray-100` | 8px |

### 5.3 消息气泡

| 类型 | 背景 | 文字 | 圆角 | 阴影 |
|------|------|------|------|------|
| 自己发送 | 蓝色渐变 | 白色 | 12px 右下 6px | 0 2px 8px rgba(37,99,235,.25) |
| 对方发送 | 白色 | 正文色 | 12px 左下 6px | 0 1px 3px rgba(0,0,0,.06) |

### 5.4 联系人列表

- 头像尺寸：40px × 40px，圆形裁剪
- 列表项高度：52px（含 8px 上下内边距）
- 选中态：浅蓝背景 `--primary-light (#eff6ff)`
- 在线指示器：10px 绿色圆点，位于头像右下角
- 未读徽标：红色圆角标签，右上角定位

### 5.5 图标

所有图标为自绘 SVG 路径，统一 20×20 viewBox，颜色继承当前文字色。不使用 emoji 或图片。

### 5.6 弹窗

| 属性 | 值 |
|------|-----|
| 背景遮罩 | rgba(0,0,0,0.4) |
| 弹窗宽度 | 360px |
| 弹窗圆角 | 12px |
| 动画 | fadeIn 0.15s + scale(0.95→1) |

---

## 六、设计稿尺寸

| 布局 | 宽度 |
|------|------|
| 聊天布局最大宽度 | 1200px |
| 侧栏（联系人/群组） | 320px |
| 聊天消息区 | 自适应剩余空间 |
| 文档阅读区 | 720px max |
| 浮动弹窗 | 360px |
