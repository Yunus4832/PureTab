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

## 安装

### Chrome / Edge

Chrome / Edge 可以使用浏览器自带的“打包扩展程序”生成本地自签名 CRX：

1. 运行 `npm run build`，或取得 `PureTab-*-chrome.zip`。
2. 将 `PureTab-*-chrome.zip` 解压到一个长期保留的目录，例如 `~/.local/share/puretab/chrome/`。
3. 打开扩展管理页。
   - Chrome：`chrome://extensions`
   - Edge：`edge://extensions`
4. 开启“开发者模式”。
5. 点击“打包扩展程序”。
6. “扩展程序根目录”选择第 2 步解压后的目录。
7. 第一次打包时“私钥文件”留空，浏览器会生成 `.crx` 和 `.pem`。
8. 妥善保存 `.pem`；后续更新同一个扩展时需要继续使用这个私钥文件。
9. 将生成的 `.crx` 拖动到扩展管理页安装。

如果只是本地开发，也可以直接选择“加载已解压的扩展程序”，并选择 `src/` 或解压后的目录。

### Firefox

Firefox 用户请从 Mozilla Add-ons 安装 PureTab。Firefox 正式版需要使用经过 Mozilla 签名的扩展；本地未签名 XPI 只能用于临时测试。

审核通过前，可以用临时方式测试：

1. 打开 `about:debugging#/runtime/this-firefox`。
2. 点击“临时载入附加组件”。
3. 选择 `dist/PureTab-*-firefox.xpi`，或选择源码目录中的 `src/manifest.json`。
4. 打开一个新标签页。

临时载入的附加组件会在 Firefox 重启后失效。

## 从源码加载

如果你想从源码运行：

- Chrome / Edge：在扩展管理页选择“加载已解压的扩展程序”，选择 `src/` 目录。
- Firefox：在 `about:debugging#/runtime/this-firefox` 中选择 `src/manifest.json`，重启后需要重新载入。

## 构建发布包

需要本机有 Node.js。

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

## 许可证

[MIT](LICENSE)
