/**
 * Stylelint 配置。
 *
 * 目标：只报「真问题」（无效语法、真实错误），不报风格偏好。
 * stylelint-config-standard 里大量规则是在争论冒号后一个空格还是两个、
 * 十六进制用长写还是短写 —— 这类分歧不影响正确性，却会把 CI 变成噪音源，
 * 最终结果是没人再看告警。这里把这几条关掉，保留结构性检查。
 */
module.exports = {
  extends: ['stylelint-config-standard'],
  rules: {
    // 媒体查询区间写法：min-width / max-width 与 range 语法等价，不作要求
    'media-feature-range-notation': null,
    // rgb(0 0 0 / 50%) 与 rgba(0, 0, 0, 0.5) 等价
    'color-function-alias-notation': null,
    // rgba(0,0,0,.5) 与 rgb(0 0 0 / 50%) 等价，不必强制改写
    'color-function-notation': null,
    'alpha-value-notation': null,
    // CSS Modules 中 class 名由 JS 引用，camelCase 是惯用且更自然的写法
    'selector-class-pattern': null,
    // 声明块之间要不要空行是纯排版偏好，不影响正确性
    'rule-empty-line-before': null,
    'declaration-empty-line-before': null,
    'custom-property-empty-line-before': null,
    // CSS Modules 里同一选择器在不同文件重复是正常的
    'no-duplicate-selectors': null,
    // #fff 与 #ffffff 等价
    'color-hex-length': null,
    // 允许 var() 的任意大小写写法
    'value-keyword-case': null,
    // 选择器书写顺序不影响层叠结果（Specificity 由选择器本身决定）
    'no-descending-specificity': null,
    // 已废弃关键字不必强行替换（--scrim 等语义变量名会误报）
    'declaration-property-value-keyword-no-deprecated': null,
    // 允许注释与选择器之间不留空行
    'comment-empty-line-before': null,
    'at-rule-empty-line-before': null,
  },
  ignoreFiles: ['dist/**', 'node_modules/**', '**/*.min.css'],
};
