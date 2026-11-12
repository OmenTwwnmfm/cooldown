# 把「冷静一下」打包成 APK

工程骨架已经建好了，你只需要跑构建。

```
冷静一下/
├── spend-guard.html          ← 应用本体，唯一需要改的文件
├── app/
│   ├── package.json          ← Capacitor 依赖
│   ├── capacitor.config.json ← 应用名、包名、WebDAV 跨域开关
│   └── www/                  ← 构建时把 html 复制到这里
└── .github/workflows/build-apk.yml  ← 云端自动打包
```

`capacitor.config.json` 里已经开好了两件关键的事：

- `"CapacitorHttp": { "enabled": true }` —— App 内部的请求走原生 HTTP，**不受浏览器跨域限制**，WebDAV 直连坚果云就行，设置里的「中转地址」可以留空。
- `"server": { "androidScheme": "https" }` —— WebView 走 `https://localhost`，localStorage 不会被当成不安全来源。

---

## 路线 A：GitHub Actions 打包（不装 Android Studio）

适合只是想要一个能装的 APK。

1. 在 GitHub 建一个仓库（私有仓库也能用 Actions，免费额度够）。
2. 把这个文件夹推上去：

```bash
cd "D:\AAAAA_Data\desktop\code\冷静一下"
git init
git add .
git commit -m "冷静一下"
git branch -M main
git remote add origin https://github.com/你的用户名/cooldown.git
git push -u origin main
```

3. 推上去后打开仓库的 **Actions** 页，`build-apk` 会自动跑。第一次大约 6–10 分钟（要下 Gradle 和 Android SDK），之后有缓存会快很多。
4. 跑完点进这次运行，页面底部 **Artifacts** 下载 `cooldown-debug-apk.zip`，解压得到 `app-debug.apk`。
5. 传到手机，点开安装（首次要允许「安装未知来源应用」）。

以后改了 `spend-guard.html`，`git push` 一次就自动出新 APK，不需要动别的。

想手动触发：Actions → build-apk → Run workflow。

---

## 路线 B：本地打包

需要两样东西：

| 东西 | 版本 | 说明 |
|---|---|---|
| JDK | **21** | Capacitor 7 必须 JDK 21，JDK 17 会直接编译失败 |
| Android Studio | 最新版 | 装它主要是为了带 Android SDK |

装完确认：

```bash
java -version     # 要显示 21.x
```

然后：

```bash
cd "D:\AAAAA_Data\desktop\code\冷静一下\app"

# 1. 装依赖
npm install

# 2. 把应用本体放进 www
mkdir www
copy ..\spend-guard.html www\index.html

# 3. 生成安卓工程（只需一次，之后 android\ 目录会一直保留）
npx cap add android

# 4. 同步网页与原生配置（每次改完 html 都要跑）
npx cap sync android

# 5. 编译
cd android
gradlew.bat assembleDebug
```

产物：

```
app\android\app\build\outputs\apk\debug\app-debug.apk
```

以后只改了 html 的话，重复第 2、4、5 步就行。

想用 Android Studio 直接跑：`npx cap open android`，然后按绿色三角。

---

## 图标和启动图

默认图标是 Capacitor 的。换自己的：

```bash
cd app
npm i -D @capacitor/assets
# 准备两张图放进去：
#   resources/icon.png    1024×1024，透明背景 PNG
#   resources/splash.png  2732×2732，中间留出安全区
npx capacitor-assets generate --android
npx cap sync android
```

`icon.png` 用你那个陶土色盾牌就行，四周留 10% 空白，安卓的圆角遮罩会切掉边缘。

---

## 正式签名（想长期用、想发出去才需要）

Debug APK 能装能跑，但签名是调试证书，不适合分发，也不能上应用商店。自己长期用其实够。要正式签名：

```bash
cd app
keytool -genkey -v -keystore cooldown.keystore -alias cooldown -keyalg RSA -keysize 2048 -validity 36500
```

记好密码，`cooldown.keystore` **务必自己留一份**——丢了就没法给已安装的用户更新了。

```bash
npx cap build android --androidreleasetype APK ^
  --keystorepath cooldown.keystore ^
  --keystorealias cooldown ^
  --keystorepass 你的密码 ^
  --keystorealiaspass 你的密码
```

产物在 `app\android\app\build\outputs\apk\release\`。

---

## 装到手机上要知道的三件事

1. **数据存在 App 的 WebView 里，卸载就没了。** 装之前先去设置页同步一次，或者导出备份。升级安装（同包名覆盖）不会丢。
2. **包名 `com.cooldown.app` 一旦装了就不要再改**，改了会被当成另一个应用，两个并存、数据不通。
3. **返回键已经处理了**：在清单或设置页按返回，先回换算页；在换算页再按一次才退出。

---

## 常见报错

| 报错 | 原因 |
|---|---|
| `Unsupported class file major version` / `invalid source release: 21` | JDK 版本不对，换 JDK 21，并确认 `JAVA_HOME` 指向它 |
| `SDK location not found` | 没找到 Android SDK。装 Android Studio 后设 `ANDROID_HOME`，或在 `app\android\local.properties` 写 `sdk.dir=D:\\Android\\Sdk` |
| `npx cap add android` 报 webDir 不存在 | 先把 html 复制到 `app\www\index.html` 再跑 |
| Gradle 卡在 `Downloading` | 首次要下 1GB 以上依赖，等着，或者挂代理。国内可换阿里云 Gradle 镜像 |
| 中文路径偶发报错 | 整个项目挪到纯英文路径，比如 `D:\build\cooldown` |
| 装的时候提示「应用未安装」 | 手机上已装了包名相同但签名不同的旧版本，先卸载旧的 |

---

## 另一个不用 Node 的路子（不推荐）

[PWABuilder](https://www.pwabuilder.com/) 可以把一个网址直接打成 APK（TWA 方式）。但要求先把页面用 HTTPS 托管出去，而且它本质还是浏览器内核，**WebDAV 依然受跨域限制**——等于放弃了你现在这套直连方案。只在你连 Node 都不想装、也不用同步的情况下值得考虑。
