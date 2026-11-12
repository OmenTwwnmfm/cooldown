# 冷静一下

一个「先换算，再决定」的消费冲动拦截器。输入想买的东西和价格，它告诉你：这要工作多久、占月薪多少、相当于多少个鸡蛋、几顿饭、把攒钱目标推迟多少天。

## 三个页面

- **换算**：价格 → 工作时长 / 月薪占比 / 攒钱进度推迟 / 物品等价物；超月薪 5% 亮警告
- **冷静清单**：放进去的东西要等冷静期过完才能「决定买了」（还得按住 3 秒），随时可以「不买了」
- **设置**：月薪、工作天数、攒钱目标、冷静期时长、物品价格库、WebDAV 同步、数据备份

## 直接在手机浏览器里用

打开 `spend-guard.html` 即可，数据存在本机 localStorage。用 Chrome/Safari 打开后「添加到主屏幕」，可以当 App 用（需要 https 或 localhost 才能装）。

## 打包成安卓 APK

见 [打包APK.md](打包APK.md)。推到 GitHub 后由 Actions 自动编译，产物在 Actions 页面的 Artifacts 里下载。

## 目录

```
spend-guard.html      全部界面与逻辑（单文件，无依赖）
manifest.json         PWA 清单
sw.js                 Service Worker（离线缓存）
icon-1024.png         图标
app/                  Capacitor 壳工程配置
.github/workflows/    自动打包 APK 的工作流
```

## 数据

- 本机：localStorage，键名 `coinguard.v1`
- 备份：设置 → 导出备份（JSON）
- 多设备：设置 → 同步（WebDAV），支持坚果云 / Nextcloud / 群晖
