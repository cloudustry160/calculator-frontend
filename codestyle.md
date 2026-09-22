# 前端代码规范

## 规范来源

- [Google HTML/CSS Style Guide](https://google.github.io/styleguide/htmlcssguide.html)
- [Airbnb JavaScript Style Guide](https://github.com/airbnb/javascript)
- [MDN Web 可访问性指南](https://developer.mozilla.org/zh-CN/docs/Web/Accessibility)

## HTML

- 使用 HTML5 文档类型，页面语言设置为 `zh-CN`。
- 标签和属性使用小写，属性值始终使用双引号。
- 使用语义化元素，并保证标题层级连续。
- 表单控件必须有对应的 `label` 或可访问名称。
- 交互状态使用 `aria-live`、`aria-busy` 等属性提供给辅助技术。

## CSS

- 类名使用小写短横线命名，例如 `history-item`。
- 颜色、边框和间距优先使用 `:root` 变量。
- 布局优先使用 CSS Grid 和 Flexbox，避免固定像素定位。
- 禁止依赖负字距，页面必须支持移动端和桌面端。
- 保留 `:focus-visible` 状态，不能只依赖悬停效果。

## JavaScript

- 使用 `const` 和 `let`，禁止使用 `var`。
- 使用语义明确的函数拆分请求、渲染和交互逻辑。
- 使用 `textContent` 输出后端数据，禁止将用户数据直接传给 `innerHTML`。
- 网络请求统一通过 `apiRequest`，并处理成功、错误和无响应体三种情况。
- 前端不得实现表达式计算，不得使用 `eval` 或 `Function` 执行表达式。
- 所有 DOM 查询集中在文件开头，便于检查依赖关系。
