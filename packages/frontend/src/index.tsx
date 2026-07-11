import { createRoot } from 'react-dom/client';
import App from './App';
import { patchFetch } from './utils/api';
import './global.css';

// 预览环境的 webview proxy 需要在 fetch 中保留 sandbox 路由参数
patchFetch();

createRoot(document.getElementById('root')!).render(<App />);
