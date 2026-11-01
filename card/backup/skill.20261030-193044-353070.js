import { lib, game, ui, get, ai, _status } from "noname";

/** @type { importCardConfig['skill'] } */
const skill = {
//#noname-kit-begin skill:seer_mohe_skill
    seer_mohe_skill: {
        equipSkill: true,
        initList() {
            _status.seer_mohe_skill_list ??= ["sha", "shan"];
            return _status.seer_mohe_skill_list;
        },
        enable: "chooseToUse",
        hiddenCard(player, name) {
            if (get.type(name) != "basic" && get.type(name) != "trick") {
                return false;
            }
            const list = lib.skill.seer_mohe_skill.initList();
            return list.includes(name);
        },
        filter(event, player) {
            return get
                .inpileVCardList(info => {
                    const name = info[2];
                    if (get.type(name) != "basic" && get.type(name) != "trick") {
                        return false;
                    }
                    return (event.seer_mohe_skill || []).includes(name);
                })
                .some(card => event.filterCard(get.autoViewAs({ name: card[2], nature: card[3] }, "unsure"), player, event));
        },
        onChooseToUse(event) {
            if (!game.online && !event.seer_mohe_skill) {
                const list = lib.skill.seer_mohe_skill.initList();
                event.set("seer_mohe_skill", list);
            }
        },
        chooseButton: {
            dialog(event, player) {
                const list = get
                    .inpileVCardList(info => {
                        const name = info[2], nature = info[3];
                        if (nature) return false;
                        if (get.type(name) != "basic" && get.type(name) != "trick") {
                            return false;
                        }
                        return (event.seer_mohe_skill || []).includes(name);
                    })
                    .filter(card => event.filterCard(get.autoViewAs({ name: card[2], nature: card[3] }, "unsure"), player, event));
                const dialog = ui.create.dialog("墨鹤", [list, "vcard"]);
                dialog.direct = true;
                return dialog;
            },
            check(button) {
                if (get.event().getParent().type != "phase") {
                    return 1;
                }
                return get.event().player.getUseValue({
                    name: button.link[2],
                });
            },
            backup(links, player) {
                return {
                    viewAs: {
                        name: links[0][2],
                    },
                    filterCard(card) {
                        return get.skillsFromEquips([card]).includes("seer_mohe_skill");;
                    },
                    ai1(card) {
                        return 10 - get.value(card);
                    },
                    position: "e",
                    log: false,
                    async precontent(event, trigger, player) {
                        player.logSkill("seer_mohe_skill");
                        game.broadcastAll(
                            list => {
                                lib.skill.seer_mohe_skill.initList();
                                _status.seer_mohe_skill_list.removeArray(list);
                                game.log("#g墨鹤", "移除了牌名", "#y" + get.translation(list));
                            },
                            [event.result.card.name]
                        );
                    },
                };
            },
            prompt(links, player) {
                return "将一张牌当作" + get.translation(links[0][3] || "") + "【" + get.translation(links[0][2]) + "】使用";
            },
        },
        ai: {
            respondSha: true,
            respondShan: true,
            skillTagFilter(player, tag, arg) {
                if (arg == "respond") {
                    return false;
                }
                const name = tag == "respondSha" ? "sha" : "shan";
                return get.info("seer_mohe_skill").hiddenCard(player, name);
            },
            result: {
                player(player) {
                    if (_status.event?.dying) {
                        return get.attitude(player, _status.event.dying);
                    }
                    return 1;
                },
            },
        },
        group: ["seer_mohe_skill_record"],
        subSkill: {
            record: {
                equipSkill: true,
                trigger: {
                    player: "useCardAfter",
                },
                forced: true,
                locked: false,
                filter(event, player) {
                    // 装备【墨鹤】的瞬间，本触发器会被引擎“补登记”到当时正在结算的那张牌上，
                    // 而那张牌结算时墨鹤还没装备，不应记名；妙笔会在那张牌上打跳过标记
                    if (!event.card || event._seer_mohe_skip) {
                        return false;
                    }
                    return true;
                },
                async content(event, trigger, player) {
                    // 同一张牌只记一次名，防止重复触发
                    if (trigger._seer_mohe_recorded) {
                        return;
                    }
                    trigger._seer_mohe_recorded = true;
                    const list = lib.skill.seer_mohe_skill.initList();
                    const pool = lib.inpile.filter(name => {
                        return !list.includes(name) && ["basic", "trick"].includes(get.type(name));
                    });
                    if (!pool.length) {
                        return;
                    }
                    // 随机先定，再广播（联机时各端必须拿到同一个牌名）
                    const name = pool.randomGet();
                    game.broadcastAll(n => {
                        lib.skill.seer_mohe_skill.initList();
                        if (!_status.seer_mohe_skill_list.includes(n)) {
                            _status.seer_mohe_skill_list.push(n);
                        }
                        game.log("#g墨鹤", "增加了牌名", "#y" + get.translation(n));
                    }, name);
                },
            },
            backup: {},
        },
    },
//#noname-kit-end skill:seer_mohe_skill
};

export default skill;
