import type { ThemeChoice } from '../context/ThemeContext';
import { useTheme } from '../context/ThemeContext';
import { MonitorIcon, MoonIcon, SunIcon } from './Icons';
import styles from './ThemeToggle.module.css';

interface Props {
  /** 'icon' 单按钮循环切换；'segmented' 三档分段控件 */
  readonly variant?: 'icon' | 'segmented';
  readonly className?: string;
}

const ORDER: ThemeChoice[] = ['system', 'light', 'dark'];

/**
 * 主题切换。跟随系统 → 浅色 → 深色 循环。
 * 单按钮形态用于应用顶栏；分段形态用于设置页。
 */
export default function ThemeToggle({ variant = 'icon', className }: Props) {
  const { choice, resolved, setChoice, toggle } = useTheme();

  if (variant === 'segmented') {
    const options = [
      { key: 'system' as const, label: '跟随系统', Icon: MonitorIcon },
      { key: 'light' as const, label: '浅色', Icon: SunIcon },
      { key: 'dark' as const, label: '深色', Icon: MoonIcon },
    ];
    return (
      <div className={`${styles.segmented} ${className ?? ''}`} role="radiogroup" aria-label="主题">
        {options.map(({ key, label, Icon }) => (
          <button
            key={key}
            type="button"
            role="radio"
            aria-checked={choice === key}
            className={`${styles.segment} ${choice === key ? styles.segmentActive : ''}`}
            onClick={() => setChoice(key)}
            title={label}
          >
            <Icon size={16} />
            <span>{label}</span>
          </button>
        ))}
      </div>
    );
  }

  const idx = ORDER.indexOf(choice);
  const next = ORDER[(idx + 1) % ORDER.length] ?? 'system';
  const label = { system: '跟随系统', light: '浅色', dark: '深色' }[choice];

  return (
    <button
      type="button"
      className={`${styles.iconBtn} ${className ?? ''}`}
      onClick={choice === 'system' ? () => setChoice(next) : toggle}
      title={`主题：${label}${choice === 'system' ? `（当前${resolved === 'dark' ? '深色' : '浅色'}）` : ''}`}
      aria-label={`切换主题，当前${label}`}
    >
      {choice === 'system' ? <MonitorIcon /> : resolved === 'dark' ? <MoonIcon /> : <SunIcon />}
    </button>
  );
}
