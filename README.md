# PureTab

一个极简新标签页浏览器插件，界面接近 Google 搜索首页，但只保留搜索本身。

## 功能

- 接管浏览器新标签页
- 切换搜索引擎：Google、Bing、DuckDuckGo、百度、搜狗
- 自定义背景图片
- 自定义搜索框上方 Logo：文字、图片或当前时间
- 本地搜索历史记录，输入时以下拉建议显示
- 可选显示浏览器书签建议
- 无构建步骤，无外部依赖

## 权限说明

- `storage`：保存搜索引擎、主题、背景、Logo 和本地搜索历史。
- `bookmarks`：仅在开启“在搜索建议中显示书签”后读取本地书签，用于搜索框下拉建议；数据不会上传。

隐私说明见 [PRIVACY.md](PRIVACY.md)。

## Chrome / Edge

1. 打开 Chrome 或 Edge 的扩展管理页。
2. 开启“开发者模式”。
3. 选择“加载已解压的扩展程序”。
4. 选择本目录：`/home/yunus/Desktop/code/custom-new-tab`
5. 打开一个新标签页。

## Firefox

1. 打开 `about:debugging#/runtime/this-firefox`。
2. 点击“临时载入附加组件”。
3. 选择本目录中的 `manifest.json`。
4. 打开一个新标签页。

## 文件结构

- `manifest.json`：浏览器扩展配置
- `newtab.html`：新标签页结构
- `newtab.css`：界面样式
- `newtab.js`：设置、搜索、历史记录逻辑
- `icons/`：扩展图标和搜索引擎图标
