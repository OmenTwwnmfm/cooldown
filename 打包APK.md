# 打包安卓 APK（GitHub Actions 云端编译）

不用装 Android Studio、不用装 JDK、不用在自己电脑上编译。把代码推到 GitHub，它替你编译，你只负责下载 APK。

预计耗时：首次 10–15 分钟（要下载 Gradle 和依赖），之后每次 5–8 分钟。

---

## 0. 你需要准备的

| 东西 | 说明 |
| --- | --- |
| GitHub 账号 | 免费注册 |
| Git for Windows | https://git-scm.com/download/win ，一路下一步 |
| 仓库可见性 | 公开：Actions 无限免费；私有：每月 2000 分钟免费（一次构建约 8 分钟，够用 200 次） |

不想碰命令行的话，装 **GitHub Desktop**（https://desktop.github.com ）代替第 1、2 步，登录、Add local repository、Publish，全程点鼠标。

---

## 1. 在本机把项目变成 git 仓库

打开 PowerShell（不是 CMD），进到项目目录：

```
cd D:\AAAAA_Data\desktop\code\冷静一下
```

> Windows 自带的是 PowerShell 5.1，**不支持 `&&` 连着写**，下面每行单独回车。

第一次用 git 的话先报个名字（只需一次）：

```
git config --global user.name "你的名字"
```

```
git config --global user.email "你的邮箱"
```

然后初始化：

```
git init
```

```
git add .
```

```
git commit -m "冷静一下：首版"
```

```
git branch -M main
```

---

## 2. 在 GitHub 建仓库并推上去

1. 打开 https://github.com/new
2. **Repository name** 填 `cooldown`（建议用英文，中文名会让网址变成一长串 `%E5%86%B7...`）
3. 可见性选 **Public**（想私有也行，见上表）
4. **不要**勾 "Add a README file"、".gitignore"、license——仓库必须是空的，否则推送会冲突
5. 点 **Create repository**

回到 PowerShell，把 `<你的用户名>` 换成你的 GitHub 用户名：

```
git remote add origin https://github.com/<你的用户名>/cooldown.git
```

```
git push -u origin main
```

### 推送时会让你输账号密码

**密码不能填 GitHub 登录密码**（2021 年起就禁了），要用 Personal Access Token：

1. GitHub 右上角头像 → **Settings**
2. 左侧最下面 → **Developer settings**
3. **Personal access tokens** → **Tokens (classic)**
4. **Generate new token (classic)**
5. Note 填 `cooldown`，Expiration 选 90 days，勾选第一个 **`repo`**
6. 拉到底点 **Generate token**，复制那串 `ghp_` 开头的字符（**只显示这一次**）

推送时：
- `Username:` 填你的 GitHub 用户名
- `Password:` 粘贴 token（输入时不显示字符，是正常的）

---

## 3. 等它自动编译

推上去之后，GitHub 会自动开始编译（工作流文件 `.github/workflows/build-apk.yml` 已经在仓库里）。

1. 打开仓库页面 → 顶部 **Actions** 标签
2. 左边选 **build-apk**，右边会出现一条正在跑的记录（黄点）
3. 点进去看进度，一共 9 步：拉代码 → Node 20 → JDK 21 → Android SDK → 装依赖 → 放进 www → 生成 android 工程 → 编译 Debug APK → 上传 APK
4. 等到变成**绿色对勾**（约 5–15 分钟）

第一次跑会在 Gradle 下载上耗掉大半时间，之后就快了。

> 以后每次 `git push` 到 main 分支都会**自动重新编译**，不用手动点。

---

## 4. 下载并装到手机

1. 在绿色的那次运行页面，往下滚到底部 **Artifacts** 区域
2. 点 **cooldown_v年月日时分** 下载（每次构建用当时的时间命名，比如 `cooldown_v202611121725`；下载需要登录 GitHub）
3. 解压，里面是 `cooldown_v202611121725.apk`，**文件名就是版本号**
4. 传到手机：微信/QQ 发给自己、数据线拷贝、或者网盘
5. 手机上点开 apk → 系统提示「未知来源」→ 允许安装

装好之后叫「冷静一下」，图标是你那张盾牌。设置页最底下那行写的就是当前版本号（例如 `v202611121725`），装了新版可以对一下。

> 产物路径（如果你在本地编译）：`app/android/app/build/outputs/apk/debug/app-debug.apk`；云端构建会自动改名成 `cooldown_v<版本号>.apk`
> Actions 的 Artifacts 默认保留 **90 天**，过期就重新跑一次构建。

---

## 5. 以后改了代码怎么更新

改完 `spend-guard.html`：

```
git add .
```

```
git commit -m "加了冲动热力图"
```

```
git push
```

等 Actions 跑完，重新下载安装。

### ⚠️ 这里有个坑：每次构建的签名都不一样

GitHub 的构建机器是全新的，每次都会现场生成一个调试密钥。结果是：**新版本覆盖安装会失败**，提示「应用未安装」或「签名不一致」。

唯一的绕法是先卸载旧版——但**卸载会清空 App 里的全部数据**（localStorage 跟着应用一起没）。

两个对策：

**A. 更新前先备份（省事，但麻烦）**
1. 打开 App → 设置 → **导出备份**，把 JSON 存到手机文件里
2. 卸载 → 装新版 → 设置 → **导入备份**
3. 或者配好 WebDAV 同步，卸载前同步一次，装完再同步下来

**B. 固定签名（一次配置，以后可以直接覆盖安装，数据不丢）**

需要本机有 JDK（装 Android Studio 会自带，或装 Adoptium Temurin 21）。

> **本机没有 JDK？** 跳过第 1 步，改用云端生成：GitHub → Actions → 左侧 `make-keystore` → Run workflow → 跑完下载 `cooldown-keystore` 压缩包 → 解压出 `cooldown.jks` 放进 `app\` → 从第 2 步（提交）继续。用完记得删掉 `.github/workflows/make-keystore.yml`，避免以后误跑把密钥换掉。

1. 在项目根目录生成密钥库（一行命令，密码自己换掉，记住它）：

```
keytool -genkeypair -v -keystore app\cooldown.jks -storetype JKS -alias cooldown -keyalg RSA -keysize 2048 -sigalg SHA256withRSA -validity 36500 -storepass cooldown123 -keypass cooldown123 -dname "CN=Cooldown, OU=Self, O=Self, L=NA, ST=NA, C=CN"
```

2. 把它提交进仓库（`.gitignore` 没有排除 `.jks`）：

```
git add app/cooldown.jks
```

```
git commit -m "固定签名"
```

3. 在 `.github/workflows/build-apk.yml` 里，**「生成 android 工程并同步」这一步的下面**插入一段：

```yaml
      - name: 固定签名
        working-directory: app
        run: |
          printf '\nandroid {\n  signingConfigs {\n    debug {\n      storeFile file("../../cooldown.jks")\n      storePassword "cooldown123"\n      keyAlias "cooldown"\n      keyPassword "cooldown123"\n    }\n  }\n}\n' >> android/app/build.gradle
```

4. 推上去。从此每次构建的签名一致，新版可以直接覆盖安装，数据保留。

> 这个 keystore 会跟着仓库公开。它只用于你自己装这个 App，**不要拿它去签任何要上架到应用商店的包**。真要上架，用 `npx cap build android --androidreleasetype AAB` 配一套独立的正式签名。

---

## 6. 常见报错对照

| 现象 | 原因 | 怎么办 |
| --- | --- | --- |
| Actions 里没有 build-apk | `.github/workflows/` 没推上去（隐藏目录漏了） | `git ls-files .github` 确认有没有文件；没有就 `git add .github` 再推 |
| `Unsupported class file major version` | JDK 版本不对 | 工作流里 JDK 必须是 21（Capacitor 7 的硬要求），不要改成 17 |
| `Failed to install the following SDK components` | SDK 平台缺失且未接受协议 | 工作流里保留 `android-actions/setup-android@v3` 这一步 |
| `npx cap add android` 报错 | 依赖没装完或 Node 版本过低 | 确认 `npm install` 那步是绿的；Node 必须是 20 |
| 构建成功但 Artifacts 是空的 | 没产出 apk | 看最后一步日志，通常是 Gradle 报错但被 `--no-daemon` 掩盖了 |
| 手机提示「应用未安装」 | 签名不一致（见上一节） | 卸载旧版，或做固定签名 |
| 更新后数据没了 | 卸载清空了 localStorage | 靠导出备份 / WebDAV 同步找回 |

---

## 7. APK 版和网页版的区别

| 能力 | 网页版（PWA） | APK |
| --- | --- | --- |
| WebDAV 同步 | 受浏览器跨域限制，**要填中转地址** | `CapacitorHttp` 走原生请求，**直接填服务器地址就行** |
| 离线打开 | 需要 https + Service Worker | 本来就在本地 |
| 返回键 | 浏览器自己的 | 已接管：在非首页按返回回到首页，首页再按一次退出 |
| 振动 | 安卓 Chrome 支持 | 支持 |
| 状态栏 | 浏览器 | 米色状态栏 + 深色图标 |
