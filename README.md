# 前后端分离计算器前端

## 项目介绍

原生 HTML/CSS/JavaScript 计算器前端。用户可以通过键盘或按钮输入复合表达式，
点击等号后由 Python 标准库后端完成计算。结果和历史记录均来自后端接口，前端不会执行表达式。

## 技术栈

- HTML5
- CSS Grid / Flexbox
- 原生 JavaScript Fetch API
- 无框架、无构建步骤

## 运行环境

- 现代 Chromium、Firefox 或 Safari 浏览器
- 可选的 Python 3，用于启动本地静态文件服务
- 已启动的后端服务

## 启动方法

先在后端仓库执行 `python -m app.server` 启动 API，然后在本目录执行：

```powershell
python -m http.server 5500
```

浏览器访问 `http://127.0.0.1:5500`。

不要直接双击 `index.html`。使用 `file://` 打开时浏览器可能拦截跨域请求。

## 配置

`config.js` 保存后端地址：

```javascript
window.APP_CONFIG = {
  API_BASE_URL: "http://127.0.0.1:8000",
};
```

部署到 GitHub Pages 后，把地址替换成 Render Web Service 地址，不要以 `/` 结尾。

## 前后端连接

- `POST /api/calculations`：提交表达式并接收后端结果。
- `GET /api/history`：每次进入页面、计算成功或删除成功后读取数据库历史。
- `DELETE /api/history/{id}`：删除指定记录。

如果后端停止，页面仍可输入表达式，但等号不会产生新的有效结果，并会显示连接错误。

## GitHub Pages 部署

1. 将本仓库推送到独立 GitHub 仓库。
2. 在仓库 Settings → Pages 中选择从分支部署。
3. 确认 `config.js` 已指向公网后端地址。
4. 把 `https://用户名.github.io` 加入后端 `ALLOWED_ORIGINS`。
