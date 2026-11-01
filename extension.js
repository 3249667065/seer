// game.import(name: "赛尔计划",用于诗笺版快捷导入识别扩展名
import { lib, game, ui, get, ai, _status } from "noname"
import { precontent } from "./main/precontent.js"
import { content } from "./main/content.js"
import { Package } from "./main/package.js"
import { config, help, files } from "./main/config.js"

export let type = "extension"

export default async function () {
    let extension = {
        name: "赛尔计划",
        editable: false,
        content: content,
        precontent: precontent,
        config: config,
        help: help,
        package: Package,
        files: files
    }
    return extension
}