# CodeBuddy 交接说明：英语点读助手

## 1. 项目定位

这是一个英语课本点读小程序 + H5 预览项目，目标是先上线一个可用的“小程序点读助手”版本。

当前重点不是重构，而是继续在现有代码基础上做小程序适配、上线检查、功能补齐。

核心功能：

- 教材书架 / 切换教材
- 当前教材首页
- 点读页面
- 图片热区点读
- 音频播放
- 左右切换课本页
- 目录跳转
- 音标点读
- 字母点读
- 自然拼读
- 我的页面
- 免费时长 / 邀请 / 广告 / 会员预留流程
- 简易后台 H5 页面

## 2. 仓库与当前分支

GitHub 仓库：

```text
https://github.com/taptopnfc2026-stack/diandubao.git
```

当前工作分支：

```text
feature/diandu-h5-miniprogram-mvp
```

当前最新提交：

```text
以 origin/feature/diandu-h5-miniprogram-mvp 最新 HEAD 为准
```

接手后建议先基于当前分支继续开发，不要另起新架构。

## 3. 本地目录

项目根目录：

```text
/Users/xuan/Documents/Codex/2026-07-08/wo-y/work/diandubao
```

小程序源码目录：

```text
/Users/xuan/Documents/Codex/2026-07-08/wo-y/work/diandubao/miniprogram
```

H5 预览入口：

```text
/Users/xuan/Documents/Codex/2026-07-08/wo-y/work/diandubao/src/h5
```

后台 H5：

```text
/Users/xuan/Documents/Codex/2026-07-08/wo-y/work/diandubao/src/admin
```

共享逻辑：

```text
/Users/xuan/Documents/Codex/2026-07-08/wo-y/work/diandubao/src/shared
/Users/xuan/Documents/Codex/2026-07-08/wo-y/work/diandubao/miniprogram/utils
```

## 4. 启动与验证命令

安装依赖：

```bash
npm install
```

启动 H5 预览：

```bash
npm run dev:h5
```

默认本地预览：

```text
http://127.0.0.1:5175/
```

后台预览：

```text
http://127.0.0.1:5175/admin.html
```

免费时长弹窗预览：

```text
http://127.0.0.1:5175/?timeLimitPreview=1
```

测试：

```bash
npm test
```

H5 构建：

```bash
npm run build:h5
```

提交前至少跑：

```bash
npm test && npm run build:h5
```

## 5. 小程序打开方式

用微信开发者工具打开：

```text
miniprogram
```

注意：

- `miniprogram/project.config.json`
- `miniprogram/project.private.config.json`

这两个是微信开发者工具生成的本地配置，可能包含本地 AppID / 私有配置，当前没有提交到 GitHub。是否提交由项目负责人决定。

## 6. 线上接口

小程序接口基础域名在：

```text
miniprogram/utils/api.js
```

当前：

```js
const BASE_URL = 'https://diandu.xiongmaoxiazai.com';
```

H5 接口基础域名在：

```text
src/shared/api.js
```

当前：

```js
const MINI_BASE = 'https://diandu.xiongmaoxiazai.com';
const H5_BASE = import.meta.env.PROD ? MINI_BASE : '';
```

上线小程序前，必须在微信公众平台配置合法域名：

- request 合法域名：`https://diandu.xiongmaoxiazai.com`
- downloadFile 合法域名：教材图片 / 音频资源域名，尤其是 OSS 域名
- HTTPS 证书必须有效

## 7. 当前页面结构

小程序页面：

```text
miniprogram/pages/home/home          首页
miniprogram/pages/books/books        选择教材
miniprogram/pages/chapters/chapters  目录
miniprogram/pages/reader/reader      点读学习
miniprogram/pages/phonetics          音标列表
miniprogram/pages/phonetic-detail    音标详情
miniprogram/pages/alphabet           字母点读
miniprogram/pages/phonics            自然拼读列表
miniprogram/pages/phonics-detail     自然拼读详情
miniprogram/pages/my/my              我的
```

H5 页面主要在单文件：

```text
src/h5/main.js
src/h5/styles.css
```

后台：

```text
src/admin/main.js
src/admin/adminApi.js
src/admin/adminData.js
src/admin/admin.css
```

## 8. 目前已隐藏 / 暂缓功能

为了先上线，以下功能不要急着暴露：

- 同步背单词：已有部分代码，但入口已隐藏，后续优化后再上。
- 正式支付：当前会员开通是预留流程，不是真实微信支付。
- 正式激励广告：当前广告流程是预留/模拟，不是真实广告组件。
- 免费领英语资料：已从点读页底部删除。
- 观看记录：已从“我的”页面删除。

上线审核前，尤其要避免“看广告”“会员付费”表现得像真实交易但实际没有接通。

## 9. 最近关键改动记录

最近几个重要提交：

```text
9dc8f8b fix: align mini program home layout
e2b625b chore: hide reader promo and watch records
b60f6c3 feat: route expired time tasks
dfe3725 chore: add time limit prompt preview link
141ee32 feat: add free time expired prompt
```

含义：

- 小程序首页已做过一次适配，避免微信胶囊遮挡、音标卡片溢出。
- 点读页删除了“免费领英语资料”。
- 我的页删除了“观看记录”。
- 免费时长用完弹窗已做 H5 + 小程序版本。
- 免费时长弹窗按钮会进入任务页，不再直接加时长。

## 10. 后续小程序适配重点

CodeBuddy 接手后优先做这些：

1. 逐页对齐 H5 和小程序视觉

   H5 是目前比较完整的预览版本，小程序端部分页面仍可能存在样式差异。

2. 真机优先

   不要只看开发者工具模拟器。至少测试：

   - iPhone 刘海屏
   - 普通 Android
   - 大屏手机

3. 自定义导航要避开微信胶囊

   `app.json` 当前使用：

   ```json
   "navigationStyle": "custom"
   ```

   所以每个页面顶部都要自己处理：

   - 状态栏
   - 胶囊按钮区域
   - 标题不被遮挡

4. 按钮和 grid 必须防止横向溢出

   小程序 `button` 默认样式容易撑宽。常用处理：

   ```css
   button {
     box-sizing: border-box;
     min-width: 0;
   }
   ```

5. 点读页优先稳定

   上线核心是：

   - 教材图片能加载
   - 热区坐标准确
   - 音频能播放
   - 左右翻页稳定
   - 目录跳转稳定

6. 审核前不要新增复杂功能

   第一版目标是“能用、能审、少风险”。

## 11. 点读相关核心文件

小程序点读页：

```text
miniprogram/pages/reader/reader.js
miniprogram/pages/reader/reader.wxml
miniprogram/pages/reader/reader.wxss
```

热区计算：

```text
miniprogram/utils/coordinate.js
src/shared/coordinate.js
```

翻页逻辑：

```text
miniprogram/utils/navigation.js
src/shared/navigation.js
```

接口：

```text
miniprogram/utils/api.js
src/shared/api.js
```

## 12. 后台相关说明

后台 H5 地址：

```text
http://127.0.0.1:5175/admin.html
```

目前后台是简易版本，包含：

- 数据看板
- 用户管理
- 会员套餐
- 运营设置
- 订单管理

当前后台多数为 mock / 本地预览逻辑，真实上线还需要后端接口支持。

运营设置需要后续接后端：

- 新用户默认免费时长
- 邀请好友奖励时长
- 观看广告奖励时长

## 13. 已知注意事项

1. H5 和小程序不是同一套 UI 代码

   H5 在 `src/h5`，小程序在 `miniprogram/pages`。修改 H5 不会自动同步小程序。

2. 不要重构成 Flutter / UniApp

   当前上线目标是原生小程序 + H5 预览，继续增量开发。

3. 背单词模块先不要上线

   代码里可能还有 vocabulary 相关文件，但入口已隐藏。不要在首页重新露出。

4. 微信开发者工具生成的本地文件谨慎提交

   特别是：

   ```text
   miniprogram/project.private.config.json
   ```

5. 图片和音频多来自 OSS URL

   上线前必须确认资源域名在微信后台合法域名里配置，否则真机可能加载失败。

## 14. 建议下一步

上线前建议 CodeBuddy 先做：

1. 用微信开发者工具重新预览 `miniprogram`。
2. 真机扫码测试首页、点读页、我的页。
3. 检查所有接口请求是否通过合法域名。
4. 检查所有图片 / 音频是否能在真机播放。
5. 如果审核前不接真实支付/广告，就继续隐藏真实收费表达。
6. 上传体验版，内部扫码跑一遍完整流程。

## 15. 交接结论

当前项目可以继续作为“小程序上线 MVP”推进。

后续开发原则：

- 保持现有架构
- 不做大重构
- 先小程序真机适配
- 先保证点读主链路
- 会员、广告、背单词后置
- 每次改动后跑 `npm test && npm run build:h5`
