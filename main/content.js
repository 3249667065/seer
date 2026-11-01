import { lib, game, ui, get, ai, _status } from "noname";
import update from "../update.js";
import { EXTENSION_VERSION } from "../version.js";

export async function content(config, pack) {
    // 启动时自动检查更新（可在扩展设置里关闭）；不阻塞游戏加载
    if (lib.config.extension_赛尔计划_auto_update) {
        update(false, EXTENSION_VERSION).catch((e) => console.warn("赛尔计划：自动检查更新失败", e));
    }
}