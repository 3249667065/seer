# 赛尔计划 · 无名杀扩展

- 当前版本：1.0.2
- 安装：把本仓库内容放到 `无名杀/resources/app/extension/赛尔计划/`（文件夹名必须是「赛尔计划」）
- 在线更新：游戏内「扩展 → 赛尔计划 → 检查更新」，更新源为本仓库（下载走 tvv.tw 镜像）
- 发布：修改 `version.js` 版本号 → `node genManifest.js --note "更新说明"` → 上传改动文件与 `manifest.json`

`manifest.json` 记录每个文件的 SHA-1，更新器只会下载有变化的文件。
