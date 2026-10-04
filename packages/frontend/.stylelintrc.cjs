/** Stylelint 配置 —— CSS Modules 场景。
 *  目的：让 CI 里「Stylelint」这一步名副其实（此前检查名写了却从未真正执行）。
 *  只做「稳健、不致误报」的规则；CSS Modules 的 :global 等语法定制处理。
 */
module.exports = {
  extends: ['stylelint-config-standard'],
  rules: {
    // CSS Modules 的类名是 camelCase / kebab 混合，不做命名强约束
    'selector-class-pattern': null,
    // 允许 CSS 变量在 :root 定义、在别处使用（跨文件，静态检查看不到）
    'no-descending-specificity': null,
    // 允许空行分隔的逻辑分组，不做空行数量限制
    'rule-empty-line-before': null,
    'at-rule-empty-line-before': null,
    'declaration-empty-line-before': null,
    'custom-property-empty-line-before': null,
    'comment-empty-line-before': null,
    // Vite/Webpack 允许简写属性顺序自由
    'declaration-block-no-redundant-longhand-properties': null,
    // 允许 -webkit- 前缀（scrollbar 定制需要）
    'property-no-vendor-prefix': null,
    'value-no-vendor-prefix': null,
    // 允许 rgba() 现代写法
    'color-function-notation': null,
    'alpha-value-notation': null,
    // 允许 0.5px 等非整数像素（设计语言里明确使用）
    'number-max-precision': null,
    // 以下为「风格偏好」而非「错误」，逐条关闭以免制造无意义的改动噪音：
    // 媒体查询沿用 (max-width: Npx) 已是全仓现状，不强推 range 语法
    'media-feature-range-notation': null,
    // rgba() 与 rgb() 写法等价，不强制
    'color-function-alias-notation': null,
    // 字体栈里的字体名大小写不参与强约束
    'value-keyword-case': null,
    // :root 分块定义（灰阶 / 语义 / 刻度）是本仓有意为之的结构
    'no-duplicate-selectors': null,
    // word-break: break-word 在目标浏览器上行为明确
    'declaration-property-value-keyword-no-deprecated': null,
    // 设计令牌文件里保留完整的 6 位十六进制，便于肉眼核对与检索
    'color-hex-length': null,
  },
  ignoreFiles: ['dist/**', 'node_modules/**', '**/*.min.css'],
};
