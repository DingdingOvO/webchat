/**
 * 自定义 SVG 图标组件（Fluent Design System 风格）
 * 避免依赖 @fluentui/react-icons 的 bundle 体积问题，
 * 直接用内联 SVG 复刻标准 20px Fluent 图标。
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
      style={{ display: 'inline-block', verticalAlign: 'middle' }}
    >
      {children}
    </svg>
  );
}

export function SearchIcon(props: IconProps) {
  return (
    <Icon {...props}>
      <path d="M8.5 3a5.5 5.5 0 0 1 4.23 9.02l4.12 4.13a.5.5 0 0 1-.7.7l-4.13-4.12A5.5 5.5 0 1 1 8.5 3Zm0 1a4.5 4.5 0 1 0 0 9 4.5 4.5 0 0 0 0-9Z" />
    </Icon>
  );
}

export function AddIcon(props: IconProps) {
  return (
    <Icon {...props}>
      <path d="M10 2.5a.5.5 0 0 0-1 0V9H2.5a.5.5 0 0 0 0 1H9v6.5a.5.5 0 0 0 1 0V10h6.5a.5.5 0 0 0 0-1H10V2.5Z" />
    </Icon>
  );
}

export function PersonIcon(props: IconProps) {
  return (
    <Icon {...props}>
      <path d="M10 2a4 4 0 1 0 0 8 4 4 0 0 0 0-8ZM7 6a3 3 0 1 1 6 0 3 3 0 0 1-6 0Zm-1.5 5A2.5 2.5 0 0 0 3 13.5c0 1.7.83 3.14 2.19 4.07A7.45 7.45 0 0 0 10 19c2.05 0 3.92-.57 4.81-1.43A3.78 3.78 0 0 0 17 13.5 2.5 2.5 0 0 0 14.5 11h-9Zm-.16 1.16h9.33c.74 0 1.33.6 1.33 1.34 0 1.2-.5 2.22-1.44 2.9A6.46 6.46 0 0 1 10 17.84c-1.8 0-3.38-.5-4.4-1.44A2.78 2.78 0 0 1 4.17 13.5c0-.74.6-1.34 1.33-1.34Z" />
    </Icon>
  );
}

export function PeopleIcon(props: IconProps) {
  return (
    <Icon {...props}>
      <path d="M11 10a2 2 0 0 1 2 2v.5c0 2.13-2.04 3.5-5.5 3.5S2 14.63 2 12.5V12c0-1.1.9-2 2-2h7Zm-7.17 1H4a1 1 0 0 0-1 1v.5c0 1.02.87 2.05 2.56 2.75A6.3 6.3 0 0 0 7.5 15c1.3 0 2.44-.24 3.32-.66l.3-.14A3.85 3.85 0 0 0 12 13v-.5c0-.08 0-.15-.02-.22A2.97 2.97 0 0 0 11 11H4.01l-.18-.01ZM7.5 2a3.5 3.5 0 1 1 0 7 3.5 3.5 0 0 1 0-7Zm0 1a2.5 2.5 0 1 0 0 5 2.5 2.5 0 0 0 0-5Zm4.43.12a2.5 2.5 0 0 1 0 4.76A3.5 3.5 0 0 0 10.1 7.8l.2-.07.07-.03a1.5 1.5 0 1 0-1.5-2.65A3.5 3.5 0 0 0 8 4.24l.1-.1.1-.07a2.5 2.5 0 0 1 3.73-1.04l.01.1.01-.1ZM14.5 9a2.5 2.5 0 1 1 0 5 2.5 2.5 0 0 1 0-5Zm0 1a1.5 1.5 0 1 0 0 3 1.5 1.5 0 0 0 0-3ZM18 12.5c0 .92-.5 1.75-1.38 2.37a4.65 4.65 0 0 1-.93.5 3.48 3.48 0 0 0 .8-1.62l.05-.3.01-.22V12a1 1 0 0 0-.83-.98l.15-.01.68-.01h.45c.65 0 1 .37 1 1.5Z" />
    </Icon>
  );
}

export function SendIcon(props: IconProps) {
  return (
    <Icon {...props}>
      <path d="M3.03 2.7a.5.5 0 0 0-.74.55l1.79 7.25H9.5a.5.5 0 0 1 0 1H4.08l-1.79 7.25a.5.5 0 0 0 .74.55l15-9a.5.5 0 0 0 0-.88l-15-7.72Zm2.92 8.8H6.5a.5.5 0 0 1 0 1H5.95l-.42-1.02.42.02Zm-.62-1.5-.63-2.55 8.86 4.55H7.05l-1.72-.75v.02c-.3-.38-.55-.8-.73-1.25l-.01-.02Z" />
    </Icon>
  );
}

export function CheckmarkIcon(props: IconProps) {
  return (
    <Icon {...props}>
      <path d="M14.8 5.22a.5.5 0 0 1 0 .7l-7.67 7.68a.5.5 0 0 1-.7 0L2.9 10.1a.5.5 0 1 1 .7-.7l3.18 3.18 7.32-7.32a.5.5 0 0 1 .7-.04Z" />
    </Icon>
  );
}

export function DismissIcon(props: IconProps) {
  return (
    <Icon {...props}>
      <path d="M4.09 4.22a.5.5 0 0 1 .7 0L10 9.3l5.2-5.2a.5.5 0 1 1 .7.71L10.7 10l5.2 5.2a.5.5 0 1 1-.7.7L10 10.71l-5.2 5.2a.5.5 0 0 1-.71-.7L9.3 10 4.1 4.8a.5.5 0 0 1 0-.7Z" />
    </Icon>
  );
}

export function ChatIcon(props: IconProps) {
  return (
    <Icon {...props}>
      <path d="M3 5.5A2.5 2.5 0 0 1 5.5 3h9A2.5 2.5 0 0 1 17 5.5v6.88a2.5 2.5 0 0 1-2.5 2.5H9.56l-3.68 2.6A.5.5 0 0 1 5 17.1V14.9a2.5 2.5 0 0 1-2-2.47V5.5ZM5.5 4C4.67 4 4 4.67 4 5.5v6.95c0 .55.45 1 1 1 .28 0 .5.22.5.5v1.44l2.87-2.02a.5.5 0 0 1 .29-.1h4.84c.83 0 1.5-.67 1.5-1.5V5.5c0-.83-.67-1.5-1.5-1.5h-9Z" />
    </Icon>
  );
}

export function SignOutIcon(props: IconProps) {
  return (
    <Icon {...props}>
      <path d="M10 2.5a.5.5 0 0 0-.5-.5h-5A2.5 2.5 0 0 0 2 4.5v11A2.5 2.5 0 0 0 4.5 18h5a.5.5 0 0 0 0-1h-5A1.5 1.5 0 0 1 3 15.5v-11A1.5 1.5 0 0 1 4.5 3h5a.5.5 0 0 0 .5-.5Zm.65 4.15a.5.5 0 0 0-.7.7l2.14 2.15H6.5a.5.5 0 0 0 0 1h5.59l-2.14 2.15a.5.5 0 0 0 .7.7l3-3a.5.5 0 0 0 0-.7l-3-3Z" />
    </Icon>
  );
}

export function ArrowLeftIcon(props: IconProps) {
  return (
    <Icon {...props}>
      <path d="M9.03 3.97a.5.5 0 0 1 0 .7L5.26 8.5H17a.5.5 0 0 1 0 1H5.26l3.77 3.78a.5.5 0 0 1-.7.7l-4.5-4.5a.5.5 0 0 1 0-.7l4.5-4.5a.5.5 0 0 1 .7 0Z" />
    </Icon>
  );
}

export function StatusOnlineIcon(props: IconProps & { filled?: boolean }) {
  return (
    <Icon {...props}>
      {props.filled ? (
        <path d="M7.5 1a6.5 6.5 0 1 0 0 13 6.5 6.5 0 0 0 0-13Zm3.1 4.6-4 4.5a.5.5 0 0 1-.74.02L3.76 8.05a.5.5 0 1 1 .72-.7L6.3 9.77l3.67-4.13a.5.5 0 0 1 .63-.03Z" />
      ) : (
        <path
          d="M3.5 10a6.5 6.5 0 1 0 0-13 6.5 6.5 0 0 0 0 13Zm2.85-8.37 3.78 4.24a.5.5 0 0 1-.73.66l-3.1-3.48-1.6 1.59a.5.5 0 0 1-.7-.7l1.92-1.92a.5.5 0 0 1 .43-.16.5.5 0 0 1 .4.18Z"
          transform="translate(3.5, -0.5)"
        />
      )}
    </Icon>
  );
}

export function EditIcon(props: IconProps) {
  return (
    <Icon {...props}>
      <path d="M16.93 4.1a2.82 2.82 0 0 0-3.99 0l-8.46 8.45a2.5 2.5 0 0 0-.6.96l-1.09 3.26a.5.5 0 0 0 .63.63l3.26-1.1c.36-.12.69-.32.96-.6l8.46-8.45a2.82 2.82 0 0 0 0-3.99l-.17-.17Zm-3.29.7a1.82 1.82 0 0 1 2.58 2.58l-8.46 8.44c-.16.17-.37.28-.6.35l-2.3.78.78-2.3c.07-.23.18-.44.35-.6l8.45-8.45-.8-.8Z" />
    </Icon>
  );
}

/* ---- 导航栏专用图标 ---- */

export function HomeIcon(props: IconProps) {
  return (
    <Icon {...props}>
      <path d="M10 2.25a.5.5 0 0 1 .32.12l7 6a.5.5 0 1 1-.64.76L16 8.56V15.5A1.5 1.5 0 0 1 14.5 17h-9A1.5 1.5 0 0 1 4 15.5V8.56l-.68.57a.5.5 0 1 1-.64-.76l7-6A.5.5 0 0 1 10 2.25ZM5 7.98v7.52a.5.5 0 0 0 .5.5h9a.5.5 0 0 0 .5-.5V7.98L10 4.02 5 7.98ZM8.5 10h3a.5.5 0 0 1 .5.5v3a.5.5 0 0 1-.5.5h-3a.5.5 0 0 1-.5-.5v-3a.5.5 0 0 1 .5-.5Zm.5 1v2h2v-2H9Z" />
    </Icon>
  );
}

export function DocsIcon(props: IconProps) {
  return (
    <Icon {...props}>
      <path d="M6 2a2.5 2.5 0 0 0-2.5 2.5v11A2.5 2.5 0 0 0 6 18h8a2.5 2.5 0 0 0 2.5-2.5V6.5a.5.5 0 0 0-.15-.35l-4-4A.5.5 0 0 0 12 2H6Zm-1.5 2.5A1.5 1.5 0 0 1 6 3h5.5v3.5a1 1 0 0 0 1 1H16v8a1.5 1.5 0 0 1-1.5 1.5H6A1.5 1.5 0 0 1 4.5 15.5v-11ZM16 6.88 12.62 3.5H12v3h4v.38ZM7.5 10.5a.5.5 0 0 0 0 1h5a.5.5 0 0 0 0-1h-5Zm0 3a.5.5 0 0 0 0 1h5a.5.5 0 0 0 0-1h-5Z" />
    </Icon>
  );
}

export function FeedbackIcon(props: IconProps) {
  return (
    <Icon {...props}>
      <path d="M3 5.5A2.5 2.5 0 0 1 5.5 3h9A2.5 2.5 0 0 1 17 5.5v5.88a2.5 2.5 0 0 1-2.5 2.5H9.56l-3.68 2.6A.5.5 0 0 1 5 16.1V13.9a2.5 2.5 0 0 1-2-2.47V5.5Zm2.5-1.5c-.83 0-1.5.67-1.5 1.5v5.95c0 .55.45 1 1 1 .28 0 .5.22.5.5v1.44l2.87-2.02a.5.5 0 0 1 .29-.1h4.84c.83 0 1.5-.67 1.5-1.5V5.5c0-.83-.67-1.5-1.5-1.5h-9Z" />
      <path d="M7 7.5a.5.5 0 0 1 .5-.5h5a.5.5 0 0 1 0 1h-5a.5.5 0 0 1-.5-.5Zm0 2a.5.5 0 0 1 .5-.5h5a.5.5 0 0 1 0 1h-5a.5.5 0 0 1-.5-.5Z" />
    </Icon>
  );
}

export function GitHubIcon(props: IconProps) {
  return (
    <Icon {...props}>
      <path d="M10 1.5a8.5 8.5 0 0 0-2.69 16.56c.43.08.58-.18.58-.41v-1.62c-2.35.51-2.84-1.13-2.84-1.13-.38-.97-.94-1.23-.94-1.23-.77-.53.06-.52.06-.52.85.06 1.3.87 1.3.87.75 1.29 1.97.92 2.45.7.08-.55.3-.92.54-1.13-1.88-.21-3.84-.94-3.84-4.18 0-.92.33-1.68.87-2.27-.09-.22-.38-1.07.08-2.22 0 0 .71-.23 2.33.87a8.1 8.1 0 0 1 4.24 0c1.62-1.1 2.33-.87 2.33-.87.46 1.15.17 2 .08 2.22.54.59.87 1.35.87 2.27 0 3.24-1.97 3.97-3.85 4.18.3.26.57.78.57 1.57v2.33c0 .23.15.5.59.41A8.5 8.5 0 0 0 10 1.5Z" />
    </Icon>
  );
}

export function ExternalIcon(props: IconProps) {
  return (
    <Icon {...props}>
      <path d="M12 2.5a.5.5 0 0 1 .5-.5h5a.5.5 0 0 1 .5.5v5a.5.5 0 0 1-1 0V3.7l-6.15 6.15a.5.5 0 0 1-.7-.7L16.3 3H12.5a.5.5 0 0 1-.5-.5ZM6 4a2 2 0 0 0-2 2v8a2 2 0 0 0 2 2h8a2 2 0 0 0 2-2v-3.5a.5.5 0 0 0-1 0V14a1 1 0 0 1-1 1H6a1 1 0 0 1-1-1V6a1 1 0 0 1 1-1h3.5a.5.5 0 0 0 0-1H6Z" />
    </Icon>
  );
}

export function LoginIcon(props: IconProps) {
  return (
    <Icon {...props}>
      <path d="M14 2.5a.5.5 0 0 0-.5-.5h-5A2.5 2.5 0 0 0 6 4.5v2a.5.5 0 0 0 1 0v-2A1.5 1.5 0 0 1 8.5 3h5a.5.5 0 0 1 .5.5v11a.5.5 0 0 1-.5.5h-5A1.5 1.5 0 0 1 7 13.5v-2a.5.5 0 0 0-1 0v2A2.5 2.5 0 0 0 8.5 16h5a2.5 2.5 0 0 0 2.5-2.5v-11Z" />
      <path d="M8.65 6.15a.5.5 0 0 0-.7.7L9.79 8.5H2.5a.5.5 0 0 0 0 1h7.29l-1.84 1.85a.5.5 0 0 0 .7.7l2.65-2.65a.5.5 0 0 0 .15-.35.5.5 0 0 0-.15-.35L8.65 6.15Z" />
    </Icon>
  );
}

export function MenuIcon(props: IconProps) {
  return (
    <Icon {...props}>
      <path d="M2.5 4.5a.5.5 0 0 1 .5-.5h14a.5.5 0 0 1 0 1H3a.5.5 0 0 1-.5-.5Zm0 5a.5.5 0 0 1 .5-.5h14a.5.5 0 0 1 0 1H3a.5.5 0 0 1-.5-.5Zm.5 4.5a.5.5 0 0 0 0 1h14a.5.5 0 0 0 0-1H3Z" />
    </Icon>
  );
}
