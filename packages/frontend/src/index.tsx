import { createRoot } from 'react-dom/client';
import App from './App';
import './global.css';

/**
 * 首帧主题预置。
 *
 * ThemeProvider 是在 React 挂载后的 useEffect 里才把 data-theme 写到 <html> 上的，
 * 也就是说在 React 接管之前，浏览器会先用 CSS 的浅色默认值绘制一帧 ——
 * 深色模式用户每次打开页面都会看到一次白色闪烁（FOUC）。
 *
 * 这里在挂载前用一段同步脚本把主题先定下来，让第一帧就是正确颜色。
 * 逻辑必须与 ThemeContext.readStoredChoice / systemPrefersDark 保持一致，
 * 否则会出现「首帧深色、随后跳浅色」的反向闪烁。
 */
function resolveInitialTheme(): 'light' | 'dark' {
  try {
    const stored = localStorage.getItem('webchat.theme');
    if (stored === 'light' || stored === 'dark') return stored;
  } catch {
    /* localStorage 不可用（隐私模式）时退回系统偏好 */
  }
  return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
}

document.documentElement.dataset.theme = resolveInitialTheme();

createRoot(document.getElementById('root')!).render(<App />);
