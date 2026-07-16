# PureTab

一个极简新标签页浏览器插件，界面接近 Google 搜索首页，但只保留搜索本身。

## 功能

- 接管浏览器新标签页
- 默认遵循浏览器搜索设置，并可为单次搜索切换至 Google、Bing、DuckDuckGo、百度或搜狗
- 自定义背景图片
- 自定义搜索框上方 Logo：文字、图片或当前时间
- 本地搜索历史记录，输入时以下拉建议显示
- 可选显示浏览器书签建议
- 可选显示浏览器历史记录建议
- 无运行时依赖，构建脚本只负责生成商店提交包

## 权限说明

- `search`：通过浏览器默认搜索引擎执行默认搜索。
- `storage`：保存主题、背景、Logo 和本地搜索历史；不会把第三方搜索引擎保存为新标签页默认项。
- `bookmarks`：仅在开启“在搜索建议中显示书签”后读取本地书签，用于搜索框下拉建议；数据不会上传。
- `history`：可选权限，仅在开启并授权“在搜索建议中显示浏览器历史记录”后读取本地浏览历史，用于搜索框下拉建议；数据不会上传。

隐私说明见 [PRIVACY.md](PRIVACY.md)。

## 安装

### Chrome / Edge

Chrome / Edge 用户请通过 Chrome Web Store 安装 PureTab。

### Firefox

Firefox 用户请通过 Mozilla Add-ons 安装 PureTab。

## 从源码加载

如果你想从源码运行：

- Chrome / Edge：在扩展管理页选择“加载已解压的扩展程序”，选择 `src/` 目录。
- Firefox：在 `about:debugging#/runtime/this-firefox` 中选择 `src/manifest.json`，重启后需要重新载入。

## 构建商店提交包

需要本机有 Node.js。

```bash
npm run check
npm run build
```

构建产物会生成到 `dist/`，用于提交到 Chrome Web Store 和 Mozilla Add-ons：

- `dist/PureTab-*-chrome.zip`
- `dist/PureTab-*-firefox.xpi`
- `dist/checksums.txt`

## 文件结构

- `src/manifest.json`：浏览器扩展配置
- `src/newtab.html`：新标签页结构
- `src/newtab.css`：界面样式
- `src/newtab.js`：设置、搜索、历史记录逻辑
- `src/icons/`：扩展图标和搜索引擎图标
- `scripts/build.mjs`：生成 Chrome Web Store 和 Mozilla Add-ons 提交包
- `scripts/check.mjs`：校验扩展清单文件
- `dist/`：构建产物，不提交到仓库

## 许可证

[MIT](LICENSE)
