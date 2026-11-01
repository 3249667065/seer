import { lib, game, ui, get, ai, _status } from "noname";
import update from "../update.js";
import { EXTENSION_VERSION } from "../version.js";

export const config = {
    version_display: {
        name: `<span style="color:#ffa348">当前版本：v${EXTENSION_VERSION}</span>`,
        clear: true,
        onclick: function () {
            alert(`《赛尔计划》当前版本 v${EXTENSION_VERSION}\n下方「检查更新」可获取最新版本`);
        },
    },
    update_repo: {
        name: `<span style="color:#ff9800;text-decoration: underline">更新源地址`,
        clear: true,
        onclick: function () {
            const old = lib.config.extension_赛尔计划_update_repo || "";
            const value = prompt("请输入更新源根目录（留空则使用内置默认地址）\n例如：https://raw.githubusercontent.com/用户名/仓库/refs/heads/main", old);
            if (value === null) return;
            game.saveConfig("extension_赛尔计划_update_repo", value.trim());
            alert(value.trim() ? "已保存更新源：" + value.trim() : "已清空，将使用内置默认地址");
        },
    },
    update_source: {
        name: `<font color="#9c27b0">更新镜像源`,
        init: "3",
        item: {
            0: "GitHub官方源(直连)",
            1: "gh-proxy全球镜像",
            2: "gh-proxy国内镜像",
            3: "tvv.tw镜像源",
        },
    },
    update_method: {
        name: `<font color="#2196f3">极速更新`,
        init: false,
        intro: "开启后，在线更新将跳过图片等大文件，仅更新 .js 和 .css 代码文件，显著加快更新速度。",
    },
    auto_update: {
        name: `<font color="#e91e63">自动检测更新`,
        init: true,
        intro: "启动游戏时自动检查更新（需要先配置更新源地址）",
    },
    check_update: {
        name: `<span style="color:#4caf50;text-decoration: underline">检查更新`,
        clear: true,
        onclick: async function () {
            this.innerHTML = `<span style="color:#f61515ff;text-decoration: underline">正在检测更新...`;
            try {
                await update(true, EXTENSION_VERSION);
                this.innerHTML = `<span style="color:#4caf50;text-decoration: underline">检查完成`;
            } catch {
                this.innerHTML = `<span style="color:#f44336;text-decoration: underline">更新失败`;
            }
            setTimeout(() => {
                this.innerHTML = `<span style="color:#4caf50;text-decoration: underline">检查更新`;
            }, 2000);
        },
    },
}

export const help = {

}
export const files = {
    "character": [], "card": [], "skill": []
}