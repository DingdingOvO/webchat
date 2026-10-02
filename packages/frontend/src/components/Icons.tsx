/**
 * 图标集 —— 面性（实心）风格
 *
 * 设计约束（见 docs/design/DESIGN-LANGUAGE.md）：
 * 1. 一律实心色块，靠「负空间」刻画内部结构，禁止细线描边。
 *    （旧版为 Fluent 线框风格，在 20px 下缩成一片灰线，视觉重量不足。）
 * 2. 统一 20×20 viewBox、1.5px 安全边距，保证光学大小一致。
 * 3. 只依赖 currentColor，不写死颜色，便于跟随主题。
 * 4. 圆角统一 1~1.5px 量级，与全局 --r-sm 的圆润感呼应。
 */

interface IconProps {
  size?: number;
  className?: string;
  onClick?: () => void;
}

function Icon({ children, size = 20, className, onClick }: IconProps & { children: React.ReactNode }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 20 20"
      fill="currentColor"
      className={className}
      onClick={onClick}
      aria-hidden="true"
      focusable="false"
      style={{ display: 'inline-block', verticalAlign: 'middle', flexShrink: 0 }}
    >
      {children}
    </svg>
  );
}

/** 搜索：实心放大镜，镜片内挖空形成「孔」，保留可读细节 */
export function SearchIcon(props: IconProps) {
  return (
    <Icon {...props}>
      <path d="M8.75 2a6.75 6.75 0 1 0 3.98 12.2l3.54 3.53a.9.9 0 0 0 1.27-1.27l-3.53-3.54A6.75 6.75 0 0 0 8.75 2Zm0 1.8a4.95 4.95 0 1 1 0 9.9 4.95 4.95 0 0 1 0-9.9Z" />
      <circle cx="8.75" cy="8.75" r="3.05" />
    </Icon>
  );
}

/** 新增：实心加号，等比双臂 */
export function AddIcon(props: IconProps) {
  return (
    <Icon {...props}>
      <path d="M10 3.1a1 1 0 0 1 1 1v4.9h4.9a1 1 0 1 1 0 2H11v4.9a1 1 0 1 1-2 0V11H4.1a1 1 0 1 1 0-2H9V4.1a1 1 0 0 1 1-1Z" />
    </Icon>
  );
}

/** 单人：实心头 + 实心肩 */
export function PersonIcon(props: IconProps) {
  return (
    <Icon {...props}>
      <circle cx="10" cy="6.1" r="3.5" />
      <path d="M10 11.1c-3.31 0-6 1.9-6 4.25 0 .9.73 1.65 1.63 1.65h8.74c.9 0 1.63-.75 1.63-1.65 0-2.35-2.69-4.25-6-4.25Z" />
    </Icon>
  );
}

/** 群组：三人剪影，前实后虚拉开层次 */
export function PeopleIcon(props: IconProps) {
  return (
    <Icon {...props}>
      {/* 后方两人 */}
      <circle cx="4.6" cy="6.6" r="2.5" opacity=".55" />
      <circle cx="15.4" cy="6.6" r="2.5" opacity=".55" />
      {/* 前方主角 */}
      <circle cx="10" cy="5.6" r="3.2" />
      <path d="M10 10.3c-2.9 0-5.25 1.72-5.25 3.84 0 .8.64 1.46 1.44 1.46h7.62c.8 0 1.44-.66 1.44-1.46 0-2.12-2.35-3.84-5.25-3.84Z" />
    </Icon>
  );
}

/** 发送：实心纸飞机，机身用负空间折出棱线 */
export function SendIcon(props: IconProps) {
  return (
    <Icon {...props}>
      <path d="M2.62 3.05a1 1 0 0 0-1.35 1.2l1.86 5.2a1 1 0 0 0 .94.66h5.18a.75.75 0 0 1 0 1.5H4.07a1 1 0 0 0-.94.66l-1.86 5.2a1 1 0 0 0 1.35 1.2l15.1-7.06a1 1 0 0 0 0-1.82L2.62 3.05Z" />
    </Icon>
  );
}

/** 勾选：实心对勾，笔画均衡 */
export function CheckmarkIcon(props: IconProps) {
  return (
    <Icon {...props}>
      <path d="M16.7 5.3a1 1 0 0 1 .12 1.4l-7.6 9.1a1 1 0 0 1-1.46.06L3.28 11.5a1 1 0 0 1 1.44-1.4l3.62 3.72 6.96-8.32a1 1 0 0 1 1.4-.2Z" />
    </Icon>
  );
}

/** 关闭：实心圆底挖 X，小尺寸下比裸线更清晰 */
export function DismissIcon(props: IconProps) {
  return (
    <Icon {...props}>
      <path d="M10 2.5a7.5 7.5 0 1 0 0 15 7.5 7.5 0 0 0 0-15Zm2.6 9.16a.95.95 0 0 1-1.34 1.34L10 11.76 8.74 13.0a.95.95 0 0 1-1.34-1.34L8.66 10.4 7.4 9.14A.95.95 0 0 1 8.74 7.8L10 9.06l1.26-1.26a.95.95 0 1 1 1.34 1.34L11.34 10.4l1.26 1.26Z" />
    </Icon>
  );
}

/** 会话气泡：实心双气泡 */
export function ChatIcon(props: IconProps) {
  return (
    <Icon {...props}>
      <path d="M4.5 3A2.5 2.5 0 0 0 2 5.5v6A2.5 2.5 0 0 0 4.5 14h.4v2.15a.85.85 0 0 0 1.33.7L9.6 14h5.9a2.5 2.5 0 0 0 2.5-2.5v-6A2.5 2.5 0 0 0 15.5 3h-11Zm1.4 4.5h8.2a.9.9 0 1 1 0 1.8H5.9a.9.9 0 1 1 0-1.8Zm0 3h5.1a.9.9 0 1 1 0 1.8H5.9a.9.9 0 1 1 0-1.8Z" />
    </Icon>
  );
}

/** 退出登录：门框 + 实心箭头 */
export function SignOutIcon(props: IconProps) {
  return (
    <Icon {...props}>
      <path d="M4.9 2A2.9 2.9 0 0 0 2 4.9v10.2A2.9 2.9 0 0 0 4.9 18h4.35a1 1 0 1 0 0-2H4.9a.9.9 0 0 1-.9-.9V4.9a.9.9 0 0 1 .9-.9h4.35a1 1 0 1 0 0-2H4.9Z" />
      <path d="M13.3 6.3a1 1 0 0 1 1.4 0l3.5 3.5a1 1 0 0 1 0 1.4l-3.5 3.5a1 1 0 1 1-1.4-1.4L15.08 11.5H8.9a1 1 0 1 1 0-2h6.18L13.3 7.7a1 1 0 0 1 0-1.4Z" />
    </Icon>
  );
}

/** 返回：实心箭头 */
export function ArrowLeftIcon(props: IconProps) {
  return (
    <Icon {...props}>
      <path d="M9.7 3.3a1 1 0 0 1 0 1.4L6.42 8h10.08a1 1 0 1 1 0 2H6.42L9.7 13.3a1 1 0 1 1-1.4 1.4l-4.6-4.6a1 1 0 0 1 0-1.4l4.6-4.6a1 1 0 0 1 1.4 0Z" />
    </Icon>
  );
}

/** 在线状态：实心圆 + 对勾 */
export function StatusOnlineIcon(props: IconProps & { filled?: boolean }) {
  const { filled, ...rest } = props;
  return (
    <Icon {...rest}>
      {filled === false ? (
        <path d="M10 2.5a7.5 7.5 0 1 0 0 15 7.5 7.5 0 0 0 0-15Zm3.9 5.35-4.6 5.4a.95.95 0 0 1-1.4.05L5.9 11.3a.95.95 0 0 1 1.35-1.34l1.33 1.35 3.93-4.62a.95.95 0 0 1 1.4 1.16Z" />
      ) : (
        <circle cx="10" cy="10" r="4.4" />
      )}
    </Icon>
  );
}

/** 编辑：实心铅笔（倾斜，带笔尖缺口） */
export function EditIcon(props: IconProps) {
  return (
    <Icon {...props}>
      <path d="M13.62 2.72a2.6 2.6 0 0 1 3.68 3.68l-1.6 1.6-3.68-3.68 1.6-1.6ZM11.06 5.28 2.98 13.36a2.5 2.5 0 0 0-.65 1.09l-.83 2.72a.85.85 0 0 0 1.06 1.06l2.72-.83a2.5 2.5 0 0 0 1.09-.65l8.08-8.08-3.39-3.39Z" />
    </Icon>
  );
}

/** 浅色模式：实心太阳 + 放射线，用 path 直接画粗短线（不依赖 stroke） */
export function SunIcon(props: IconProps) {
  return (
    <Icon {...props}>
      <circle cx="10" cy="10" r="4.2" />
      {/* 八向光芒：短粗矩形绕中心排布，保持实心块面语言 */}
      <path d="M9.05 1.6h1.9v2.6h-1.9zM9.05 15.8h1.9v2.6h-1.9zM1.6 9.05h2.6v1.9H1.6zM15.8 9.05h2.6v1.9h-2.6z" />
      <path d="M3.72 4.6 5.4 2.92l1.4 1.4-1.68 1.68zM13.2 14.08l1.68-1.68 1.4 1.4-1.68 1.68zM15.4 3.72l1.68 1.68-1.4 1.4-1.68-1.68zM4.6 16.28l-1.68-1.68 1.4-1.4 1.68 1.68z" />
    </Icon>
  );
}

/** 深色模式：实心月牙（负空间挖出，避免细线感） */
export function MoonIcon(props: IconProps) {
  return (
    <Icon {...props}>
      <path d="M10.6 2.1a.95.95 0 0 0-1.2 1.15 6.4 6.4 0 0 1-7.7 7.7.95.95 0 0 0-1.15 1.2A8.2 8.2 0 1 0 10.6 2.1Z" />
    </Icon>
  );
}

/** 跟随系统：实心显示器，屏幕区域用一块浅色负空间表示 */
export function MonitorIcon(props: IconProps) {
  return (
    <Icon {...props}>
      <path d="M3.6 2.5A2.6 2.6 0 0 0 1 5.1v7.4a2.6 2.6 0 0 0 2.6 2.6h4.5v1.9H6.2a1 1 0 1 0 0 2h7.6a1 1 0 1 0 0-2h-1.9v-1.9h4.5A2.6 2.6 0 0 0 19 12.5V5.1a2.6 2.6 0 0 0-2.6-2.6H3.6Z" />
      <path d="M3.85 5.35h12.3v6.9H3.85z" opacity=".28" />
    </Icon>
  );
}
