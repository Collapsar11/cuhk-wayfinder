# Android 安装包

下载：[GitHub Releases](https://github.com/Collapsar11/cuhk-wayfinder/releases/latest)。选择 `cuhk-wayfinder-1.0.0.apk`；旁边的 `SHA256SUMS.txt` 可核验下载完整性。

- 应用名：中大寻路；包名：`io.github.collapsar11.cuhkwayfinder`。
- 最低 Android 8.0（API 26），建议保持 Android System WebView 为较新版本以支持 3D 地图。
- 同一个 APK 可用于 ARM64、ARMv7 和 x86/x86_64；应用不附带架构专用原生库，地图由设备的系统 WebView 渲染。
- 地点、校巴、楼宇、地形、步行路网和字体随包附带。首次打开不需下载校园资源。
- 仅点击定位按钮时请求前台位置权限；拒绝后仍可手动选择起终点。不申请后台位置或文件存储权限。
- Google Maps、来源网页等链接在外部应用打开，需要网络。复制路线生成可在浏览器打开的公开网站链接，不包含 GPS 坐标。
- APK 是独立发布版本。网页更新不会自动修改已经安装的 APK；更新需要安装新版本。

## 实现

使用 Android 原生 WebView 与 [WebViewAssetLoader](https://developer.android.com/develop/ui/views/layout/webapps/load-local-content) 从 APK 资产提供本地 HTTPS 页面。禁用文件 URL 访问和明文混合内容；外部网页不进入带有复制接口的内部 WebView。

Android 构建使用 `/app/` 资源路径和 `VITE_ANDROID=true`；网页的 GitHub Pages 构建继续使用 `/cuhk-wayfinder/`。原生版不注册网页 Service Worker，避免旧网页缓存覆盖新版 APK 内置文件。返回键依次关闭地图、地点详情、展开的路线或返回探索页；探索首页再按返回使应用退到后台。

## 复现构建

需要 Node.js 22.12+、Python 3、JDK 21+（本次为 Android Studio 自带 JDK 25）、Android SDK `platforms;android-37.0` 与 `build-tools;36.0.0`。Gradle Wrapper 固定 9.5.0 和官方 SHA-256，AGP 固定 9.3.2，AndroidX WebKit 固定 1.17.1。

```sh
npm ci
export ANDROID_HOME=/path/to/Android/sdk
export JAVA_HOME=/path/to/jdk
npm test
npm run android:release
```

macOS 如未设置变量，脚本默认使用 `~/Library/Android/sdk` 和 `/Applications/Android Studio.app/Contents/jbr/Contents/Home`。

脚本先编译网页到 `dist-android/`，复制资产，运行 Android 单元测试与 release lint，构建 debug/release，然后对齐、签名并验证 release APK。输出位于 `releases/android-v1.0.0/`。调试版本的包名带 `.debug`，不会覆盖正式安装。

## 签名与后续更新

本地 `.signing/cuhk-wayfinder-release.p12` 和 `.signing/store-password` 是正式版签名材料，目录权限 0700、文件权限 0600，已被 Git 忽略。请独立备份整个 `.signing/`；后续更新必须使用同一密钥，否则无法覆盖安装并保留收藏。这些文件不会上传 GitHub。

正式签名证书 SHA-256：

```text
c54db19218721572065ea53506fbdd670f19903c20fc64218a27c2e089158802
```

升版时同时更新 `package.json` 版本及 `android/app/build.gradle` 中的 `versionName`，递增 `versionCode`。原生源码跟随 `main`，网站产物继续位于 `gh-pages`，APK 和校验和作为 GitHub Release 附件发布。

## 验证记录（2026-10-01）

- 网页路线与数据测试 45 项通过；原生链接隔离单元测试 3 项通过；Android release lint 无错误；APK 对齐与 v2/v3 签名校验通过。
- Android 15 ARM64 模拟器（硬件 GPU）上的 debug APK：断网首次启动和重载、3D 地图、环回东搜索、18 类校巴、PGH1 经环回东搭 8 号线到敬文、非教学日 8 号线、卡片展开收起、系统返回、原生复制并实际粘贴公开路线链接均通过。
- 定位只在点击后弹出权限申请；拒绝仍可手动规划；授权后可取得模拟器注入的校园 GPS 坐标。外部链接在 Chrome 打开，返回后原应用页面保留。
- 最终正式签名 APK 覆盖安装成功；断网打开首页、3D 地图和系统返回通过；发布包未启用调试。截图：[首页](screenshots/android-home.png)、[地图](screenshots/android-map.png)。
- 首轮 SwiftShader 软件 GPU 测试在图形绘制同步处发生一次 ANR；更换为宿主硬件 GPU 后同一 APK 的上述检查通过，未发现新的 ANR 或崩溃。尚未在实体手机实测。

复查已启动的独立模拟器（会清除并重新安装 `.debug` 测试应用，禁用该模拟器网络）：

```sh
ANDROID_SERIAL=emulator-5580 node scripts/verify-android.mjs
```

大体积镜像及下载包保存于 `/Volumes/H/cuhk-wayfinder/android-test/`。该盘为 exFAT，无法提供模拟器使用的硬链接文件锁，故运行锁与临时写入状态放在 `/tmp/cuhk-android-avd/`。
