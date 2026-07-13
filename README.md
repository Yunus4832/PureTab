# PureTab

一个极简新标签页浏览器插件，界面接近 Google 搜索首页，但只保留搜索本身。

## 功能

- 接管浏览器新标签页
- 切换搜索引擎：Google、Bing、DuckDuckGo、百度、搜狗
- 自定义背景图片
- 自定义搜索框上方 Logo：文字、图片或当前时间
- 本地搜索历史记录，输入时以下拉建议显示
- 可选显示浏览器书签建议
- 无运行时依赖，构建脚本只负责打包发布文件

## 权限说明

- `storage`：保存搜索引擎、主题、背景、Logo 和本地搜索历史。
- `bookmarks`：仅在开启“在搜索建议中显示书签”后读取本地书签，用于搜索框下拉建议；数据不会上传。

隐私说明见 [PRIVACY.md](PRIVACY.md)。

## 下载

从 [GitHub Releases](https://github.com/Yunus4832/PureTab/releases) 下载对应浏览器的发布包：

- Chrome / Edge：`PureTab-*-chrome.zip`
- Firefox：`PureTab-*-firefox.xpi`

## Chrome / Edge 手动安装

1. 打开 Chrome 或 Edge 的扩展管理页。
2. 开启“开发者模式”。
3. 解压下载的 `PureTab-*-chrome.zip`。
4. 选择“加载已解压的扩展程序”。
5. 选择解压后的目录。
6. 打开一个新标签页。

## Firefox 手动安装

1. 打开 `about:debugging#/runtime/this-firefox`。
2. 点击“临时载入附加组件”。
3. 选择下载的 `PureTab-*-firefox.xpi`。
4. 打开一个新标签页。

注意：Firefox 通过 `about:debugging` 安装的是临时附加组件，重启浏览器后需要重新载入。

## 从源码加载

如果你想从源码运行：

- Chrome / Edge：在扩展管理页选择“加载已解压的扩展程序”，选择 `src/` 目录。
- Firefox：在 `about:debugging#/runtime/this-firefox` 中选择 `src/manifest.json`。

## 构建发布包

需要本机有 Python 3。

```bash
npm run check
npm run build
```

构建产物会生成到 `dist/`：

- `dist/PureTab-*-chrome.zip`
- `dist/PureTab-*-firefox.xpi`
- `dist/checksums.txt`

## 文件结构

- `src/manifest.json`：浏览器扩展配置
- `src/newtab.html`：新标签页结构
- `src/newtab.css`：界面样式
- `src/newtab.js`：设置、搜索、历史记录逻辑
- `src/icons/`：扩展图标和搜索引擎图标
- `scripts/build.mjs`：打包 Chrome ZIP 和 Firefox XPI
- `scripts/check.mjs`：校验扩展清单文件
- `dist/`：构建产物，不提交到仓库
