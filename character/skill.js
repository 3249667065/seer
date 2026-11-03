import { lib, game, ui, get, ai, _status } from "noname";

/** @type { importCharacterConfig["skill"] } */
const skills = {
    //奥菲利娅
//#noname-kit-begin skill:seer_xingming
    seer_xingming: {
        // 每回合限一次
        usable: 1,
        getList: ["damage", "recover", "draw", "discard"],
        init(player, skill) {
            if (player.storage[skill]) {
                return;
            }
            const list = lib.skill[skill].getList.slice();
            player.setStorage(skill, new Map());
            player.storage[skill].set("list", list);
            for (const name of list) {
                player.storage[skill].set(name, 1);
            }
            get.info("seer_xingming").updateTip(player);
        },
        updateTip(player) {
            let skill = "seer_xingming";
            let map = player.getStorage(skill, new Map());
            let list = map.get("list");
            const translation = function(key, value) {
                return lib.skill[`${skill}_${key}`][value];
            };
            let arr = [];
            for (let name of list) {
                arr.push(`${lib.skill[`${skill}_${name}`].name}${map.get(name)}`);
            }
            player.addTip(skill, get.translation(skill) + " " + arr.join(""));
        },
        trigger: {
            global: ["damageEnd", "recoverAfter", "gainAfter", "loseAfter", "loseAsyncAfter"],
        },
        getIndex(event, player, name) {
            const map = player.getStorage("seer_xingming", new Map());
            if (["damage", "recover"].includes(event.name)) {
                if (map.get(event.name) == event.num) {
                    return [event.player];
                }
                return [];
            }
            if (event.type == "discard" && event.getlx !== false) {
                return game.filterPlayer(target => {
                    return event.getl && event.getl?.(target)?.cards2?.length == map.get("discard");
                });
            }
            if (event.getParent().name == "draw") {
                return game.filterPlayer(target => {
                    return event.getg && event.getg(target)?.length == map.get("draw");
                });
            }
            return [];
        },
        filter(event, player, triggername, target) {
            let level;
            if (["damage", "recover"].includes(event.name)) {
                level = 1;
            } else {
                level = event.getParent().name == "draw" ? 2 : 3;
            }
            if (event.getParent(level).name == "seer_xingming") {
                return false;
            }
            return target && target.isIn();
        },
        logTarget(event, player, triggername, target) {
            return target;
        },
        async cost(event, trigger, player) {
            const target = event.indexedData;
            let name = trigger.name;
            switch (trigger.name) {
                case "gain": {
                    name = "draw";
                }
                break;
                case "lose": {
                    name = "discard";
                }
                break;
                case "loseAsync": {
                    if (trigger.type === "discard" && trigger.getlx === false) {
                        name = "discard";
                    } else {
                        name = "draw";
                    }
                }
                break;
            }
            const map = player.getStorage(event.skill, new Map());
            const info = map.get("list");
            const index = info.indexOf(name);
            const idx = ((index + 1) < info.length ? (index + 1) : 0);
            const next = info[idx];
            const num = map.get(next);
            event.result = await player
                .chooseBool(get.prompt(event.skill, target), `令其${lib.skill[`${event.skill}_${next}`].description}`.replace(/#/g, num))
                .set("ai", () => {
                    return _status.event.goon;
                })
                .set(
                    "goon",
                    (() => {
                        const att = get.attitude(player, target);
                        switch (name) {
                            case "damage": {
                                return get.damageEffect(target, player, player) > 0;
                            }
                            case "recover": {
                                return get.recoverEffect(target, player, player) > 0;
                            }
                            case "draw": {
                                return get.effect(target, { name: "draw" }, player, player) > 0;
                            }
                            case "discard": {
                                return att <= 0;
                            }
                        }
                    })()
                )
                .forResult();
            event.result.cost_data = name;
        },
        async content(event, trigger, player) {
            const target = event.targets[0];
            const current = event.cost_data;
            const map = player.getStorage(event.name, new Map());
            const info = map.get("list");
            const index = info.indexOf(current);
            const idx = (index + 1 < info.length ? index + 1 : 0);
            const next = info[idx];
            const num = map.get(next);
            switch (next) {
                case "discard": {
                    await target.chooseToDiscard("he", num, true);
                }
                break;
                default: {
                    await target[next](num);
                }
            }
            info[index] = next;
            info[idx] = current;
            player.storage[event.name].set("list", info);
            get.info("seer_xingming").updateTip(player);
        },
        mark: true,
        intro: {
            content(storage, player) {
                const map = player.getStorage("seer_xingming", new Map());
                let str = "";
                for (const [name, num] of map) {
                    if (name == "list") {
                        continue;
                    }
                    str += `<br><li>${get.translation(`seer_xingming_${name}`)}-${num}`;
                }
                return str;
            },
        },
        subSkill: {
            damage: {
                name: "受伤",
                description: "受到#点伤害",
            },
            recover: {
                name: "回复",
                description: "回复#点体力",
            },
            draw: {
                name: "摸",
                description: "摸#张牌",
            },
            discard: {
                name: "弃",
                description: "弃#张牌",
            },
        },
    },
//#noname-kit-end skill:seer_xingming
//#noname-kit-begin skill:seer_yisong
    seer_yisong: {
        trigger: {
            player: "phaseBegin",
        },
        limited: true,
        async content(event, trigger, player) {
            player.awakenSkill(event.name);
            const map = player.getStorage("seer_xingming", new Map());
            const storage = player.storage.seer_xingming;
            const info = map.get("list");
            const list = info.slice().map(function (i, index) {
                return [index + 1, "", i];
            });
            const next = player.chooseToMove("遗颂：调整“星明”序号顺序");
            next.set("listx", list);
            next.set("list", [
                [
                    "", 
                    [
                        list,
                        (item, type, position, noclick, node) => {
                          let showCard = [item[0], item[1], `seer_xingming_${item[2]}`];
                          node = ui.create.buttonPresets.vcard(showCard, type, position, noclick);
                          node.node.info.innerHTML = `<span style = "color:#ffffff">${item[0]}</span>`;
                          node.node.info.style["font-size"] = "20px";
                          node._link = node.link = item;
                          node._customintro = (uiintro) => {
                            uiintro.add(get.translation(`seer_xingming_${node._link[2]}`));
                            return uiintro;
                          };
                          return node;
                        }
                    ]
                ],
            ]);
            next.set("processAI", () => {
                const player = get.player();
                const list = get.event().listx.slice();
                return list.randomSort();
            });
            const result = await next.forResult();
            if (result) {
                const list = result.moved[0].map(i => i[2]);
                player.storage.seer_xingming.set("list", list);
                get.info("seer_xingming").updateTip(player);
                const map = player.getStorage("seer_xingming", new Map());
                const storage = player.storage.seer_xingming;
                const info = map.get("list");
                const choices = info.map(i => get.translation(`seer_xingming_${i}`))
                const result2 = await player
                    .chooseControl(choices)
                    .set("prompt", "执行其中一项并令该项数值+1")
                    .set("ai", () => {
                        const controls = _status.event.controls.slice();
                        controls.remove("damage");
                        return controls[get.rand(0, control.length - 1)];
                    })
                    .forResult();
                const index = result2.index;
                const effect = info[index];
                if (storage.has(effect)) {
                    storage.set(effect, storage.get(effect) + 1);
                }
                player.setStorage("seer_xingming", player.storage.seer_xingming);
                player.addSkill("seer_yisong_restore");
                get.info("seer_xingming").updateTip(player);

                const next = game.createEvent("seer_xingming");
                next.player = player;
                next.eff = effect;
                next.num = map.get(effect);
                next.setContent(async (event, trigger, player) => {
                    const { eff, num } = event;
                    switch (eff) {
                        case "discard": {
                            await player.chooseToDiscard("he", num, true);
                        }
                        break;
                        default: {
                            await player[eff](num);
                        }
                    }
                });
            }
        },
        ai: {
            combo: "seer_xingming",
        },
        subSkill: {
            restore: {
                trigger: {
                    global: "die",
                },
                forced: true,
                charlotte: true,
                async content(event, trigger, player) {
                    player.restoreSkill("seer_yisong");
                    player.removeSkill(event.name);
                },
                mark: true,
                intro: {
                    content: "一名角色死亡时刷新〖遗颂〗",
                },
            },
        },
    },
//#noname-kit-end skill:seer_yisong
    //梅赫维特
//#noname-kit-begin skill:seer_zhurichangshi
    seer_zhurichangshi: {
        nobracket: true,
        mod: {
            ignoredHandcard(card, player) {
                if (get.is.shownCard(card)) return true;
            },
            cardDiscardable(card, player, name) {
                if (name == "phaseDiscard" && get.is.shownCard(card)) return false;
            },
        },
        locked: false,
        trigger: {
            player: "phaseUseBegin",
        },
        filter(event, player) {
            return player.hasCards("h", card => !get.is.damageCard(card));
        },
        async cost(event, trigger, player) {
            const list = get.addNewRowList(player.getCards("h"), "suit", player);
            event.result = await player
                .chooseButton([
                    [[`###${get.translation(event.skill)}###<div class="text center">${get.translation(event.skill, "info")}</div>`], "addNewRow"],
                    [
                        dialog => {
                            dialog.classList.add("fullheight");
                            dialog.forcebutton = false;
                            dialog._scrollset = false;
                        },
                        "handle"
                    ],
                    list.map((item) => [Array.isArray(item) ? item : [item], "addNewRow"])
                ])
                .set("filterButton", button => {
                    return button.links.length;
                })
                .set("ai", button => {
                    return button.links.length;
                })
                .forResult();
            if (event?.result?.links?.length) {
                event.result.cost_data = event.result.links[0];
            }
        },
        async content(event, trigger, player) {
            const cards = player.getCards("h", card => get.suit(card) == event.cost_data);
            if (cards.length) {
                await player.addShownCards(cards, "visible_seer");
            }
        },
        group: "seer_zhurichangshi_use",
        subSkill: {
            use: {
                trigger: {
                    global: "useCard",
                },
                forced: true,
                locked: false,
                filter(event, player) {
                    const suits = player.getShownCards().reduce((list, card) => list.add(get.suit(card)), []);
                    const numbers = player.getShownCards().reduce((list, card) => list.add(get.number(card)), []);
                    if (!suits.includes(get.suit(event.card)) && !numbers.includes(get.suit(event.card))) {
                        return false;
                    }
                    if (event.player == player) {
                        return true;
                    }
                    return event.cards.filterInD().length > 0;
                },
                logTarget: "player",
                async content(event, trigger, player) {
                    if (trigger.player == player) {
                        await player.draw();
                    } else {
                        const cards = trigger.cards.filterInD();
                        if (!cards.length) {
                            return;
                        }
                        const result = await trigger.player
                            .chooseBool(`${get.translation(player)}对你发动${get.translation(event.name)}：是否将${get.translation(cards)}交给其并明置？`)
                            .set("ai", () => {
                                return _status.event.goon;
                            })
                            .set(
                                "goon",
                                (() => {
                                    const att = get.attitude(trigger.player, player);
                                    if (att > 0) {
                                        return get.value(cards, player, "raw") > 0;
                                    }
                                    return get.value(cards, player, "raw") <= 0;
                                })()
                            )
                            .forResult();
                        if (result.bool) {
                            await player.gain({
                                cards: cards,
                                log: true,
                                animate: "gain2"
                            });
                            player.addShownCards(cards, "visible_seer");
                        }
                    }
                }
            },
        },
    },
//#noname-kit-end skill:seer_zhurichangshi
//#noname-kit-begin skill:seer_zhuoritianxing
    seer_zhuoritianxing: {
        nobracket: true,
        enable: "phaseUse",
        usable: 1,
        filter(event, player) {
            return player.hasCards("h", card => lib.skill.seer_zhuoritianxing.filterCard(card));
        },
        filterCard(card, player) {
            player = player || get.owner(card);
            return get.is.shownCard(card) && player.canRecast(card);
        },
        selectCard: [1, Infinity],
        position: "h",
        check(card) {
            const player = get.player();
            const targets = game.filterPlayer(target => {
                const att = get.sgnAttitude(player, target);
                return att * lib.skill.seer_zhuoritianxing.ai.result.target(player, target) > 0;
            });
            if (ui.selected.cards.length >= targets.length) {
                return 0;
            }
            if (!ui.selected.cards.some(cardx => get.suit(cardx) == get.suit(card))) {
                return 8 - get.value(card);
            }
            return 7 - get.value(card);
        },
        filterTarget(card, player, target) {
            return true;
        },
        selectTarget() {
            return [1, ui.selected.cards.length];
        },
        filterOk() {
            return ui.selected.cards.length == ui.selected.targets.length;
        },
        multitarget: true,
        lose: false,
        discard: false,
        delay: false,
        async content(event, trigger, player) {
            const suits = event.cards.reduce((list, card) => list.add(get.suit(card)), []);
            await player.recast(event.cards);
            for (const target of event.targets) {
                const result = await target
                    .chooseToDiscard(`${get.translation(player)}怼你发动${get.translation(event.name)}：选择弃置一张牌，否则你受到1点火焰伤害`)
                    .set("filterCard", card => {
                        return get.event().suits.includes(get.suit(card));
                    })
                    .set("suits", suits)
                    .set("ai", card => {
                        const player = get.player(),
                            num = player.getHp();
                        if (_status.event.eff > 0) {
                            return 0;
                        }
                        if (card.name == "tao") return -10;
                        if (card.name == "jiu" && num <= 1) return -10;
                        return get.unuseful(card) + 2.5 * (5 - num);
                    })
                    .set("eff", get.damageEffect(target, player, target, "fire"))
                    .forResult();
                if (!result?.bool) {
                    await target.damage("fire");
                }
            }
        },
        ai: {
            order: 7,
            result: {
                target(player, target) {
                    const att = get.attitude(player, target);
                    if (att > 0) {
                        return 0;
                    }
                    return get.damageEffect(target, player, target, "fire");
                },
            },
        },
    },
//#noname-kit-end skill:seer_zhuoritianxing
//#noname-kit-begin skill:seer_changzhoudagao
    seer_changzhoudagao: {
        nobracket: true,
        trigger: {
            player: "phaseBegin",
        },
        forced: true,
        juexingji: true,
        skillAnimation: true,
        animationColor: "epic",
        filter(event, player) {
            const suits = player.getShownCards().reduce((list, card) => list.add(get.suit(card)), []);
            return suits.containsAll(...lib.suit.slice());
        },
        async content(event, trigger, player) {
            player.awakenSkill(event.name);
            player.addSkill(event.name + "_effect");
        },
        subSkill: {
            effect: {
                trigger: {
                    player: "gainAfter",
                    global: "loseAsyncAfter",
                },
                forced: true,
                charlotte: true,
                filter(event, player) {
                    return event.getg?.(player)?.some(card => {
                        return get.owner(card) === player && get.position(card) == "h";
                    });
                },
                async content(event, trigger, player) {
                    const cards = trigger.getg(player).filter(card => {
                        return get.owner(card) === player && get.position(card) == "h";
                    });
                    player.addShownCards(cards, "visible_seer");
                },
            },
        },
    },
//#noname-kit-end skill:seer_changzhoudagao
    //霍德尔
//#noname-kit-begin skill:seer_jinyejuexi
    seer_jinyejuexi: {
        nobracket: true,
        trigger: {
            player: "showCharacterAfter",
        },
        hiddenSkill: true,
        filter(event, player) {
            return event.toShow?.some(i => get.character(i).skills?.includes("seer_jinyejuexi"));
        },
        async cost(event, trigger, player) {
            event.result = await player
                .chooseCard(get.prompt2(event.skill), [1, 2], "he", (card, player) => {
                    return !ui.selected.cards.some(cardx => get.suit(card, player) == get.suit(cardx, player));
                })
                .set("ai", card => {
                    const player = get.player();
                    if (_status.currentPhase == player) {
                        if (get.color(card) == "red") {
                            return 8 - get.value(card);
                        }
                        return 0;
                    }
                    return 7 - get.value(card);
                })
                .forResult();
        },
        async content(event, trigger, player) {
            await player.showCards(event.cards);
            await player.recast(event.cards);
            const suits = event.cards.reduce((list, card) => list.add(get.suit(card)), []);
            for (const target of game.filterPlayer()) {
                target.addTempSkill("seer_jinyejuexi_block");
                target.markAuto("seer_jinyejuexi_block", suits);
            }
        },
        subSkill: {
            block: {
                onremove: true,
                charlotte: true,
                mod: {
                    cardEnabled2(card, player) {
                        if (player.getStorage("seer_jinyejuexi_block").includes(get.suit(card))) {
                          return false;
                        }
                      },
                },
                intro: {
                    markcount: () => 0,
                    content: "本回合内不能使用或打出$牌",
                },
            },
        },
    },
//#noname-kit-end skill:seer_jinyejuexi
//#noname-kit-begin skill:seer_youzhangchuiming
    seer_youzhangchuiming: {
        nobracket: true,
        trigger: {
            global: ["loseAfter", "loseAsyncAfter"],
        },
        getIndex(event, player) {
            if (event.type != "discard" || event.getlx === false) {
                return [];
            }
            return game.filterPlayer(target => {
                const evt = event.getParent("phaseDiscard");
                const evt2 = event.getl(target);
                return evt?.name === "phaseDiscard" && evt?.player === target && evt2?.cards2?.filterInD("d");
            });
        },
        // async cost(event, trigger, player) {
        //     const target = event.indexedData;
        //     const cards = trigger.getl(target).cards2.filterInD("d");
        //     if (!cards.length) {
        //         return;
        //     }
        //     // event.result = await player
        //     //     .chooseCardButton(get.prompt2(event.skill, target), cards)
        //     //     .set("ai", card => {
        //     //         return get.player().getUseValue(button.link);
        //     //     })
        //     //     .forResult();
        // },
        logTarget(event, player, name, target) {
            return target;
        },
        async content(event, trigger, player) {
            const target = event.targets[0];
            await player.draw(2);
            const result = await target
                .chooseControl("令其隐匿", "失去一点手牌上限")
                .set("ai", () => {
                    return _status.event.goon;
                })
                .set(
                    "goon", 
                    (() => {
                        const att = get.attitude(target, player);
                        if (att > 0) {
                            return 0;
                        }
                        if (target.getHandcardLimit() >= 6) {
                            return 1;
                        }
                        if (target.getHandcardLimit() <= 3) {
                            return 0;
                        }
                        return get.rand(0, 1);
                    })()
                )
                .set("prompt", `${get.translation(player)}对你发动${get.translation(event.name)}：选择一项`)
                .forResult();
            if (result.index == 0) {
                lib.skill.seer_youzhangchuiming.yinni(player);
            } else {
                // 「失去一点手牌上限」：只有弃牌者 -1，发动者不再 +1
                lib.skill.seer_youzhangchuiming_max.change(target, -1);
            }
        },
        yinni(player) {
            var name = player.name || player.name1;
            if (name && lib.character[name]) {
                player.storage.rawHp = player.hp;
                player.storage.rawMaxHp = player.maxHp;
                player.hp = 0;
                player.maxHp = 0;
                player.update();
                var skills = lib.character[name][3];
                if (player.name2) {
                    for (var i of lib.character[player.name2][3]) {
                        skills.add(i);
                    }
                }
                for (var i = 0; i < skills.length; i++) {
                    if (!lib.translate[skills[i] + "_info"]) {
                        skills.splice(i--, 1);
                    }
                }
                for (var i of skills) {
                    player.removeSkill(i);
                }
                if (!player.hiddenSkills) player.hiddenSkills = [];
                player.hiddenSkills.addArray(skills);
                player.classList.add("unseen");
                if (player.name2) player.classList.add("unseen2");
                player.name = "unknown";
                if (!player.node.name_seat && !_status.video) {
                    player.node.name_seat = ui.create.div(".name.name_seat", get.verticalStr(get.translation(player.name)), player);
                    player.node.name_seat.dataset.nature = get.groupnature(player.group);
                }
                player.sex = "male";
                player.storage.nohp = true;
                player.node.hp.hide();
                player.addSkill("g_hidden_ai");
                player.update();
                player.hp = 1;
                player.maxHp = 1;
            }
        },
        subSkill: {
            max: {
                charlotte: true,
                change(player, num) {
                  if (typeof player.storage.seer_youzhangchuiming_max !== "number") {
                    player.storage.seer_youzhangchuiming_max = 0;
                  }
                  if (!num) {
                    return;
                  }
                  player.storage.seer_youzhangchuiming_max += num;
                  game.log(player, "的手牌上限", "#g" + (num > 0 ? "+" : "") + num);
                },
                mod: {
                    maxHandcard(player, num) {
                        return num + player.countMark("seer_youzhangchuiming_max");
                    },
                },
            },
        },
    },
//#noname-kit-end skill:seer_youzhangchuiming
    //至序圣华
//#noname-kit-begin skill:seer_yaoshi
    seer_yaoshi: {
        trigger: {
            global: "phaseBefore",
            player: "enterGame",
        },
        forced: true,
        locked: false,
        filter(event, player) {
            return (event.name != "phase" || game.phaseNumber == 0);
        },
        async content(event, trigger, player) {
            const func = async player => {
                const result = await player.chooseBool(`${get.translation(event.name)}：你可以摸一张牌并明置一张手牌`).forResult();
                if (result.bool) {
                    await player.draw().forResult();
                    const cards = player.getCards("h", card => !get.is.shownCard(card));
                    if (!cards.length) {
                        return;
                    }
                    if (cards.length == 1) {
                        event.result = { bool: true, cards: cards };
                    } else {
                        event.result = await player.chooseCard("请选择明置一张手牌", true, card => !get.is.shownCard(card)).forResult();
                    }
                    if (event?.result?.cards?.length) {
                        await player.addShownCards(event.result.cards, "visible_seer");
                    }
                }
            };
            await game.doAsyncInOrder(game.filterPlayer(), func);
        },
    },
//#noname-kit-end skill:seer_yaoshi
//#noname-kit-begin skill:seer_zhengfa
    seer_zhengfa: {
        mod: {
            targetInRange(card, player, target) {
                if (!target.getShownCards().length) {
                    return true;
                }
            },
            cardUsableTarget(card, player, target) {
                if (!target.getShownCards().length) {
                    return true;
                }
            },
        },
        locked: false,
        enable: "chooseToUse",
        getShownCards(player) {
            const cards = game.filterPlayer(target => target != player)
                .reduce((list, target) => {
                    list.addArray(target.getShownCards());
                    return list;
                }, []);
            return cards;
        },
        onChooseToUse(event) {
            if (game.online || Array.isArray(event.seer_zhengfa_cards)) {
                return;
            }
            const cards = lib.skill.seer_zhengfa.getShownCards(event.player);
            event.set("seer_zhengfa_cards", cards);
        },
        hiddenCard(player, name) {
            const cards = lib.skill.seer_zhengfa.getShownCards(player);
            return player.hp > 0 && cards.some(card => card.name == name);
        },
        filter(event, player) {
            if (!Array.isArray(event.seer_zhengfa_cards) || event.responded || event.seer_zhengfa) {
                return false;
            }
            return event.seer_zhengfa_cards.some(card => event.filterCard(get.autoViewAs({ name: card.name }, "unsure"), player, event));
        },
        chooseButton: {
            dialog(event, player) {
                return ui.create.dialog(get.translation("seer_zhengfa"), event.seer_zhengfa_cards, "hidden");
            },
            filter(button, player) {
                const evt = _status.event.getParent();
                return evt.filterCard(button.link, player, evt);
            },
            check(button) {
                const card = button.link,
                    player = get.player();
                return player.getUseValue(card);
            },
            backup(links, player) {
                return {
                    audio: "seer_zhengfa",
                    filterCard() {
                        return false;
                    },
                    selectCard: -1,
                    viewAs: links[0],
                    card: links[0],
                    log: false,
                    async precontent(event, trigger, player) {
                        const card = lib.skill.seer_zhengfa_backup.card;
                        event.result.cards = [card];
                        event.result.card = get.autoViewAs(card, [card]);
                        event.result.card.seer_zhengfa = true;
                        player.logSkill("seer_zhengfa");
                        await player.loseHp();
                    },
                };
            },
            prompt(links, player) {
                return "征伐：是否流失1点体力使用" + get.translation(links[0]) + "？";
            },
        },
        ai: {
            order: 12,
            respondShan: true,
            respondSha: true,
            skillTagFilter(player, tag, arg) {
                if (arg == "respond") {
                    return false;
                }
                const name = tag == "respondSha" ? "sha" : "shan";
                return get.info("seer_zhengfa").hiddenCard(player, name);
            },
            result: {
                player(player) {
                    if (_status.event.dying) {
                        return get.attitude(player, _status.event.dying);
                    }
                    return 1;
                },
            },
        },
        subSkill: {
            backup: {},
        },
    },
//#noname-kit-end skill:seer_zhengfa
//#noname-kit-begin skill:seer_chongsu
    seer_chongsu: {
        trigger: {
            player: "dying",
            source: "dieAfter",
        },
        filter(event, player) {
            return game.hasPlayer(target => target != player && target.getShownCards().length);
        },
        async content(event, trigger, player) {
            const gains = [];
            const targets = game.filterPlayer(target => target != player);
            for (const target of targets) {
                const cards = target.getShownCards();
                if (cards.length) {
                    gains.addArray(cards);
                    await player.gain(target, cards, "bySelf");
                }
            }
            if (gains.length) {
                await player.recover(gains.length);
            }
            player.useSkill("seer_yaoshi");
        },
    },
//#noname-kit-end skill:seer_chongsu
//#noname-kit-begin skill:seer_jiamian
    seer_jiamian: {
        zhuSkill: true,
        global: "seer_jiamian_global",
        subSkill: {
            global: {
                enable: "phaseUse",
                usable: 1,
                filter(event, player) {
                    return game.hasPlayer(target => target.hasZhuSkill("seer_yaoshi")) && event.player.name != 'seer_zhixushenghua';
                },
                prompt: "你可摸一张牌并明置之",
                async content(event, trigger, player) {
                    const result = await player.draw().forResult();
                    if (result.cards && get.itemtype(result.cards) == "cards") {
                        await player.addShownCards(result.cards, "visible_seer");
                    }
                },
                ai: {
                    order: 2,
                    result: {
                        player: 1,
                    },
                },
            },
        },
    },
//#noname-kit-end skill:seer_jiamian
    //折枝
//#noname-kit-begin skill:seer_miaobi
    seer_miaobi: {
        group: "seer_miaobi_record",
        trigger: {
            player: "useCardAfter",
        },
        // 标记：武将牌上显示「妙」，角标为已记录的牌类型数，悬停查看具体类型
        mark: true,
        marktext: "妙",
        intro: {
            markcount(storage, player) {
                return (player.storage.seer_miaobi || []).length;
            },
            content(storage, player) {
                const list = player.storage.seer_miaobi || [];
                if (!list.length) {
                    return "尚未使用牌";
                }
                return "已使用过的牌类：" + list.map(type => get.translation(type)).join("、");
            },
        },
        init(player, skill) {
            player.markSkill(skill);
        },
        filter(event, player) {
            // 妙笔自身用出的【墨鹤】不再嵌套触发，否则一装备就会立刻接一次“移动场上一张牌”
            if (event.getParent("seer_miaobi", true)) {
                return false;
            }
            const type = get.type(event.card);
            if (!["basic", "trick", "equip"].includes(type)) {
                return false;
            }
            const used = player.storage.seer_miaobi || [];
            const types = new Set(used);
            types.add(type);
            if (types.size < 3) {
                return false;
            }
            if (player.countCards("e", card => card.name == "seer_mohe") > 0) {
                return player.canMoveCard();
            }
            return true;
        },
        // 提示文字不超过 20 字，引擎才会把它居中（content.js:7631 用 length <= 20 判断）
        prompt2(event, player) {
            if (player.countCards("e", card => card.name == "seer_mohe") > 0) {
                return "移动场上一张牌";
            }
            return "将牌堆顶的牌当做【墨鹤】使用";
        },
        async content(event, trigger, player) {
            // 发动即清零；随后妙笔自己用出的【墨鹤】作为一次“装备牌使用”计入下一轮
            player.storage.seer_miaobi = [];
            player.markSkill("seer_miaobi");
            // 发动后先摸一张牌
            await player.draw();
            const hasMohe = player.countCards("e", card => card.name == "seer_mohe") > 0;
            if (hasMohe) {
                await player.moveCard(true);
            } else {
                const cards = get.cards();
                if (cards.length) {
                    const card = get.autoViewAs({ name: "seer_mohe" }, cards);
                    if (player.hasUseTarget(card)) {
                        // 装备【墨鹤】的瞬间，墨鹤的记名触发器会被“补登记”到当前正在结算的这张牌上，
                        // 从而给这次结算多记一个牌名；这里打上标记，让墨鹤跳过这次误触发
                        trigger.set("_seer_mohe_skip", true);
                        await player.chooseUseTarget(card, cards, true);
                    }
                }
            }
        },
        oncancel(event, player) {
            player.storage.seer_miaobi = [];
            player.markSkill("seer_miaobi");
        },
        subSkill: {
            record: {
                trigger: {
                    player: "useCardAfter",
                },
                forced: true,
                popup: false,
                silent: true,
                charlotte: true,
                priority: 1,
                filter(event) {
                    // 妙笔自己用出的【墨鹤】也算一次“使用装备牌”，计入下一轮计数
                    return ["basic", "trick", "equip"].includes(get.type(event.card));
                },
                content(event, trigger, player) {
                    const type = get.type(trigger.card);
                    const used = player.storage.seer_miaobi || (player.storage.seer_miaobi = []);
                    if (!used.includes(type)) {
                        used.push(type);
                    }
                    player.markSkill("seer_miaobi");
                },
            },
        },
    },
//#noname-kit-end skill:seer_miaobi
//#noname-kit-begin skill:seer_huajing
    seer_huajing: {
        enable: "phaseUse",
        limited: true,
        filter(event, player) {
            const list = lib.skill.seer_mohe_skill.initList();
            return list.length && game.hasPlayer(target => target.countCards("e"));
        },
        async precontent(event, trigger, player) {
            const skillName = event.name.slice("pre_".length);
            const list = lib.skill.seer_mohe_skill.initList();
            if (!list.length) {
                return;
            }
            const result = await player
                .chooseButton([
                    [[get.translation(skillName)], "addNewRow"],
                    [list, "vcard"],
                    [
                        dialog => {
                            for (const target of game.filterPlayer()) {
                                const cards = target.getCards("e");
                                if (cards.length) {
                                    dialog.add(`<div class="text center">${get.translation(target)}的牌</div>`);
                                    dialog.add(target.getCards("e"));
                                }
                            }
                        },
                        "handle",
                    ],
                ])
                .set("selectButton", [2, list.length * 2])
                .set("filterOk", () => {
                    const cards = ui.selected.buttons.filter(button => get.itemtype(button.link) == "card");
                    const vcards = ui.selected.buttons.slice().removeArray(cards);
                    return vcards.length == cards.length;
                })
                .forResult();
            if (result?.bool && result.links?.length) {
                const cards = result.links.filter(link => get.itemtype(link) == "card");
                const vcards = result.links.slice().removeArray(cards).map(info => info[2]);
                event.getParent().cost_data = { vcards, cards };
                return;
            }
            event.getParent().goto(0);
        },
        async content(event, trigger, player) {
            player.awakenSkill(event.name);
            game.broadcastAll(
                list => {
                    lib.skill.seer_mohe_skill.initList();
                    _status.seer_mohe_skill_list.removeArray(list);
                    game.log("#g墨鹤", "移除了牌名", "#y" + get.translation(list));
                },
                event.getParent(2).cost_data.vcards
            );
            for (const card of event.getParent(2).cost_data.cards) {
                const owner = get.owner(card);
                if (!owner?.isIn()) {
                    continue;
                }
                var bool = get.position(card) == "e";
                if (bool) {
                    owner.removeEquipTrigger(card.card || card);
                }
                const skills = get.info({ name: "seer_mohe" }).skills;
                if (skills.length) {
                    card.skills = skills;
                }
                game.addVideo("skill", player, ["seer_huajing", [bool, get.cardInfo(card)]]);
                game.broadcastAll(
                    (card, bool, player) => {
                        card.init([card.suit, card.number, "seer_mohe"]);
                        let vcard = card[card.cardSymbol];
                        if (bool && vcard && player.vcardsMap?.equips) {
                            const cardx = get.autoViewAs(card, void 0, false);
                            player.vcardsMap.equips[player.vcardsMap.equips.indexOf(vcard)] = cardx;
                            card[card.cardSymbol] = cardx;
                        }
                    },
                    card,
                    bool,
                    owner
                );
                if (bool) {
                    owner.addEquipTrigger(card.card || card);
                }
            }
        },
    },
//#noname-kit-end skill:seer_huajing
    //帝录天锋
//#noname-kit-begin skill:seer_wancangshudilu
    seer_wancangshudilu: {
        nobracket: true,
        init(player, skill) {
            player.setMark(skill, 1, false);
        },
        mod: {
            maxHandcard(player, num) {
                if (player.countMark("seer_wancangshudilu") <= 4) {
                    return num + player.countMark("seer_wancangshudilu");
                }
            },
            cardUsable(card, player, num) {
                if (card.name != "sha") {
                    return;
                }
                if (player.isPhaseUsing() && player.countMark("seer_wancangshudilu") >= 3 && player.countMark("seer_wancangshudilu") <= 4) {
                    const count = Math.floor(player.countMark("seer_wancangshudilu") / 2);
                    return num + count;
                }
            },
            cardEnabled(card, player) {
                if (card.name != "sha" && player.countMark("seer_wancangshudilu") == 4) return false;
            },
            cardSavable(card, player) {
                if (card.name != "sha" && player.countMark("seer_wancangshudilu") == 4) return false;
            },
        },
        locked: false,
        trigger: {
            player: ["phaseEnd", "phaseDrawBegin2"],
            source: "damageBegin1",
        },
        forced: true,
        locked: false,
        onremove: true,
        filter(event, player) {
            if (event.name == "phase") {
                return true;
            }
            if (event.name == "phaseDraw") {
                return !event.numFixed && player.countMark("seer_wancangshudilu") >= 2 && player.countMark("seer_wancangshudilu") <= 4;
            }
            return player.countMark("seer_wancangshudilu") == 4;
        },
        async content(event, trigger, player) {
            switch (trigger.name) {
                case "phase": {
                    player.addMark(event.name, 1, false);
                }
                    break;
                case "phaseDraw": {
                    trigger.num += player.countMark(event.name);
                }
                    break;
                case "damage": {
                    trigger.num++;
                    game.log(player, "造成的伤害", "#y+1");
                }
                    break;
            }
        },
        intro: {
            content: "#",
        },
    },
//#noname-kit-end skill:seer_wancangshudilu
//#noname-kit-begin skill:seer_fenghaojinxueyu
    seer_fenghaojinxueyu: {
        nobracket: true,
        trigger: {
            player: "useCardAfter",
        },
        filter(event, player) {
            return player.getHistory("useCard").length == player.countMark("seer_wancangshudilu");
        },
        async cost(event, trigger, player) {
            event.result = await player
                .chooseControl("+1", "-1", "cancel2")
                .set("prompt", `###${get.prompt(event.skill)}###你可以令${get.poptip("seer_wancangshudilu")}中的X±1（当前X为${player.countMark("seer_wancangshudilu")}）`)
                .set("ai", () => {
                    return get.rand(0, 2);
                })
                .forResult();
            if (event.result.control != "cancel2") {
                event.result.cost_data = event.result.control;
            }
        },
        async content(event, trigger, player) {
            if (event.cost_data == "+1") {
                player.addMark("seer_wancangshudilu", 1, false);
            } else if (player.countMark("seer_wancangshudilu")) {
                player.removeMark("seer_wancangshudilu", 1, false);
            }
        },
        ai: {
            combo: "seer_wancangshudilu",
        },
    },
//#noname-kit-end skill:seer_fenghaojinxueyu
    //索伦森
//#noname-kit-begin skill:seer_anmiejunwang
    seer_anmiejunwang: {
        nobracket: true,
        trigger: {
            global: "phaseBegin",
        },
        forced: true,
        filter(event, player) {
            return event.player != player && event.player.countCards("h") > player.countCards("h");
        },
        logTarget: "player",
        async content(event, trigger, player) {
            const target = trigger.player;
            const num = target.countCards("h") - player.countCards("h");
            if (num > 0) {
                const result = await target.chooseToDiscard("h", num, true).forResult();
                if (result?.cards?.length) {
                    if (result.cards.length == 1) {
                        event.result = { links: result.cards };
                    } else {
                        event.result = await player
                            .chooseCardButton("黯灭君王：选择获得其中一张牌", result.cards, true)
                            .set("ai", button => {
                                return get.player().getUseValue(button.link);
                            })
                            .forResult();
                    }
                    if (event?.result?.links?.length) {
                        await player.gain(event.result.links, "gain2");
                    }
                }
            }
        },
    },
//#noname-kit-end skill:seer_anmiejunwang
//#noname-kit-begin skill:seer_beiqishengling
    seer_beiqishengling: {
        nobracket: true,
        derivation: "seer_hundunzhuzai",
        trigger: {
            global: "phaseEnd",
        },
        forced: true,
        locked: false,
        dutySkill: true,
        filter(event, player) {
            return player.countCards("h", { color: "red" });
        },
        async content(event, trigger, player) {
            const cards = player.getCards("h", { color: "red" });
            if (cards.length) {
                await player.lose(cards, "visible", ui.special);;
            }
            await player.loseHp();
        },
        group: ["seer_beiqishengling_achieve", "seer_beiqishengling_fail"],
        subSkill: {
            achieve: {
                trigger: {
                    global: "roundStart",
                },
                forced: true,
                locked: false,
                filter(event, player) {
                    return player.getCards("h").every(card => get.suit(card, player) == "spade");
                },
                async content(event2, trigger, player2) {
                    game.log(player2, "成功完成使命");
                    player2.awakenSkill("seer_beiqishengling");
                    await player2.recover(2);
                    const cards = ["cardPile", "discardPile"].map(pos => Array.from(ui[pos].childNodes)).flat();
                    const filter = card => get.color(card) == "red";
                    const cards2 = cards.filter(filter);
                    if (cards2.length) {
                        await game.cardsGotoSpecial(cards2);
                        game.log(cards2, "被销毁了");
                    }
                    for (const target of game.filterPlayer()) {
                        const cards = target.getCards("hej", filter);
                        if (cards.length) {
                            target.$throw(cards);
                            await target.lose(cards, "visible", ui.special);
                            game.log(cards, "被销毁了");
                        }
                    }
                    await player2.addSkills("seer_hundunzhuzai");
                },
            },
            fail: {
                trigger: {
                    player: "dying",
                },
                forced: true,
                locked: false,
                async content(event2, trigger, player2) {
                    game.log(player2, "使命失败");
                    player2.awakenSkill("seer_beiqishengling");
                },
            },
        },
    },
//#noname-kit-end skill:seer_beiqishengling
//#noname-kit-begin skill:seer_hundunzhuzai
    seer_hundunzhuzai: {
        nobracket: true,
        trigger: {
            player: "damageBegin4",
        },
        forced: true,
        filter(event, player) {
            return event.source && event.source.countCards("h") < player.countCards("h");
        },
        async content(event, trigger, player) {
            trigger.cancel();
        },
    },
//#noname-kit-end skill:seer_hundunzhuzai
    //米修莉
//#noname-kit-begin skill:seer_shihuangwenhen
    seer_shihuangwenhen: {
        nobracket: true,
        init() {
            if (game.seer_shihuangwenhen) {
                return;
            }
            game.seer_shihuangwenhen = lib.element.player.damage;
            lib.element.player.damage = function () {
                const next = game.seer_shihuangwenhen.apply(this, arguments),
                    event = _status.event;
                if (!Array.from(arguments).some(argument => typeof argument === "number")) {
                    next.num = (typeof event.baseDamage === "number" ? event.baseDamage : 1) + (typeof event.extraDamage === "number" ? event.extraDamage : 0);
                    next.original_num = next.num;
                }
                return next;
            };
        },
        enable: "phaseUse",
        usable: 2,
        filterCard(card) {
            if (card.name != "sha") {
                return false;
            }
            const skill = "seer_shihuangwenhen_effect";
            let tag = card.gaintag?.find(tag => tag.startsWith(skill));
            if (!tag) {
                return true;
            }
            let num = parseFloat(parseInt(tag.slice(skill.length)));
            return num > 0;
        },
        selectCard: 2,
        complexCard: true,
        lose: false,
        discard: false,
        async content(event, trigger, player) {
            for (const card of event.cards) {
                const skill = "seer_shihuangwenhen_effect";
                player.addTempSkill(skill, "roundStart");
                let tag = card.gaintag?.find(tag => tag.startsWith(skill));
                let num = [-1, 1][event.cards.indexOf(card)];
                if (tag) {
                    player.removeGaintag(tag, [card]);
                    num += parseFloat(parseInt(tag.slice(skill.length)))
                }
                tag = skill + num;
                if (!lib.skill[tag]) {
                    game.broadcastAll(
                        (tag, str, num) => {
                            lib.skill[tag] = {};
                            lib.translate[tag] = "伤害" + (num > 0 ? "+" : "") + str;
                        },
                        tag,
                        tag.slice(skill.length),
                        num
                    );
                }
                player.addGaintag([card], tag);
            }
        },
        ai: {
            order() {
                return get.order({ name: "sha" });
            },
            result: {
                player(player) {
                    return 1;
                },
            },
        },
        subSkill: {
            effect: {
                charlotte: true,
                onremove(player, skill) {
                    let tags = player.getCards("h", card => card.gaintag?.some(tag => tag.startsWith(skill)));
                    if (tags.length) {
                        tags = tags
                            .slice()
                            .map(card => card.gaintag.find(tag => tag.startsWith(skill)))
                            .unique();
                        tags.forEach(tag => player.removeGaintag(tag));
                    }
                },
                trigger: {
                    player: "useCard",
                },
                filter(event, player) {
                    const evt = event;
                    if (!evt || evt.cards?.length !== 1) return false;
                    return player.hasHistory(
                        "lose",
                        evtx =>
                            evtx.getParent() === event &&
                            Object.keys(evtx.gaintag_map).some(i => {
                                return evtx.gaintag_map[i].some(tag => tag.startsWith("seer_shihuangwenhen_effect"));
                            })
                    );
                },
                forced: true,
                popup: false,
                log: false,
                async content(event, trigger, player) {
                    const skill = "seer_shihuangwenhen_effect",
                        evt = trigger;
                    const evtx = player.getHistory(
                        "lose",
                        evtx =>
                            evtx.getParent() === evt &&
                            Object.keys(evtx.gaintag_map).some(i => {
                                return evtx.gaintag_map[i].some(tag => tag.startsWith(skill));
                            })
                    )[0];
                    const num = Object.keys(evtx.gaintag_map).reduce((sum, i) => {
                        const tag = evtx.gaintag_map[i].find(tag => tag.startsWith(skill));
                        if (tag) sum += parseInt(tag.slice(skill.length));
                        return sum;
                    }, 0);
                    trigger.baseDamage += num;
                    if (num == -1) {
                        if (trigger.addCount !== false) {
                            trigger.addCount = false;
                            const stat = player.getStat().card;
                            const name = trigger.card.name;
                            if (typeof stat[name] == "number") {
                                stat[name]--;
                            }
                        }
                    }
                    for (const target of game.filterPlayer(target => target != player)) {
                        target.addTempSkill("seer_shihuangwenhen_ai");
                        target.markAuto("seer_shihuangwenhen_ai", trigger.card);
                    }
                },
            },
            ai: {
                charlotte: true,
                onremove: true,
                ai: {
                    useShan: true,
                    skillTagFilter(player, tag, arg) {
                        const event = _status.event.getParent("useCard");
                        if (!event || event.card.name != "sha") {
                            return false;
                        }
                        if (player.hasSkillTag("noShan", null, "use")) {
                            return false;
                        }
                        if (!player.getStorage("seer_shihuangwenhen_ai").includes(event.card)) {
                            return false;
                        }
                        if (player.isLinked() && game.hasNature(event.card) && game.hasPlayer((cur) => {
                            if (cur === player || !cur.isLinked()) {
                                return false;
                            }
                            return true;
                        })) {
                            if (get.attitude(player, event.player._trueMe || event.player) > 0) {
                                return false;
                            }
                        }
                        if (!game.hasNature(event.card, "ice") && !event.player.hasSkillTag("jueqing", false, player) && !player.hasSkill("gangzhi") && get.damageEffect(player, event.player, player, get.nature(event.card)) >= 0) {
                            return false;
                        }
                        if (Math.random() < 0.5) {
                            return false;
                        }
                        return true;
                    },
                },
            },
        },
    },
//#noname-kit-end skill:seer_shihuangwenhen
//#noname-kit-begin skill:seer_buyezhixue
    seer_buyezhixue: {
        nobracket: true,
        trigger: {
            player: ["useCardAfter", "respondAfter"],
        },
        filter(event, player) {
            let history = player.getAllHistory(event.name);
            let index = history.indexOf(event) - 1;
            if (index < 0) {
                return false;
            }
            let evt = history[index];
            return evt?.card?.name == event.card.name;
        },
        async content(event, trigger, player) {
            await player.draw(2);
            let evt = _status.event.getParent("phaseUse");
            if (evt && evt.name == "phaseUse") {
                evt.skipped = true;
            }
            evt = event.getParent("phase", true);
            if (evt) {
                if (_status.currentPhase) {
                    game.log(_status.currentPhase, "结束了回合");
                }
                evt.num = evt.phaseList.length;
                evt.goto(11);
            }
        },
    },
//#noname-kit-end skill:seer_buyezhixue
    //圣谕邪魇
//#noname-kit-begin skill:seer_cishenjiwujian
    seer_cishenjiwujian: {
        nobracket: true,
        mod: {
            cardUsable(card, player, num) {
                if (card.storage?.seer_cishenjiwujian) return Infinity;
            },
        },
        locked: false,
        enable: "chooseToUse",
        onChooseToUse(event) {
            if (game.online || event.seer_cishenjiwujian_list) {
                return;
            }
            var list = lib.skill.seer_cishenjiwujian.getUsed(event.player);
            event.set("seer_cishenjiwujian_list", list);
        },
        getUsed(player) {
            return player.getStorage("seer_cishenjiwujian_record", []);
        },
        hiddenCard(player, name) {
            if (get.type(name) != "basic") {
                return false;
            }
            var list = lib.skill.seer_cishenjiwujian.getUsed(player);
            if (list.includes(name)) {
                return false;
            }
            return player.hasCards("hes");
        },
        filter(event, player) {
            if (event.type == "wuxie" || !player.hasCards("hes")) {
                return false;
            }
            var list = event.seer_cishenjiwujian_list || lib.skill.seer_cishenjiwujian.getUsed(player);
            for (var name of lib.inpile) {
                if (get.type(name) != "basic" || list.includes(name)) {
                    continue;
                }
                var card = { name, storage: { seer_cishenjiwujian: true }, isCard: true };
                if (event.filterCard(card, player, event)) {
                    return true;
                }
                if (name == "sha") {
                    for (var nature of lib.inpile_nature) {
                        card.nature = nature;
                        if (event.filterCard(card, player, event)) {
                            return true;
                        }
                    }
                }
            }
            return false;
        },
        chooseButton: {
            dialog(event, player) {
                var vcards = [];
                var list = event.seer_cishenjiwujian_list || lib.skill.seer_cishenjiwujian.getUsed(player);
                for (var name of lib.inpile) {
                    if (get.type(name) != "basic" || list.includes(name)) {
                        continue;
                    }
                    var card = { name, storage: { seer_cishenjiwujian: true }, isCard: true };
                    if (event.filterCard(card, player, event)) {
                        vcards.push(["基本", "", name]);
                    }
                    if (name == "sha") {
                        for (var nature of lib.inpile_nature) {
                            card.nature = nature;
                            if (event.filterCard(card, player, event)) {
                                vcards.push(["基本", "", name, nature]);
                            }
                        }
                    }
                }
                const dialog = ui.create.dialog("此身即无间", [vcards, "vcard"], "hidden");
                dialog.direct = true;
                return dialog;
            },
            check(button) {
                var player = _status.event.player;
                var card = { name: button.link[2], nature: button.link[3], storage: { seer_cishenjiwujian: true } };
                if (game.hasPlayer(function (current) {
                    return player.canUse(card, current) && get.effect(current, card, player, player) > 0;
                })) {
                    switch (button.link[2]) {
                        case "tao":
                            return 5;
                        case "jiu":
                            return 3.01;
                        case "sha":
                            if (button.link[3] == "fire") {
                                return 2.95;
                            } else if (button.link[3] == "thunder") {
                                return 2.92;
                            } else {
                                return 2.9;
                            }
                        case "shan":
                            return 1;
                    }
                }
                return 0;
            },
            backup(links, player) {
                return {
                    viewAs: {
                        name: links[0][2],
                        nature: links[0][3],
                        storage: {
                            seer_cishenjiwujian: true
                        },
                    },
                    filterCard: true,
                    position: "hes",
                    check(card) {
                        return 1 / Math.max(0.1, get.value(card));
                    },
                    popname: true,
                    ignoreMod: true,
                    async precontent(event, trigger, player) {
                        player.logSkill("seer_cishenjiwujian");
                        player.addSkill("seer_cishenjiwujian_record");
                        player.markAuto("seer_cishenjiwujian_record", event.result.card.name);
                        player
                            .when("useCardAfter")
                            .filter(evt => evt.skill == "seer_cishenjiwujian_backup")
                            .then(() => {
                                const list = get.inpileVCardList(info => {
                                    return info[0] == "basic" && !player.hasStorage("seer_cishenjiwujian_record", info[2]);
                                });
                                if (list.length) {
                                    return;
                                }
                                player.removeSkill("seer_cishenjiwujian_record");
                                const card = get.cardPile(card => get.type(card) == "trick");
                                if (card) {
                                    player.gain(card, "draw");
                                }
                            });
                    },
                };
            },
            prompt(links, player) {
                return "将一张牌当作" + get.translation(links[0][3] || "") + get.translation(links[0][2]) + "使用";
            },
        },
        ai: {
            order() {
                var player = _status.event.player;
                var event = _status.event;
                var list = lib.skill.seer_cishenjiwujian.getUsed(player);
                if (!list.includes("jiu") && event.filterCard({ name: "jiu" }, player, event) && get.effect(player, { name: "jiu" }) > 0) {
                    return 3.1;
                }
                return 2.9;
            },
            respondSha: true,
            fireAttack: true,
            respondShan: true,
            skillTagFilter(player, tag, arg) {
                if (tag == "fireAttack") {
                    return true;
                }
                if (player.hasCards("hes")) {
                    if (arg === "respond") {
                        return false;
                    }
                    var list = lib.skill.seer_cishenjiwujian.getUsed(player);
                    if (tag == "respondSha") {
                        if (list.includes("sha")) {
                            return false;
                        }
                    } else if (tag == "respondShan") {
                        if (list.includes("shan")) {
                            return false;
                        }
                    }
                } else {
                    return false;
                }
            },
            result: {
                player: 1,
            },
        },
        subSkill: {
            backup: {},
            record: {
                charlotte: true,
                onremove: true,
            },
        },
    },
//#noname-kit-end skill:seer_cishenjiwujian
//#noname-kit-begin skill:seer_shengxiezhixuwang
    seer_shengxiezhixuwang: {
        nobracket: true,
        trigger: {
            player: "useCardToPlayered",
        },
        filter(event, player) {
            if (!["basic", "trick"].includes(get.type(event.card))) {
                return false;
            }
            if (!event.isFirstTarget) {
                return false;
            }
            return true;
        },
        async cost(event, trigger, player) {
            const cards = player.getExpansions("seer_shengxiezhixuwang");
            if (!cards.length) {
                return;
            }
            const type = get.type(trigger.card);
            const cards2 = cards.filter(card => {
                if (!["basic", "trick"].includes(get.type(card))) {
                    return false;
                }
                return type != get.type(card) && get.info(card, false).filterTarget;
            });
            if (!cards2.length) {
                return;
            }
            if (cards2.length == 1) {
                const card = cards2[0];
                event.result = await player
                    .chooseBool({
                        prompt: get.prompt(event.skill),
                        prompt2: `将${get.translation(trigger.card)}的效果改为${get.translation(card)}`,
                        ai() {
                            return get.event().goon;
                        },
                    })
                    .set(
                        "goon",
                        (() => {
                            const card2 = get.autoViewAs({ name: card.name }, trigger.cards);
                            const eff1 = trigger.targets.reduce((sum, target) => sum + get.effect(target, trigger.card, player, player), 0),
                                eff2 = trigger.targets.reduce((sum, target) => sum + get.effect(target, card2, player, player), 0);
                            return eff1 < eff2;
                        })()
                    )
                    .forResult();
                event.result.cards = cards2;
                return;
            }
            event.result = await player
                .chooseCardButton(`###${get.prompt2(event.skill)}###将${get.translation(trigger.card)}的效果改为${get.translation(card)}`, cards2)
                .set("ai", button => {
                    const player = get.player();
                    const trigger = _status.event.getTrigger();
                    const card2 = get.autoViewAs({ name: button.link[2] }, trigger.cards);
                    const eff1 = trigger.targets.reduce((sum, target) => sum + get.effect(target, trigger.card, player, player), 0),
                        eff2 = trigger.targets.reduce((sum, target) => sum + get.effect(target, card2, player, player), 0);
                    return eff2 - eff1;
                })
                .forResult();
            if (event?.result?.links?.length) {
                event.result.cards = event.result.links;
            }
        },
        async content(event, trigger, player) {
            const card = event.cards[0];
            player.addTempSkill("seer_shengxiezhixuwang_effect");
            player.markAuto("seer_shengxiezhixuwang_effect", [[trigger.card, card]]);
        },
        intro: {
            content: "expansion",
            markcount: "expansion",
        },
        onremove(player, skill) {
            const cards2 = player.getExpansions(skill);
            if (cards2.length) {
                player.loseToDiscardpile(cards2);
            }
        },
        group: ["seer_shengxiezhixuwang_init", "seer_shengxiezhixuwang_use"],
        subSkill: {
            init: {
                trigger: {
                    global: "phaseBefore",
                    player: "enterGame",
                },
                forced: true,
                locked: false,
                filter(event, player) {
                    return (event.name != "phase" || game.phaseNumber == 0);
                },
                async content(event, trigger, player) {
                    const next = player.addToExpansion(get.cards(), "draw");
                    next.gaintag.add("seer_shengxiezhixuwang");
                    await next;
                },
            },
            use: {
                trigger: {
                    player: "useCardAfter",
                },
                filter(event, player) {
                    if (!["basic", "trick"].includes(get.type(event.card))) {
                        return false;
                    }
                    const cards = player.getExpansions("seer_shengxiezhixuwang");
                    if (!cards.length) {
                        return false;
                    }
                    const cards2 = event.cards?.filterInD();
                    return cards2.some(card => ["basic", "trick"].includes(get.type(card)));
                },
                prompt2(event, player) {
                    const cards = player.getExpansions("seer_shengxiezhixuwang");
                    const cards2 = event.cards.filterInD().filter(card => ["basic", "trick"].includes(get.type(card)));
                    return `你可以用${get.translation(cards2)}替换武将牌上的${get.translation(cards)}`;
                },
                async content(event, trigger, player) {
                    const cards = player.getExpansions("seer_shengxiezhixuwang");
                    const cards2 = trigger.cards.filterInD().filter(card => ["basic", "trick"].includes(get.type(card)));
                    if (!cards2.length) {
                        return;
                    }
                    const next = player.addToExpansion(cards2, "gain2");
                    next.gaintag.add("seer_shengxiezhixuwang");
                    await next;
                    await player.loseToDiscardpile(cards);
                },
            },
            effect: {
                charlotte: true,
                onremove: true,
                trigger: {
                    player: "useCardToBegin",
                },
                filter(event, player) {
                    const storage = player.getStorage("seer_shengxiezhixuwang_effect");
                    return storage.some((list) => list[0] == event.card);
                },
                forced: true,
                popup: false,
                firstDo: true,
                async content(event, trigger, player) {
                    const list = player.getStorage("seer_shengxiezhixuwang_effect").find((list2) => list2[0] == trigger.card);
                    trigger.setContent(lib.card[list[1].name].content);
                },
            },
        },
    },
//#noname-kit-end skill:seer_shengxiezhixuwang
    //茉蕊儿
//#noname-kit-begin skill:seer_qianchungongzhan
    seer_qianchungongzhan: {
        nobracket: true,
        enable: "phaseUse",
        usable: 1,
        filter(event, player) {
            return game.hasPlayer(target => lib.skill.seer_qianchungongzhan.filterTarget(null, player, target));
        },
        filterTarget(card, player, target) {
            return target.hp < player.hp && target.isDamaged();
        },
        filterCard(card, player) {
            return lib.filter.cardDiscardable(card, player, "seer_qianchungongzhan");
        },
        position: "he",
        check(card) {
            return 7 - get.value(card);
        },
        async content(event, trigger, player) {
            let [target] = event.targets;
            await target.recover();
            let source = target;
            while (true) {
                const result = await source
                    .chooseCardTarget({
                        prompt: get.prompt(event.name),
                        prompt2: "你可弃一张牌令一名体力值低于你的角色回复一点体力，然后因此回复体力的角色亦可如此做。",
                        filterCard(card, player) {
                            return lib.skill.seer_qianchungongzhan.filterCard(card, player);
                        },
                        position: "he",
                        filterTarget(card, player, target) {
                            return lib.skill.seer_qianchungongzhan.filterTarget(null, player, target);
                        },
                        ai1(card) {
                            return lib.skill.seer_qianchungongzhan.check(card);
                        },
                        ai2(target) {
                            const player = get.player();
                            const att = get.attitude(player, target);
                            return att * lib.skill.seer_qianchungongzhan.ai.result.target(player, target);
                        },
                    })
                    .forResult();
                if (result?.cards?.length && result?.targets?.length) {
                    const [current] = result.targets;
                    await source.discard(result.cards);
                    await current.recover(source);
                    source = current;
                } else {
                    break;
                }
            }
        },
        ai: {
            order: 1,
            result: {
                target(player, target) {
                    return get.recoverEffect(target, player, player);
                },
            },
        },
    },
//#noname-kit-end skill:seer_qianchungongzhan
//#noname-kit-begin skill:seer_fangxinyongcun
    seer_fangxinyongcun: {
        nobracket: true,
        trigger: {
            player: "phaseBegin",
            global: "recoverEnd",
        },
        forced: true,
        filter(event, player) {
            if (event.name == "phase") {
                return player.isDamaged();
            }
            return event.player.isHealthy();
        },
        logTarget: "player",
        async content(event, trigger, player) {
            if (trigger.name == "phase") {
                await player.recover();
            } else {
                // 其与你各摸一张牌（“其”就是自己时分两段结算，共摸2张）
                await trigger.player.draw();
                await player.draw();
            }
        },
    },
//#noname-kit-end skill:seer_fangxinyongcun
    //阿尔忒弥斯
//#noname-kit-begin skill:seer_shousha
    seer_shousha: {
        onremove(player, skill) {
            delete player.storage[skill];
            player.removeTip(skill);
        },
        trigger: {
            player: ["phaseZhunbeiBegin", "phaseUseBegin", 'phaseUseEnd'],
        },
        popup: false,
        filter(event, player) {
            return event.name == "phaseZhunbei" || player.storage.seer_shousha;
        },
        async cost(event, trigger, player) {
            if (trigger.name == "phaseZhunbei") {
                event.result = await player
                    .chooseCardTarget({
                        prompt: get.prompt(event.skill),
                        prompt2: "你可弃置一张牌重新选择一名角色为“狩杀之的”。",
                        filterCard: lib.filter.cardDiscardable,
                        position: "he",
                        filterTarget(card, player, target) {
                            return target != player;
                        },
                        ai1(card) {
                            return 6 - get.value(card);
                        },
                        ai2(target) {
                            const player = get.player();
                            const att = get.attitude(player, target);
                            return -att;
                        },
                    })
                    .forResult();
                return;
            }
            event.result = { bool: true };
        },
        async content(event, trigger, player) {
            switch (event.triggername) {
                case "phaseZhunbeiBegin": {
                    await player.discard(event.cards);
                    const target = event.targets[0];
                    player.logSkill(event.name, target);
                    player.setStorage(event.name, target);
                    player.markSkill(event.name);
                    player.addTip(event.name, "狩杀之的" + " " + get.translation(target));
                }
                    break;
                case "phaseUseBegin": {
                    const target = player.storage[event.name];
                    if (!target?.isIn()) {
                        return;
                    }
                    player.logSkill(event.name, target);
                    if (target.maxHp == 1) {
                        return;
                    }
                    const num = Math.min(target.maxHp - 1, target.getDamagedHp() + 1);
                    if (num > 0) {
                        await target.loseMaxHp(num);
                        target.addMark("seer_shousha_counter", num, false);
                        await target.changeHujia(num);
                    }
                }
                    break;
                case "phaseUseEnd": {
                    const target = player.storage[event.name];
                    if (!target?.isIn() || !target.hujia || !target.hasMark("seer_shousha_counter")) {
                        return;
                    }
                    player.logSkill(event.name, target);
                    const num = target.hujia;
                    const result = await target.chooseBool(`你可以失去所有护盾并增加${num}点体力上限`).forResult();
                    if (result?.bool) {
                        player.clearMark("seer_shousha_counter", false);
                        await target.changeHujia(-target.hujia);
                        await target.gainMaxHp(num);
                    }
                }
                    break;
            }
        },
        intro: {
            content: "狩杀之的：$",
        },
    },
//#noname-kit-end skill:seer_shousha
//#noname-kit-begin skill:seer_guanyue
    seer_guanyue: {
        trigger: {
            player: "loseAfter",
            global: ["loseAsyncAfter", "equipAfter", "addJudgeAfter", "gainAfter", "addToExpansionAfter"],
        },
        forced: true,
        locked: false,
        filter(event, player) {
            if (event.getParent().name == "useCard") {
                return false;
            }
            return event.getl(player)?.hs?.length;
        },
        async content(event, trigger, player) {
            player.addSkill("seer_guanyue_effect");
        },
        subSkill: {
            effect: {
                mod: {
                    targetInRange(card) {
                        if (get.is.damageCard(card)) {
                            return true;
                        }
                    },
                },
                trigger: {
                    player: "useCard1",
                },
                forced: true,
                charlotte: true,
                popup: false,
                firstDo: true,
                filter(event, player) {
                    return get.is.damageCard(event.card);
                },
                async content(event, trigger, player) {
                    player.removeSkill(event.name);
                    player.addTempSkill("seer_guanyue_buff");
                    trigger.card._seer_guanyue_buffed = true;
                },
                mark: true,
                intro: {
                    content: "下一张伤害牌无距离限制，无视护甲与防具",
                },
            },
            buff: {
                trigger: {
                    source: "damageBegin1",
                },
                forced: true,
                charlotte: true,
                async content(event, trigger, player) {
                    trigger.nohujia = true;
                },
                ai: {
                    unequip: true,
                    skillTagFilter(player, tag, arg) {
                        if (arg?.card?._seer_guanyue_buffed) {
                            return true;
                        }
                        return false;
                    },
                },
            },
        },
    },
//#noname-kit-end skill:seer_guanyue
//#noname-kit-begin skill:seer_zhulie
    seer_zhulie: {
        trigger: {
            global: "dieAfter",
        },
        filter(event, player) {
            return event.player != player;
        },
        async content(event, trigger, player) {
            player
                .when({ global: "phaseEnd" })
                .then(async (event, trigger, player) => {
                    player.insertPhase("seer_zhulie");
                    if (_status.currentPhase == player) {
                        return;
                    }
                    const skills = player.getSkills(null, false, true).filter(skill => {
                        const info = get.info(skill);
                        return info && !info.charlotte && get.skillInfoTranslation(skill).length;
                    });
                    if (!skills.length) {
                        return;
                    }
                    const { links } = await player
                        .chooseButton({
                            createDialog: [`逐猎：选择失去一个技能`, [skills.map(skill => [skill, `${get.translation(skill)}:${get.skillInfoTranslation(skill)}`]), "textbutton"]],
                            forced: true,
                            ai(button) {
                                const player = get.player();
                                const skill = button.link;
                                const info = get.info(skill);
                                if (info.neg || info.halfneg) {
                                    return 1 + Math.random();
                                }
                                return 0;
                            },
                        })
                        .forResult();
                    if (links?.length) {
                        await player.removeSkills(links);
                    }
                });
        },
    },
//#noname-kit-end skill:seer_zhulie
    //莫妮卡
//#noname-kit-begin skill:seer_enzewanling
    seer_enzewanling: {
        nobracket: true,
        enable: "phaseUse",
        viewAs: {
            name: "wugu",
            isCard: true,
        },
        filter(event, player) {
            return player.countCards("hes") > 1;
        },
        filterCard(card) {
            return !card.hasGaintag("seer_shengyukongxin");
        },
        selectCard: [2, Infinity],
        position: "hes",
        check(card) {
            return 7 - get.value(card);
        },
        lose: false,
        discard: false,
        delay: false,
        log: false,
        async precontent(event, trigger, player) {
            player.logSkill("seer_enzewanling");
            await player.lose(event.result.cards, ui.cardPile, "insert");
            event.result.cards = [];
        },
        group: "seer_enzewanling_gain",
        subSkill: {
            gain: {
                trigger: {
                    global: "gainAfter",
                },
                forced: true,
                popup: false,
                filter(event, player) {
                    const evt = event.getParent("wugu", true)
                    return evt && evt.skill == "seer_enzewanling" && evt.player == player;
                },
                async content(event, trigger, player) {
                    trigger.player.addShownCards(trigger.cards, "visible_seer");
                },
            },
        },
    },
//#noname-kit-end skill:seer_enzewanling
//#noname-kit-begin skill:seer_shengyukongxin
    seer_shengyukongxin: {
        nobracket: true,
        getCards(player) {
            const cards = game.filterPlayer(target => {
                return target != player && target.getShownCards().length;
            })
                .reduce((list, target) => {
                    list.addArray(target.getShownCards());
                    return list;
                }, []);
            return cards;
        },
        hiddenCard(player, name) {
            if (player.hasCards("h")) {
                return false;
            }
            if (player.hasSkill("seer_shengyukongxin_used")) {
                return false;
            }
            const cards = get.info("seer_shengyukongxin").getCards(player);
            return cards.some(card => card.name === name);
        },
        onChooseToUse(event) {
            const player = event.player;
            if (player.hasCards("h")) {
                return;
            }
            if (game.online || player?.hasSkill("seer_shengyukongxin_used")) {
                return;
            }
            const hs = player.getCards("s", card => card.hasGaintag("seer_shengyukongxin"));
            if (hs.length) {
                game.deleteFakeCards(hs);
            }
            const cards = get.info("seer_shengyukongxin").getCards(player);
            if (cards.length) {
                player.directgains(game.createFakeCards(cards), null, "seer_shengyukongxin");
            }
        },
        onChooseToRespond(event) {
            const player = event.player;
            if (player.hasCards("h")) {
                return;
            }
            if (game.online || player?.hasSkill("seer_shengyukongxin_used")) {
                return;
            }
            const hs = player.getCards("s", card => card.hasGaintag("seer_shengyukongxin"));
            if (hs.length) {
                game.deleteFakeCards(hs);
            }
            const cards = get.info("seer_shengyukongxin").getCards(player);
            if (cards.length) {
                player.directgains(game.createFakeCards(cards), null, "seer_shengyukongxin");
            }
        },
        trigger: {
            player: ["useCardBefore", "respondBefore", "chooseToUseAfter", "chooseToRespondAfter"],
        },
        filter(event, player) {
            if (["useCard", "respond"].includes(event.name)) {
                const cards = get.info("seer_shengyukongxin").getCards(player);
                return event.cards?.some(card => cards.some(cardx => cardx.cardid == card._cardid));
            }
            return true;
        },
        forced: true,
        locked: false,
        popup: false,
        async content(event, trigger, player) {
            if (["useCard", "respond"].includes(trigger.name)) {
                player.logSkill(event.name);
                player.addTempSkill("seer_shengyukongxin_used");
                const cards = get.info("seer_shengyukongxin").getCards(player);
                for (let i = 0; i < trigger.cards.length; i++) {
                    const card = trigger.cards[i];
                    const cardx = cards.find(cardx => cardx.cardid == card._cardid);
                    if (cardx) {
                        trigger.cards[i] = cardx;
                        trigger.card.cards[i] = cardx;
                    }
                }
            }
            const cards = player.getCards("s", card => card.hasGaintag("seer_shengyukongxin"));
            if (cards.length) {
                game.deleteFakeCards(cards);
            }
        },
        subSkill: {
            used: {
                charlotte: true,
            },
        },
    },
//#noname-kit-end skill:seer_shengyukongxin
    //艾恩斯
//#noname-kit-begin skill:seer_fantianjunyan
    seer_fantianjunyan: {
        nobracket: true,
        trigger: {
            global: "useCard2",
        },
        filter(event, player) {
            return (
                get.tag(event.card, "fireDamage") &&
                game.hasPlayer(target => {
                    return !event.targets.includes(target) && lib.filter.targetEnabled2(event.card, event.player, target) && lib.filter.targetInRange(event.card, event.player, target);
                })
            );
        },
        async cost(event, trigger, player) {
            const targets = game.filterPlayer(target => {
                return !trigger.targets.includes(target) && lib.filter.targetEnabled2(trigger.card, trigger.player, target) && lib.filter.targetInRange(trigger.card, trigger.player, target);
            });
            if (!targets.length) {
                return;
            }
            event.result = await player
                .chooseTarget({
                    prompt: get.prompt(event.skill),
                    prompt2: `为${get.translation(trigger.card)}额外指定一个目标`,
                    filterTarget(card, player, target) {
                        return get.event().targets.includes(target);
                    },
                    targets,
                    ai(target) {
                        const player = get.player();
                        if (!player.hasSkill("seer_huozhongyongcun") && player.getHp() + player.countCards("hs", card => player.canSaveCard(card, player)) <= 1) {
                            return 0;
                        }
                        return get.effect(target, _status.event.getTrigger().card, player);
                    },
                })
                .forResult();
        },
        async content(event, trigger, player) {
            await player.loseHp();
            const cards = player.getCards("he", card => {
                return get.color(card) == get.color(trigger.card) && lib.filter.cardRecastable(card, player, "seer_fantianjunyan");
            });
            if (cards.length) {
                const result = await player
                    .chooseCard("he", [1, Infinity], true, `梵天君焱：重铸任意张${get.translation(get.color(trigger.card))}牌`, (card, player, target) => {
                        return get.event().cards.includes(card);
                    })
                    .set("cards", cards)
                    .set("ai", card => 7 - get.value(card))
                    .forResult();
                if (result?.bool && result.cards?.length) {
                    await player.recast(result.cards);
                }
            }
            const { targets } = event;
            trigger.targets.addArray(targets);
            game.log(targets, "成为了", trigger.card, "的额外目标");
        },
    },
//#noname-kit-end skill:seer_fantianjunyan
//#noname-kit-begin skill:seer_huozhongyongcun
    seer_huozhongyongcun: {
        nobracket: true,
        getCards() {
            const cards = [];
            for (var i = 0; i < ui.discardPile.childNodes.length; i++) {
                var card = ui.discardPile.childNodes[i];
                if (get.tag(card, "fireDamage")) cards.add(card);
            }
            return cards;
        },
        trigger: {
            global: "roundStart",
        },
        forced: true,
        locked: false,
        forceDie: true,
        filter(event, player) {
            return player.isDead();
        },
        async content(event, trigger, player) {
            game.broadcastAll(player => player.revive(2), player);
            const cards = get.info(event.name).getCards();
            if (cards.length) {
                await player.gain(cards, "gain2");
            }
        },
        ai: {
            threaten: 0.2,
        },
    },
//#noname-kit-end skill:seer_huozhongyongcun
    //沧岚
//#noname-kit-begin skill:seer_luoshuijinghong
    seer_luoshuijinghong: {
        nobracket: true,
        enable: "chooseToUse",
        usable: 1,
        hiddenCard(player, name) {
            if (name == "nanman") {
                return player.countCards("hes", { color: "black" }) > 1;
            }
            if (name == "taoyuan") {
                return player.countCards("hes", { suit: "red" }) > 1;
            }
        },
        viewAs(cards, player) {
            if (cards.length) {
                var name = false;
                switch (get.color(cards[0], player)) {
                    case "black":
                        name = "nanman";
                        break;
                    case "red":
                        name = "taoyuan";
                        break;
                }
                if (name) {
                    return { name: name };
                }
            }
            return null;
        },
        filterCard(card, player, event) {
            if (ui.selected.cards.length) {
                return get.color(card, player) == get.color(ui.selected.cards[0], player);
            }
            event = event || _status.event;
            var filter = event._backup.filterCard;
            var color = get.color(card, player);
            if (color == "black" && filter({ name: "nanman", cards: [card] }, player, event)) {
                return true;
            }
            if (color == "red" && filter({ name: "taoyuan", cards: [card] }, player, event)) {
                return true;
            }
            return false;
        },
        selectCard: 2,
        complexCard: true,
        position: "hes",
        filter(event, player) {
            var filter = event.filterCard;
            if (filter(get.autoViewAs({ name: "nanman" }, "unsure"), player, event) && player.countCards("hes", { color: "black" }) > 1) {
                return true;
            }
            if (filter(get.autoViewAs({ name: "taoyuan" }, "unsure"), player, event) && player.countCards("hes", { color: "red" }) > 1) {
                return true;
            }
            return false;
        },
        ai: {
            order(item, player) {
                return Math.max(get.order({ name: "nanman" }), get.order({ name: "taoyuan" })) + 0.2;
            },
            result: {
                player: (player) => {
                    return 1;
                },
            },
        },
        group: "seer_luoshuijinghong_effect",
        subSkill: {
            effect: {
                trigger: {
                    global: ["damageBegin3", "recoverBegin"],
                },
                forced: true,
                charlotte: true,
                filter(event, player) {
                    const evt = event.getParent("useCard")
                    return evt && evt.skill == "seer_luoshuijinghong" && evt.player == player;
                },
                async content(event, trigger, player) {
                    const target = trigger.player;
                    const result = await target
                        .chooseToGive(player, "he", `${get.translation(player)}对你发动了【${get.translation(event.name)}】`, `选择交给${get.translation(player)}一张牌并令此次你${trigger.name == "damage" ? "受到的伤害" : "回复的体力"}效果+1，否则你摸一张牌并获得${get.poptip("mbzhixi")}直到你的回合结束。`)
                        .set("ai", card => {
                            if (get.event().goon) {
                                return 0;
                            }
                            if (get.event().check) {
                                return 10 - get.value(card);
                            }
                            return 4 - get.value(card);
                        })
                        .set(
                            "check",
                            (() => {
                                const att = get.attitude(player, target);
                                return att > 0;
                            })()
                        )
                        .set(
                            "goon",
                            (() => {
                                if (trigger.name == "recover") {
                                    return false;
                                }
                                if (target.hasSkillTag("filterDamage", null, {
                                    player,
                                    card: trigger.card
                                })) {
                                    return false;
                                }
                                if (get.damageEffect(target, trigger.source, target, trigger.nature) > 0) {
                                    return true;
                                }
                                return false;
                            })()
                        )
                        .forResult();
                    if (result?.bool) {
                        trigger.num++;
                    } else {
                        await target.draw();
                        target.addTempSkill("mbzhixi", { player: "phaseEnd" });
                    }
                },
            },
        },
    },
//#noname-kit-end skill:seer_luoshuijinghong
//#noname-kit-begin skill:seer_canghaiyongcun
    seer_canghaiyongcun: {
        nobracket: true,
        trigger: {
            player: "useCard",
        },
        usable: 1,
        forced: true,
        async content(event, trigger, player) {
            if (player.hujia) {
                // 此牌无法被响应：挡【闪】等响应（directHit）与【无懈可击】（nowuxie）
                trigger.nowuxie = true;
                trigger.directHit.addArray(game.filterPlayer());
            } else {
                await player.changeHujia(1);
            }
        },
    },
//#noname-kit-end skill:seer_canghaiyongcun

    //罗姆怀特
//#noname-kit-begin skill:seer_shitu
    seer_shitu: {
        trigger: {
            global: "dying",
        },
        forced: true,
        locked: false,
        filter(event, player) {
            return event.player != player;
        },
        async content(event, trigger, player) {
            const next = player.addToExpansion(get.cards(), "draw");
            next.gaintag.add(event.name);
            await next;
        },
        intro: {
            content: "expansion",
            markcount: "expansion",
        },
        onremove(player, skill) {
            const cards = player.getExpansions(skill);
            if (cards.length) {
                player.loseToDiscardpile(cards);
            }
        },
        mod: {
            maxHandcard(player, num) {
                return num + player.getExpansions("seer_shitu").length;
            },
        },
    },
//#noname-kit-end skill:seer_shitu
//#noname-kit-begin skill:seer_yueshi
    seer_yueshi: {
        global: "seer_yueshi_mark",
        mod: {
            cardUsable(card, player) {
                if (typeof card == "object") {
                    return;
                }
                const cards = player.getCards("h");
                if (cards.indexOf(card) == 3) {
                    return Infinity;
                }
            },
        },
        trigger: {
            player: ["useCardAfter", "useCard1"],
        },
        popup: false,
        forced: true,
        locked: false,
        filter(event, player, name) {
            if (!event.seer_yueshi || !event.seer_yueshi[player.playerid]) {
                return false;
            }
            return true;
        },
        async content(event, trigger, player) {
            if (event.triggername == "useCardAfter") {
                if (trigger.seer_yueshi[player.playerid].includes(0)) {
                    const cards = player.getExpansions("seer_shitu");
                    if (!cards.length) {
                        return;
                    }
                    const result = await player
                        .chooseCardButton(`###${get.prompt(event.skill)}###你可弃置一张“诗”并将手牌摸至手牌上限`, cards)
                        .forResult();
                    if (result?.bool && result.links?.length) {
                        player.logSkill(event.name);
                        await player.loseToDiscardpile(result.links);
                        await player.drawTo(Math.min(4, player.getHandcardLimit()));
                    }
                }
                if (trigger.seer_yueshi[player.playerid].includes(1)) {
                    const result = await player.chooseCard("he", get.prompt(event.name), "选择一张牌作为“诗”").forResult();
                    if (result?.bool && result?.cards?.length) {
                        player.logSkill(event.name);
                        const next = player.addToExpansion(result.cards, player, "give");
                        next.gaintag.add("seer_shitu");
                        await next;
                    }
                }
                if (trigger.seer_yueshi[player.playerid].includes(2)) {
                    const cards = player.getExpansions("seer_shitu");
                    const suits = cards.reduce((list, card) => list.add(get.suit(card)), []);
                    if (suits.length < 4) {
                        return;
                    }
                    const result = await player
                        .chooseCardButton(`###${get.prompt(event.skill)}###你可弃置四张花色不同的“诗”并于当前回合结束时执行一个额外回合`, cards, 4)
                        .set("complexSelect", true)
                        .set("filterButton", button => {
                            return !ui.selected.buttons.some((buttonx) => get.suit(buttonx.link, false) == get.suit(button.link, false));
                        })
                        .forResult();
                    if (result?.bool && result.links?.length) {
                        player.logSkill(event.name);
                        await player.loseToDiscardpile(result.links);
                        player
                            .when({ global: "phaseEnd" })
                            .then(() => {
                                player.insertPhase("seer_yueshi");
                            });
                    }
                }
            } else {
                if (!trigger.seer_yueshi[player.playerid].includes(3)) {
                    return;
                }
                player.logSkill(event.name);
                if (trigger.addCount !== false) {
                    trigger.addCount = false;
                    const stat = player.getStat().card;
                    const name = trigger.card.name;
                    if (typeof stat[name] == "number") {
                        stat[name]--;
                    }
                }
            }
        },
        ai: {
            noSortCard: true,
        },
        subSkill: {
            mark: {
                charlotte: true,
                trigger: {
                    player: "useCardBegin",
                },
                filter(event, player) {
                    const cards = player.getCards("h");
                    if (!cards.length) {
                        return false;
                    }
                    return (event.cards || []).some(card => cards.slice(0, 4).includes(card));
                },
                forced: true,
                popup: false,
                content() {
                    const cards = player.getCards("h");
                    if (!trigger.seer_yueshi) {
                        trigger.seer_yueshi = {};
                    }
                    trigger.seer_yueshi[player.playerid] = trigger.cards.map(card => cards.indexOf(card));
                },
            },
            effect: {
                charlotte: true,
                onremove: true,
                trigger: {
                    player: "useCardToBegin",
                },
                filter(event, player) {
                    const storage = player.getStorage("seer_yueshi_effect");
                    return storage.some((list) => list[0] == event.card && list[2] == event.target);
                },
                forced: true,
                popup: false,
                firstDo: true,
                async content(event, trigger, player) {
                    const list = player.getStorage("seer_yueshi_effect").find((list2) => list2[0] == trigger.card && list2[2] == trigger.target);
                    trigger.setContent(lib.card[list[1].name].content);
                },
            },
        },
    },
//#noname-kit-end skill:seer_yueshi
    //琉梦
//#noname-kit-begin skill:seer_zhouyuan
    seer_zhouyuan: {
        trigger: {
            player: "phaseBegin",
        },
        forced: true,
        async content(event, trigger, player) {
            const next = player.addToExpansion(get.cards(), "draw");
            next.gaintag.add(event.name);
            await next;
        },
        intro: {
            markcount: "expansion",
            mark(dialog, content, player2) {
                var content = player2.getExpansions("seer_zhouyuan");
                if (content && content.length) {
                    if (player2 == game.me || player2.isUnderControl()) {
                        dialog.addAuto(content);
                    } else {
                        return "共有" + get.cnNumber(content.length) + "张咒怨牌";
                    }
                }
            },
            content(content, player2) {
                var content = player2.getExpansions("qixing");
                if (content && content.length) {
                    if (player2 == game.me || player2.isUnderControl()) {
                        return get.translation(content);
                    }
                    return "共有" + get.cnNumber(content.length) + "张咒怨牌";
                }
            },
        },
        group: ["seer_zhouyuan_use", "seer_zhouyuan_give"],
        subSkill: {
            use: {
                trigger: {
                    player: "useCardAfter",
                },
                forced: true,
                filter(event, player) {
                    return player.countCards("he") && player.getExpansions("seer_zhouyuan").some(card => get.suit(card) == get.suit(event.card));
                },
                async content(event, trigger, player) {
                    const hs = player.getCards("he");
                    if (!hs.length) {
                        return;
                    }
                    const result = hs.length == 1 ? { bool: true, cards: hs } : await player.chooseCard("he", true, "选择一张牌置于“咒怨”中").forResult();
                    if (result?.bool && result?.cards?.length) {
                        const next = player.addToExpansion(result.cards, player, "give");
                        next.gaintag.add("seer_zhouyuan");
                        await next;
                    }
                },
            },
            give: {
                trigger: {
                    player: "addToExpansionAfter",
                },
                forced: true,
                filter(event, player) {
                    console.dir(event.gaintag?.includes("seer_zhouyuan"))
                    if (!event.gaintag?.includes("seer_zhouyuan")) {
                        return false;
                    }
                    return player.getExpansions("seer_zhouyuan").length == 4;
                },
                async content(event, trigger, player) {
                    const cards = player.getExpansions("seer_zhouyuan");
                    await player.loseToDiscardpile(cards);
                    const target = game.findPlayer(target => get.is.playerNames(target, "seer_zhakesi"));
                    if (target?.isIn()) {
                        await player.loseMaxHp();
                        await target.gainMaxHp();
                    }
                    else {
                        await player.loseMaxHp();
                    }
                },
            },
        },
    },
//#noname-kit-end skill:seer_zhouyuan
//#noname-kit-begin skill:seer_shimeng
    seer_shimeng: {
        enable: "phaseUse",
        filter(event, player) {
            return !player.getStorage("seer_shimeng_block").length;
        },
        async content(event, trigger, player) {
            const result = await player.draw(4).set("gaintag", ["seer_shimeng"]).forResult();
            if (get.itemtype(result.cards) == "cards") {
                player.addSkill("seer_shimeng_block");
                player.markAuto("seer_shimeng_block", result.cards);
            }
        },
        ai: {
            order: 10,
            result: {
                player(player) {
                    return 1;
                },
            },
        },
        subSkill: {
            block: {
                // 条件：你「失去」这些牌（不限于进入弃牌堆）——使用、弃置、交给他人、置于武将牌上等任何失去方式都算
                trigger: {
                    player: ["loseAfter", "loseAsyncAfter"],
                },
                silent: true,
                charlotte: true,
                onremove: true,
                filter(event, player) {
                    const lost = (event.getl?.(player)?.cards || []).concat(event.cards || []);
                    return lost.some(card => player.hasStorage("seer_shimeng_block", card));
                },
                async content(event, trigger, player) {
                    const lost = (trigger.getl?.(player)?.cards || []).concat(trigger.cards || []);
                    const cards = lost.filter(card => player.hasStorage("seer_shimeng_block", card));
                    if (cards.length) {
                        player.unmarkAuto("seer_shimeng_block", cards);
                    }
                    if (!player.getStorage("seer_shimeng_block").length) {
                        player.removeSkill("seer_shimeng_block");
                    }
                },
            },
        },
    },
//#noname-kit-end skill:seer_shimeng
//#noname-kit-begin skill:seer_huayan
    seer_huayan: {
        trigger: {
            player: "die",
        },
        forced: true,
        forceDie: true,
        filter(event, player) {
            // 只在你不是因受到伤害而死亡时触发
            return !event.getParent("damage", true);
        },
        async content(event, trigger, player) {
            // ① 取消死亡并复活（联机要广播，否则客户端不会移除“已死亡”状态）。
            //    revive(4) 会把 hp 直接置为 4 且不检查上限，所以之后不能再把 hp 压回上限。
            trigger.cancel();
            game.broadcastAll(p => p.revive(4), player);
            // ② 换将必须在复活之后：濒死/死亡状态下换将会失败，表现就是“不变身”
            const from = player.name2 && get.character(player.name2)?.skills?.includes("seer_huayan") ? player.name2 : player.name1;
            await player.reinitCharacter(from, "seer_zhakesi");
            // ③ 体力上限校准到 4
            const diff = 4 - player.maxHp;
            if (diff > 0) {
                await player.gainMaxHp(diff);
            } else if (diff < 0) {
                await player.loseMaxHp(-diff);
            }
            // ④ 明确把体力回到 4：不能只靠 revive 设的 hp，换将后会丢，必须显式回复
            if (player.hp < 4) {
                await player.recover(4 - player.hp);
            }
            // ⑤ 摸四张牌
            await player.draw(4);
        },
    },
//#noname-kit-end skill:seer_huayan
    //咤克斯
//#noname-kit-begin skill:seer_fuyu
    seer_fuyu: {
        global: ["seer_fuyu_zhouyuan", "seer_fuyu_use", "seer_fuyu_give"],
        mod: {
            globalTo(from, to, distance) {
                return distance + Math.floor(to.maxHp / 2);
            },
        },
        trigger: {
            player: "phaseDrawBegin2",
        },
        forced: true,
        locked: false,
        filter(event, player) {
            return !event.numFixed;
        },
        async content(event, trigger, player) {
            trigger.num += Math.floor(player.maxHp / 2);
        },
        subSkill: {
            zhouyuan: {
                trigger: {
                    player: "phaseBegin",
                },
                forced: true,
                filter(event, player) {
                    if (!game.hasPlayer(target => {
                        if (!target.hasSkill("seer_fuyu") || !player.inRange(target)) {
                            return false;
                        }
                        return true;
                    })) {
                        return false;
                    }
                    return true;
                },
                async content(event, trigger, player) {
                    const next = player.addToExpansion(get.cards(), "draw");
                    next.gaintag.add("seer_zhouyuan");
                    await next;
                },
            },
            use: {
                trigger: {
                    player: "useCardAfter",
                },
                forced: true,
                filter(event, player) {
                    if (!game.hasPlayer(target => {
                        if (!target.hasSkill("seer_fuyu") || !player.inRange(target)) {
                            return false;
                        }
                        return true;
                    })) {
                        return false;
                    }
                    return player.countCards("he") && player.getExpansions("seer_zhouyuan").some(card => get.suit(card) == get.suit(event.card));
                },
                async content(event, trigger, player) {
                    const hs = player.getCards("he");
                    if (!hs.length) {
                        return;
                    }
                    const result = hs.length == 1 ? { bool: true, cards: hs } : await player.chooseCard("h", true, "选择一张牌置于“咒怨”中").forResult();
                    if (result?.bool && result?.cards?.length) {
                        const next = player.addToExpansion(result.cards, player, "give");
                        next.gaintag.add("seer_zhouyuan");
                        await next;
                    }
                },
            },
            give: {
                trigger: {
                    global: "addToExpansionAfter",
                },
                forced: true,
                filter(event, player) {
                    if (!game.hasPlayer(target => {
                        if (!target.hasSkill("seer_fuyu") || !player.inRange(target)) {
                            return false;
                        }
                        return true;
                    })) {
                        return false;
                    }
                    return event.gaintag.includes("seer_zhouyuan") && player.getExpansions("seer_zhouyuan").length == 4;
                },
                async content(event, trigger, player) {
                    const cards = player.getExpansions("seer_zhouyuan");
                    await player.loseToDiscardpile(cards);
                    const target = game.findPlayer(target => get.is.playerNames(target, "seer_zhakesi"));
                    if (target?.isIn()) {
                        await player.loseMaxHp();
                        await target.gainMaxHp();
                    }
                },
            },
        },
    },
//#noname-kit-end skill:seer_fuyu
//#noname-kit-begin skill:seer_linmou
    seer_linmou: {
        trigger: {
            source: "damageBegin2",
        },
        filter(event, player) {
            if (event.player == player) {
                return false;
            }
            return event.card && get.itemtype(event.cards) == "cards";
        },
        logTarget: "player",
        check(event, player) {
            var target = event.player;
            if (get.attitude(player2, target) >= 0) {
                return true;
            }
            return event.num == 1;
        },
        async content(event, trigger, player) {
            const target = trigger.player;
            trigger.cancel();
            if (get.itemtype(trigger.cards) != "cards") {
                return;
            }
            const cards = trigger.cards.filterInD("od");
            if (cards.length) {
                player.addSkill("seer_linmou_dis");
                if (player.storage?.seer_linmou_dis?.has(target)) {
                    player.storage.seer_linmou_dis.set(target, player.storage.seer_linmou_dis.get(target).addArray(cards))
                } else {
                    player.storage.seer_linmou_dis.set(target, cards);
                }
                const next = target.addToExpansion(cards, "gain2");
                next.gaintag.add("seer_zhouyuan");
                await next;
            }
        },
        subSkill: {
            dis: {
                mod: {
                    globalTo(from, to, num) {
                        const map = to.storage.seer_linmou_dis;
                        if (map instanceof Map && map.has(from)) {
                            return -Infinity;
                        }
                    },
                    globalFrom(from, to, num) {
                        const map = from.storage.seer_linmou_dis;
                        if (map instanceof Map && map.has(to)) {
                            return -Infinity;
                        }
                    },
                },
                init(player, skill) {
                    player.storage[skill] = new Map();
                },
                charlotte: true,
                onremove: true,
                trigger: {
                    global: ["loseAfter", "cardsDiscardAfter", "loseAsyncAfter", "equipAfter"],
                },
                silent: true,
                charlotte: true,
                onremove: true,
                filter(event, player) {
                    if (!(player.storage.seer_linmou_dis instanceof Map)) {
                        return false;
                    }
                    return event.getd().some(card => {
                        return Array.from(player.storage.seer_linmou_dis.values()).flat().includes(card);
                    });
                },
                async content(event, trigger, player) {
                    const map = player.storage.seer_linmou_dis;
                    const cards = trigger.getd().filter(card => {
                        return Array.from(map.values()).flat().includes(card);
                    });
                    const targets = Array.from(map.keys());
                    for (const target of targets) {
                        if (map.get(target).containsSome(...cards)) {
                            map.delete(target);
                        }
                    }
                },
            },
        },
    },
//#noname-kit-end skill:seer_linmou
    //艾恩斯
//#noname-kit-begin skill:seer_huozhong
    seer_huozhong: {
        limited: true,
        skillAnimation: false,
        animationColor: "fire",
        trigger: {
            player: "dyingBegin",
        },
        forced: true,
        async content(event, trigger, player) {
            player.recover(3 - player.hp)
            // 获取弃牌堆中的所有火焰伤害牌
            const fireDamageCards = [];
            for (var i = 0; i < ui.discardPile.childNodes.length; i++) {
                var card = ui.discardPile.childNodes[i];
                if (get.tag(card, "fireDamage")) {
                    fireDamageCards.push(card);
                }
            }
            // 获得这些牌
            if (fireDamageCards.length > 0) {
                await player.gain(fireDamageCards, "gain2");
                game.log(player, "获得了弃牌堆中的所有火焰伤害牌");
            }
            player.awakenSkill('seer_huozhong');
            // 失去此技能
            // player.removeSkill("seer_huozhong");
            game.log(player, "失去了【火种】技能");
        },


    },
//#noname-kit-end skill:seer_huozhong
    //燃心
//#noname-kit-begin skill:seer_ranxin
    seer_ranxin: {
        forced: true,
        trigger: {
            player: "phaseBegin",
        },

        async content(event, trigger, player) {
            // 从牌堆中寻找火焰伤害牌
            let fireDamageCard = null;
            let tempCards = [];

            // 遍历牌堆，寻找火焰伤害牌
            while (ui.cardPile.childNodes.length > 0 && !fireDamageCard) {
                const card = ui.cardPile.childNodes[0];
                tempCards.push(card);
                ui.cardPile.removeChild(card);

                if (get.tag(card, "fireDamage")) {
                    fireDamageCard = card;
                }
            }

            // 将非火焰伤害牌放回牌堆底
            for (let i = 0; i < tempCards.length; i++) {
                const card = tempCards[i];
                if (card !== fireDamageCard) {
                    ui.cardPile.appendChild(card);
                }
            }

            // 如果找到火焰伤害牌，获得它
            if (fireDamageCard) {
                await player.gain(fireDamageCard, "top");
                game.log(player, "获得了一张火焰伤害牌");
            } else {
                // 如果牌堆中没有火焰伤害牌，从牌堆顶摸一张牌
                const drawnCard = game.createCard();
                await player.gain(drawnCard, "top");
                game.log(player, "获得了一张牌");
            }

            // 流失一点体力
            await player.loseHp(1, "nosource", "lose");
            game.log(player, "流失了一点体力");
        },
        mod: {



            cardUsable(card, player, num) {
                // 检查是否是杀
                if (get.name(card) == "sha") {
                    // 杀使用次数+X（X为已损体力值）
                    const lostHp = player.maxHp - player.hp;
                    return num + lostHp;
                }
            }
        },
        ai: {
            result: {
                player(player) {
                    return 1;
                }
            }
        }
    },
//#noname-kit-end skill:seer_ranxin
    //南霜
//#noname-kit-begin skill:seer_zhefu
    seer_zhefu: {
        trigger: {
            global: "gainAfter",
        },
        usable: 1,
        filter(event, player) {
            // 检查是否是回合外获得牌
            if (event.player == _status.currentPhase) {
                return false;
            }
            // 检查获得的是否是牌
            return event.cards && event.cards.length > 0;
        },
        async content(event, trigger, player) {
            player.tempBanSkill(event.name, false, false);
            const target = trigger.player;

            // 确保target是有效的玩家对象
            if (!target || !target.chooseCard) {
                return;
            }

            // 让获得牌的角色选择一张伤害牌交给南霜
            const chooseResult = await target
                .chooseCard(
                    `你需要选择一张伤害牌交给${get.translation(player)}，否则本回合其他角色对你使用牌无次数限制`,
                    1, 1, "h"
                )
                .set("filterCard", card => {
                    const isDamage = get.tag(card, "damage") > 0.5;
                    return isDamage;
                })
                .set("ai", card => {
                    if (get.attitude(target, player) > 0) return 12 - get.value(card);
                    return false;
                })
                .forResult();
            // 检查结果是否有效
            if (chooseResult && chooseResult.cards && chooseResult.cards[0]) {
                // 目标选择了一张伤害牌交给玩家
                const damageCard = chooseResult.cards[0];



                await player.gain(damageCard);

                // 为此牌附魔冰属性
                player.addGaintag(damageCard, "seer_zhefu_ice");
                game.log(target, "交给了", player, "一张", damageCard);
            } else {
                // 目标取消选择或没有有效结果，触发第二个效果
                // 本回合其他角色对其使用牌无次数限制
                target.addMark("seer_zhefu_noLimit", 1);
                game.log(player, "令", target, "本回合被其他角色使用牌无次数限制");
            }
        },
        mod: {
            cardnature(card, player) {
                if (card.hasGaintag("seer_zhefu_ice")) return "ice";
            },
        },
        global: ["seer_zhefu_noLimit"],
        subSkill: {
            noLimit: {
                direct: true,
                forced: true,
                mod: {
                    cardUsableTarget: function (card, player, target) {
                        if (target.hasMark("seer_zhefu_noLimit")) {
                            return true;
                        }
                    }
                },
            },
        },
    },
//#noname-kit-end skill:seer_zhefu
//#noname-kit-begin skill:seer_hanlu
    seer_hanlu: {
        trigger: {
            global: "useCardAfter",
        },
        usable: 1,
        locked: false,
        onremove(player, skill) {
            player.removeGaintag(skill);
        },
        filter(event, player) {
            return get.tag(event.card, "damage") > 0.5 && !game.hasPlayer2(target => {
                return target.hasHistory("sourceDamage", evt => evt.card == event.card);
            });
        },
        async content(event, trigger, player) {
            const cards = trigger.cards.filterInD("od");

            for (const target of trigger.targets) {
                await target.changeHujia(1)
                await target.draw()
            }
        },

    },
//#noname-kit-end skill:seer_hanlu
//#noname-kit-begin skill:seer_zhufa
    seer_zhufa: {
        trigger: {
            source: "damageBegin1",
        },
        forced: true,
        filter(event, player) {
            return event.player.hujia;
        },
        logTarget: "player",
        async content(event, trigger, player) {
            trigger.num = trigger.player.hujia * 2;
        },
    },
//#noname-kit-end skill:seer_zhufa
    //沧岚
//#noname-kit-begin skill:seer_luanyu
    seer_luanyu: {

        enable: "phaseUse",
        selectCard: 2,
        position: 'h',
        group: ['seer_luanyu_effect', 'seer_luanyu_cleanup'],
        filterCard: function (card, player) {
            // 初始化存储
            if (!player.storage.seer_luanyu) {
                player.storage.seer_luanyu = {
                    blackUsed: false,
                    redUsed: false
                };
            }

            // 检查是否是黑色或红色牌
            const color = get.color(card);
            if (color !== 'black' && color !== 'red') {
                return false;
            }

            // 检查本回合是否已经使用过该颜色
            if (color === 'black' && player.storage.seer_luanyu.blackUsed) {
                return false;
            }
            if (color === 'red' && player.storage.seer_luanyu.redUsed) {
                return false;
            }

            // 如果已经选择了第一张牌，第二张牌必须与第一张同色
            if (ui.selected.cards && ui.selected.cards.length > 0) {
                const firstCardColor = get.color(ui.selected.cards[0]);
                return color === firstCardColor;
            }
            return true;
        },
        filter: function (event, player) {
            // 初始化存储
            if (!player.storage.seer_luanyu) {
                player.storage.seer_luanyu = {
                    blackUsed: false,
                    redUsed: false
                };
            }

            // 检查是否可以发动技能
            const blackUsed = player.storage.seer_luanyu.blackUsed;
            const redUsed = player.storage.seer_luanyu.redUsed;

            // 检查是否有足够的同色牌
            const hasBlackCards = player.countCards('h', card => get.color(card) === 'black') >= 2;
            const hasRedCards = player.countCards('h', card => get.color(card) === 'red') >= 2;

            return (hasBlackCards && !blackUsed) || (hasRedCards && !redUsed);
        },
        content: function () {
            'step 0'
            // 获取选择的牌
            const cards = event.cards;
            if (cards.length !== 2) return;

            // 检查牌的颜色
            const color1 = get.color(cards[0]);
            const color2 = get.color(cards[1]);

            // 确保两张牌颜色相同
            if (color1 !== color2) {
                game.log(player, "选择的两张牌颜色必须相同！");
                return;
            }

            // 标记已使用
            if (color1 === 'black') {
                player.storage.seer_luanyu.blackUsed = true;
                // 视为使用万箭齐发
                player.chooseUseTarget(true, false, {
                    name: 'wanjian'
                }, 'nodistance').cards = cards;
            } else if (color1 === 'red') {
                player.storage.seer_luanyu.redUsed = true;
                // 视为使用桃园结义
                player.chooseUseTarget(true, false, {
                    name: 'taoyuan'
                }, 'nodistance').cards = cards;
            }
        },
        subSkill: {
            cleanup: {
                skill_id: 'seer_luanyu_cleanup',
                direct: true,
                forced: true,
                trigger: { player: "phaseEnd" },
                content: function (event, trigger, player) {
                    // 清理本回合使用状态
                    if (player.storage.seer_luanyu) {
                        delete player.storage.seer_luanyu;
                    }
                },
            },
            effect: {
                skill_id: 'seer_luanyu_effect',
                direct: true,
                forced: true,
                trigger: { global: ['damageBegin', 'recoverBegin'] },
                filter: function (event, player) {
                    // 检查是否是因为万箭齐发或桃园结义受到影响
                    const parent = event.getParent(4);
                    return parent && parent.name === 'seer_luanyu';
                },
                content: function () {
                    'step 0';
                    trigger.player.chooseCard(`交给${get.translation(player)}一张牌令此数值+1否则摸一张牌并获得【止息】直到你的回合结束`, 'h').set('ai', function (card) {
                        if (get.attitude(_status.event.player, _status.event.getParent().player) > 0) {
                            return 12 - get.value(card);
                        } else {
                            return false;
                        }
                    });
                    'step 1';
                    if (result.bool) {
                        player.gain(result.cards[0]);
                        trigger.num++;
                    } else {
                        trigger.player.draw(1);
                        trigger.player.addTempSkill('mbzhixi', {
                            player: 'phaseAfter'
                        });
                    }
                },
            },
        },
    },
//#noname-kit-end skill:seer_luanyu
    //莎草
//#noname-kit-begin skill:seer_wanlilu
    seer_wanlilu: {
        nobracket: true,
        trigger: { player: "loseAfter" },
        filter(event, player) {
            // 检查是否在回合外失去牌
            if (player == _status.currentPhase) {
                return false;
            }
            // 检查失去的牌是否来自判定区
            if (event.parent.cards[0] && event.parent.cards[0].original && event.parent.cards[0].original === 'j') {
                return false;
            }
            console.log(event.parent.cards);
            // 检查是否有蓄谋牌
            return player.countCards('j', card =>
                (card.viewAs || card.name) === "xumou_jsrg"
            ) > 0;
        },
        async content(event, trigger, player) {
            // 选择目标角色
            const targetResult = await player.chooseTarget(
                "选择一名角色观看你的蓄谋牌",
                true
            ).forResult();

            if (targetResult.bool) {
                const target = targetResult.targets[0];
                // 获取蓄谋牌
                const xumouCards = player.getCards('j', card =>
                    (card.viewAs || card.name) === "xumou_jsrg"
                );

                if (xumouCards.length > 0) {
                    // 目标角色观看蓄谋牌




                    // 目标角色选择一张蓄谋牌获得
                    const chooseResult = await target.chooseCardButton(
                        xumouCards,
                        "选择一张蓄谋牌获得",
                        [1, 1]
                    ).forResult();

                    if (chooseResult.bool && chooseResult.links && chooseResult.links.length > 0) {
                        const selectedCard = chooseResult.links[0];
                        // 从判定区移除牌
                        await player.loseToDiscardpile(selectedCard);
                        // 目标获得牌
                        await target.gain([selectedCard]);
                        game.log(target, "获得了", selectedCard);
                    }
                }
            }
        },
    },
//#noname-kit-end skill:seer_wanlilu
//#noname-kit-begin skill:seer_wanjuanshu
    seer_wanjuanshu: {
        nobracket: true,
        enable: "phaseUse",
        usable: Infinity,
        group: ['seer_wanjuanshu_cleanup'],
        filter(event, player) {
            // 计算本回合发动次数
            const useCount = player.storage.seer_wanjuanshu ? player.storage.seer_wanjuanshu.useCount + 1 : 1;
            // 检查手牌数量是否足够蓄谋useCount次
            const handCardCount = player.countCards('h');
            return handCardCount >= useCount;
        },
        async content(event, trigger, player) {
            // 初始化本回合发动次数
            if (!player.storage.seer_wanjuanshu) {
                player.storage.seer_wanjuanshu = {
                    useCount: 0
                };
            }

            // 增加发动次数
            player.storage.seer_wanjuanshu.useCount++;
            const X = player.storage.seer_wanjuanshu.useCount;

            // 蓄谋X次（必须完成）
            for (let i = 0; i < X; i++) {
                // 选择一张牌（强制选择）
                const result = await player.chooseCard('h', 1, "选择一张牌作为蓄谋牌").set("forced", true).forResult();
                if (result.bool) {
                    const card = result.cards[0];
                    // 将牌作为蓄谋牌置入判定区
                    await player.addJudge({ name: "xumou_jsrg" }, [card]);
                    game.log(player, "将", card, "作为蓄谋牌置入判定区");
                }
            }

            // 摸一张牌
            await player.draw(1);
            game.log(player, "摸了一张牌");
        },
        subSkill: {
            cleanup: {
                skill_id: 'seer_wanjuanshu_cleanup',
                direct: true,
                forced: true,
                trigger: { player: "phaseEnd" },
                async content(event, trigger, player) {
                    // 清理本回合发动次数
                    if (player.storage.seer_wanjuanshu) {
                        delete player.storage.seer_wanjuanshu;
                    }
                },
            },
        },
    },
//#noname-kit-end skill:seer_wanjuanshu
    //鬼面幽蝶
//#noname-kit-begin skill:seer_yingsuo
    seer_yingsuo: {
        forced: true,
        trigger: {
            player: ['useCardEnd']
        },
        filter: function (event, player) {
            console.log(event.name);
            if (event.name === 'useCard') {
                // 检查是否是基本牌

                const card = event.card;

                return card && get.type(card) !== 'equip';
            }
            return false;
        },
        async content(event, trigger, player) {

            if (trigger.name === 'useCard') {
                // 基本牌结算后获得一张影
                await player.gain(game.createCard({ name: 'ying' }));
                game.log(player, "获得了一张【影】");
            }
        },
    },
//#noname-kit-end skill:seer_yingsuo
//#noname-kit-begin skill:seer_yingguang
    seer_yingguang: {
        enable: "phaseUse",
        filter(event, player) {
            if (!game.hasPlayer(target => lib.skill.seer_yingguang.filterTarget(null, player, target))) {
                return false;
            }
            // 手牌均不可用：没有任何一张手牌能在当前阶段正常使用
            return !player.getCards("h").some(card => player.hasUseTarget(card, true, true));
        },
        filterTarget(card, player, target) {
            return target !== player && target.countCards("h") < player.countCards("h");
        },
        selectTarget: 1,
        async content(event, trigger, player) {
            const target = event.target;
            if (!target || !player.isIn() || !target.isIn()) {
                return;
            }
            await player.swapHandcards(target);
            game.log(player, "与", target, "交换了手牌");
        },
        ai: {
            order: 1,
            result: {
                player: 1,
                target: 1,
            },
        },
    },
//#noname-kit-end skill:seer_yingguang
    //东辉
//#noname-kit-begin skill:seer_jingzhe
    seer_jingzhe: {
        trigger: {
            player: "phaseAnyEnd",
        },
        usable: 1,
        filter(event, player) {
            return player.maxHp != player.countCards("h");
        },
        async cost(event, trigger, player) {
            const list = Array.from({ length: player.maxHp }, (_, index) => get.cnNumber(index + 1));
            event.result = await player
                .chooseControl(list, "cancel2")
                .set("prompt", get.prompt2(event.skill))
                .set("ai", () => {
                    const player = get.player();
                    if (player.countCards("h") < player.maxHp) {
                        return player.maxHp + 1;
                    }
                    return "cancel2";
                })
                .forResult();
            if (event.result.control != "cancel2") {
                event.result.cost_data = event.result.index + 1;
            }
        },
        async content(event, trigger, player) {
            const num = player.maxHp - player.countCards("h");
            if (num >= 0) {
                await player.drawTo(player.maxHp);
            } else if (player.countDiscardableCards(player, "h")) {
                await player.chooseToDiscard(player.countCards("h") - player.maxHp, true);
            }
            player.addTempSkill("seer_jingzhe_effect");
        },
        subSkill: {
            effect: {
                group: "seer_jingzhe_use",
                mod: {
                    cardEnabled(card, player, target) {
                        if (!lib.suit.includes(get.suit(card))) {
                            return;
                        }
                        if (!player.getStorage("seer_jingzhe_effect").includes(get.suit(card))) return false;
                    },
                    cardSavable(card, player, target) {
                        if (!lib.suit.includes(get.suit(card))) {
                            return;
                        }
                        if (!player.getStorage("seer_jingzhe_effect").includes(get.suit(card))) return false;
                    },
                },
                charlotte: true,
                init(player, skill) {
                    const suits = get
                        .discarded()
                        .map(c => get.suit(c))
                        .unique();
                    player.markAuto(skill, suits);
                },
                onremove: true,
                popup: false,
                trigger: {
                    global: ["loseAfter", "loseAsyncAfter", "cardsDiscardAfter"],
                },
                silent: true,
                filter(event, player) {
                    return event.getd()?.someInD("od");
                },
                async content(event, trigger, player) {
                    const suits = trigger.getd().filterInD("od")
                        .map(c => get.suit(c))
                        .unique();
                    player.markAuto(event.name, suits);
                },
                mark: true,
                intro: {
                    content: "中央区的花色：$",
                },
            },
            use: {
                trigger: {
                    player: "useCard2",
                },
                popup: false,
                charlotte: true,
                filter(event, player) {
                    if (get.type(event.card) != "basic" && get.type(event.card) != "trick") {
                        return false;
                    }
                    var info = get.info(event.card);
                    if (info.allowMultiple == false) {
                        return false;
                    }
                    if (event.targets && !info.multitarget) {
                        if (
                            game.hasPlayer(function (current) {
                                return lib.filter.targetEnabled2(event.card, player, current) && !event.targets.includes(current);
                            })
                        ) {
                            return true;
                        }
                    }
                    return false;
                },
                async cost(event, trigger, player) {
                    var prompt2 = "为" + get.translation(trigger.card) + "额外指定一个目标";
                    event.result = await player
                        .chooseTarget(get.prompt(event.skill), function (card, player, target) {
                            var player = _status.event.player;
                            if (_status.event.targets.includes(target)) {
                                return false;
                            }
                            return lib.filter.targetEnabled2(_status.event.card, player, target);
                        })
                        .set("prompt2", prompt2)
                        .set("ai", function (target) {
                            var trigger = _status.event.getTrigger();
                            var player = _status.event.player;
                            return get.effect(target, trigger.card, player, player);
                        })
                        .set("targets", trigger.targets)
                        .set("card", trigger.card)
                        .forResult();
                },
                async content(event, trigger, player) {
                    if (!event.isMine() && !event.isOnline()) {
                        await game.delay();
                    }
                    player.line(event.targets);
                    trigger.targets.addArray(event.targets);
                },
            },
        },
    },
//#noname-kit-end skill:seer_jingzhe
//#noname-kit-begin skill:seer_jingmo
    seer_jingmo: {
        trigger: {
            source: "damageSource",
            player: "damageEnd",
        },
        usable: 1,
        filter(event, player) {
            return event.source?.isIn();
        },
        logTarget: "source",
        check(event, player) {
            if (event.source == player) return true;
            return get.attitude(player, event.source) < 0;
        },
        async content(event, trigger, player) {
            const next = trigger.source.phaseDiscard();
            event.next.remove(next);
            trigger.next.push(next);
        },
    },
//#noname-kit-end skill:seer_jingmo
//#noname-kit-begin skill:seer_shizui
    seer_shizui: {
        trigger: {
            player: "phaseDiscardBegin",
        },
        forced: true,
        async content(event, trigger, player) {
            if (get.discarded().length >= player.getHp(true)) {
                const list = get.inpileVCardList(info => {
                    const name = info[2], type = get.type(name), infox = get.info({ name: name });
                    return type == "basic" && player.hasUseTarget({ name: name }, true, false);
                });
                if (!list.length) {
                    return;
                }
                event.result = await player
                    .chooseButton(["视为使用一张基本牌", [list, "vcard"]], true)
                    .set("ai", function (button) {
                        var player = _status.event.player;
                        var card = {
                            name: button.link[2],
                            nature: button.link[3],
                            isCard: true,
                        };
                        if (card.name == "tao") {
                            if (player.hp == 1 || (player.hp == 2 && !player.hasShan("all")) || player.needsToDiscard()) {
                                return 5;
                            }
                            return 1;
                        }
                        if (card.name == "sha") {
                            if (
                                game.hasPlayer(function (current) {
                                    return player.canUse(card, current) && get.effect(current, card, player, player) > 0;
                                })
                            ) {
                                if (card.nature == "fire") {
                                    return 2.95;
                                }
                                if (card.nature == "thunder" || card.nature == "ice") {
                                    return 2.92;
                                }
                                return 2.9;
                            }
                            return 0;
                        }
                        if (card.name == "jiu") {
                            return 0.5;
                        }
                        return 0;
                    })
                    .forResult();
                const card = { name: event.result.links[0][2], nature: event.result.links[0][3], isCard: true };
                if (player.hasUseTarget(card, true, false)) {
                    await player.chooseUseTarget(card, true, false);
                }
                return;
                game.broadcastAll(function (card) {
                    lib.skill.seer_shizui_backup.viewAs = card;
                }, card);
                const next = player.chooseToUse();
                next.set("openskilldialog", `###${get.translation(event.name)}###是否将一张牌当做【${get.translation(card.name)}】使用？`);
                next.set("norestore", true);
                next.set("addCount", false);
                next.set("_backupevent", `${event.name}_backup`);
                next.set("custom", {
                    add: {},
                    replace: { window() { } },
                });
                next.backup(`${event.name}_backup`);
                await next;
            } else {
                await player.discard(player.getCards("h"));
            }
        },
        subSkill: {
            backup: {
                filterCard(card) {
                    return get.itemtype(card) == "card";
                },
                position: "hes",
                selectCard: 1,
                check: card => 8 - get.value(card),
                popname: true,
                log: false,
            },
        },
    },
//#noname-kit-end skill:seer_shizui
    //盖亚
//#noname-kit-begin skill:seer_guiyuan
    seer_guiyuan: {
        trigger: {
            source: "damageBegin1",
            player: "damageBegin3",
        },
        forced: true,
        zhuanhuanji(player, skill) {
            player.addMark(skill, 1, false);
        },
        zhuanhuanLimit: 3,
        mark: true,
        marktext: "☯",
        intro: {
            content(storage, player, skill) {
                const index = player.countMark("seer_guiyuan") % 3;
                return [
                    "天：当你造成或受到伤害前：摸两张牌",
                    "邪：当你造成或受到伤害前：令此伤害+1",
                    "血：当你造成或受到伤害前：令此伤害-1",
                ][index];
            },
        },
        async content(event, trigger, player) {
            await player.changeZhuanhuanji(event.name);
            const index = player.countMark(event.name) % 3;
            switch (index) {
                case 1: {
                    await player.draw(2);
                }
                    break;
                case 2: {
                    trigger.num++;
                }
                    break;
                case 0: {
                    trigger.num--;
                }
                    break;
            }
        },
    },
//#noname-kit-end skill:seer_guiyuan
//#noname-kit-begin skill:seer_aofa
    seer_aofa: {
        derivation: "tiaoxin",
        enable: "phaseUse",
        usable: 1,
        filterTarget(card, player, target) {
            return target != player && target.inRange(player) && target.countCards("he") > 0;
        },
        selectTarget: [1, Infinity],
        multitarget: true,
        async content(event, trigger, player) {
            for (const target of event.targets) {
                const result = await target
                    .chooseToUse(
                        function (card, player, event) {
                            if (get.name(card) != "sha") {
                                return false;
                            }
                            return lib.filter.filterCard.apply(this, arguments);
                        },
                        "挑衅：对" + get.translation(player) + "使用一张杀，或令其弃置你的一张牌"
                    )
                    .set("targetRequired", true)
                    .set("complexSelect", true)
                    .set("complexTarget", true)
                    .set("filterTarget", function (card, player, target) {
                        if (target != _status.event.sourcex && !ui.selected.targets.includes(_status.event.sourcex)) {
                            return false;
                        }
                        return lib.filter.filterTarget.apply(this, arguments);
                    })
                    .set("sourcex", player)
                    .forResult();
                if (result.bool == false && target.countCards("he") > 0) {
                    const result2 = await player.discardPlayerCard(target, "he", true).forResult();
                    if (result2?.bool && result2.links?.length) {
                        const card = result2.links[0];
                        if (player.hasUseTarget(card, true, false)) {
                            await player.chooseUseTarget(card, false);
                        }
                    }
                }
            }
        },
        ai: {
            order: 4,
            expose: 0.2,
            result: {
                target: -1,
                player(player, target) {
                    if (target.countCards("h") == 0) {
                        return 0;
                    }
                    if (target.countCards("h") == 1) {
                        return -0.1;
                    }
                    if (player.hp <= 2) {
                        return -2;
                    }
                    if (player.countCards("h", "shan") == 0) {
                        return -1;
                    }
                    return -0.5;
                },
            },
            threaten: 1.1,
        },
    },
//#noname-kit-end skill:seer_aofa
//#noname-kit-begin skill:seer_yunshang
    seer_yunshang: {
        trigger: {
            player: "damageBegin4"
        },
        popup: false,
        filter(event, player) {
            return event.num >= player.hp;
        },
        async cost(event, trigger, player) {
            event.result = await player
                .chooseTarget(get.prompt2(event.skill), lib.filter.notMe)
                .set("ai", target => {
                    var player = _status.event.player,
                        evt = _status.event.getTrigger();
                    return get.damageEffect(target, evt.source, player, evt.nature) - _status.event.eff;
                })
                .set("eff", get.damageEffect(player, trigger.source, player, trigger.nature))
                .forResult();
        },
        async content(event, trigger, player) {
            const target = event.targets[0];
            player.logSkill(event.name, target);
            player.awakenSkill(event.name);
            trigger.cancel();
            const next = target.damage();
            await next;
            if (
                game.getGlobalHistory("everything", evt => {
                    if (evt.name != "die" || evt.player != target) {
                        return false;
                    }
                    return evt.getParent(2) == next;
                }).length
            ) {
                player.restoreSkill(event.name);
            }
        },
    },
//#noname-kit-end skill:seer_yunshang
    //逐界苍星
//#noname-kit-begin skill:seer_jiegou
    seer_jiegou: {
        trigger: {
            global: "useCard",
        },
        filter(event, player) {
            if (!["basic", "trick"].includes(get.type(event.card))) {
                return false;
            }
            console.log(player.getStorage("seer_jiegou"), event.name, event.card.name)
            return (!player.getStorage("seer_jiegou").length && player.countCards('he')) || player.hasStorage('seer_jiegou', event.card.name);
        },
        usable: 1,
        logTarget: "player",
        check(event, player) {
            if (!player.getStorage("seer_jiegou").length) {
                var effect = 0;
                if (!event.targets.length && get.info(event.card, false).notarget) {
                    effect -= get.effect(event.player, event.card, event.player, player);
                }
                for (var i of event.targets) {
                    effect -= get.effect(i, event.card, event.player, player);
                }
                return effect > 0;
            } else {
                return get.attitude(player, event.player) > 0;
            }
        },
        prompt2(event, player) {
            if (!player.getStorage("seer_jiegou").length) {
                return `你可取消${get.translation(event.card)}并将此牌名记录为“解构”`;
            } else {
                return `你可移除“解构”并令${get.translation(event.player)}摸两张牌`;
            }
        },
        async content(event, trigger, player) {
            if (!player.getStorage(event.name).length) {
                trigger.targets.length = 0;
                trigger.all_excluded = true;
                player.chooseToDiscard("he", 1, true)
                game.log(player, "取消了", trigger.card, "的所有目标");
                player.markAuto(event.name, [trigger.card.name]);
            } else {
                player.unmarkAuto(event.name, [trigger.card.name]);
                await trigger.player.draw(2);
            }
        },
        onremove: true,
        intro: {
            content: "已解构牌名：$",
        },
    },
//#noname-kit-end skill:seer_jiegou
//#noname-kit-begin skill:seer_zaishu
    seer_zaishu: {
        enable: ["chooseToUse", "chooseToRespond"],
        getUsed: player => {
            return player.getStorage("seer_jiegou");
        },
        getNum: player => {
            return player.countMark("seer_zaishu_counter");
        },
        init(player, skill) {
            player.addTempSkill("seer_zaishu_counter");
            if (!player.countMark("seer_zaishu_counter")) {
                const num = player.getHistory("useCard").length;
                if (num > 0) {
                    player.addMark("seer_zaishu_counter", num, false);
                }
            }
        },
        hiddenCard(player, name) {
            if (get.type(name) != "basic" && get.type(name) != "trick") {
                return false;
            }
            if (!get.info("seer_zaishu").getUsed(player).includes(name)) {
                return false;
            }
            return player.countCards("hes") > 1 && lib.inpile.includes(name);
        },
        filter(event, player) {
            if (player.countCards("hes") < 1) {
                return false;
            }
            return get
                .inpileVCardList(info => {
                    const name = info[2];
                    if (get.type(name) != "basic" && get.type(name) != "trick") {
                        return false;
                    }
                    return (event.seer_zaishu || []).includes(name);
                })
                .some(card => event.filterCard(get.autoViewAs({ name: card[2], nature: card[3] }, "unsure"), player, event));
        },
        onChooseToUse(event) {
            if (!game.online && !event.seer_zaishu) {
                const player = event.player;
                event.set("seer_zaishu", get.info("seer_zaishu").getUsed(player));
            }
        },
        onChooseToRespond(event) {
            if (!game.online && !event.seer_zaishu) {
                const player = event.player;
                event.set("seer_zaishu", get.info("seer_zaishu").getUsed(player));
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
                        return (event.seer_zaishu || []).includes(name);
                    })
                    .filter(card => event.filterCard(get.autoViewAs({ name: card[2], nature: card[3] }, "unsure"), player, event));
                const dialog = ui.create.dialog("再书", [list, "vcard"]);
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
                    filterCard() {
                        const player = get.player();
                        return 1 + get.info("seer_zaishu").getNum(player);
                    },
                    selectCard() {
                        const player = get.player();
                        return 1 + get.info("seer_zaishu").getNum(player);
                    },
                    popname: true,
                    viewAs: {
                        name: links[0][2],
                        isCard: true,
                    },
                    ai1(card) {
                        const player = get.event().player;
                        const name = lib.skill.seer_zaishu_backup.viewAs.name;
                        if (ui.selected.cards.length > 2 || card.name == name) {
                            return 0;
                        }
                        return 1 / (get.value(card) || 0.5);
                    },
                    position: "hes",
                };
            },
            prompt(links, player) {
                const num = 1 + get.info("seer_zaishu").getNum(player);
                return `弃置${num}张牌视为使用或打出` + get.translation(links[0][3] || "") + "【" + get.translation(links[0][2]) + "】";
            },
        },
        ai: {
            combo: "seer_jiegou",
            order(item, player) {
                if (player && get.event().type == "phase") {
                    let list = get
                        .inpileVCardList(info => {
                            const name = info[2];
                            if (get.type(name) != "basic" && get.type(name) != "trick") {
                                return false;
                            }
                            return get.info("seer_zaishu").getUsed(player).includes(name);
                        })
                        .map(card => {
                            return { name: card[2], nature: card[3] };
                        })
                        .filter(card => player.getUseValue(card, true, true) > 0);
                    if (!list.length) {
                        return 0;
                    }
                    list.sort((a, b) => (player.getUseValue(b, true, true) || 0) - (player.getUseValue(a, true, true) || 0));
                    return get.order(list[0], player) * 0.99;
                }
                return 0.001;
            },
            respondSha: true,
            respondShan: true,
            skillTagFilter(player, tag, arg) {
                if (arg == "respond") {
                    return false;
                }
                const name = tag == "respondSha" ? "sha" : "shan";
                return get.info("seer_zaishu").hiddenCard(player, name);
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
        group: "seer_zaishu_record",
        subSkill: {
            record: {
                trigger: {
                    global: "phaseBegin",
                },
                forced: true,
                popup: false,
                firstDo: true,
                charlotte: true,
                async content(event, trigger, player) {
                    player.addTempSkill("seer_zaishu_counter");
                },
            },
            counter: {
                trigger: {
                    player: "useCard1",
                },
                forced: true,
                popup: false,
                firstDo: true,
                charlotte: true,
                onremove: true,
                async content(event, trigger, player) {
                    player.addMark(event.name, 1, false);
                },
            },
            backup: {},
        },
    },
//#noname-kit-end skill:seer_zaishu
    //西叶
//#noname-kit-begin skill:seer_fusang
    seer_fusang: {
        enable: "chooseToUse",
        usable: 1,
        viewAs: {
            name: "tao",
            isCard: true,
            storage: {
                seer_fusang: true,
            },
        },
        locked: false,
        filterCard: () => false,
        selectCard: -1,
        ignoreMod: true,
        filterTarget: true,
        selectTarget: 1,
        log: false,
        async precontent(event, trigger, player) {
            player.logSkill("seer_fusang");
            const target = event.result.targets[0];

            const card = get.cardPile("du") || game.createCard2({ name: "du", suit: "spade", number: '1' });
            console.log(card)
            if (card) {
                await target.gain(card, "gain2");
            }
            if (target == player) return;
            player
                .when("useCardAfter")
                .filter(evt => evt.skill == "seer_fusang")
                .step(async (event, trigger, player) => {
                    if (target.hp != player.hp) return;
                    if (game.hasGlobalHistory("changeHp", evt => {
                        return evt.player == target && evt.getParent().name == "recover" && evt.getParent().card == trigger.card;
                    })) {
                        delete player.getStat("skill").seer_fusang;
                    }
                });
        },
        mod: {
            cardEnabled(card, player) {
                if (card.name == "tao" && card.storage?.seer_fusang) return true;
            },
            targetEnabled(card, player, target) {
                if (card.name == "tao" && card.storage?.seer_fusang) return true;
            },
        },
    },
//#noname-kit-end skill:seer_fusang
//#noname-kit-begin skill:seer_ruomu
    seer_ruomu: {
        trigger: {
            global: ["gainAfter", "loseAfter", "loseAsyncAfter"],
        },
        usable: 1,
        filter(event, player, name, target) {
            return target != _status.currentPhase && target != player;
        },
        getIndex(event, player) {
            return game.filterPlayer(current => event.getg?.(current)?.length);
        },
        logTarget: (event, player, name, target) => target,
        async content(event, trigger, player) {
            const target = event.indexedData;
            const list = [];
            if (target.countGainableCards(player, "he")) {
                list.push("令其获得你的牌");
            }
            if (player.countCards("he")) {
                list.push("令其交给你牌");
            }
            if (!list.length) return;
            const result = await target
                .chooseControl(list)
                .set("ai", () => {
                    const player = get.player();
                    const source = get.event().getParent().player;
                    const controls = get.event().controls;
                    if (controls.includes("令其获得你的牌") && get.attitude(player, source) > 0) {
                        return "令其获得你的牌";
                    }
                    return controls[controls.length - 1];
                })
                .forResult();
            if (result.control == "令其获得你的牌") {
                await player.gainPlayerCard(target, "he", true);
            } else {
                await player.chooseToGive(target, "he", true);
            }
        },
    },
//#noname-kit-end skill:seer_ruomu
//#noname-kit-begin skill:seer_shangsi
    seer_shangsi: {
        locked: true,
        ai: {
            viewHandcard: true,
            skillTagFilter(player, tag, arg) {
                if (player == arg || !arg?.countCards("h", "du")) {
                    return false;
                }
            },
        },
    },
//#noname-kit-end skill:seer_shangsi
    //北鸟
//#noname-kit-begin skill:seer_fuxiao
    seer_fuxiao: {
        enable: "chooseToUse",
        // 限定技：整局一次；关掉限定技自带的标记/动画
        limited: true,
        mark: false,
        skillAnimation: false,
        filter(event, player) {
            // 联机：客户端靠 storage 标记判定「已使用」，不只靠主机上的 awakenSkill
            if (player.storage.seer_fuxiao_used) {
                return false;
            }
            return get.info("seer_fuxiao").getList(player, "seer_fuxiao").slice(0, 1).some(name => {
                return event.filterCard({
                    name: name,
                    isCard: true,
                }, player, event);
            });
        },
        chooseButton: {
            dialog(event, player) {
                const dialog = ui.create.dialog("拂晓", [get.info("seer_fuxiao").getList(player, "seer_fuxiao").slice(0, 1), "vcard"]);
                dialog.direct = true;
                return dialog;
            },
            filter(button, player) {
                var evt = _status.event.getParent();
                return evt.filterCard({
                    name: button.link[2],
                    isCard: true,
                }, player, evt);
            },
            check(button) {
                if (get.event().getParent().type != "phase") return 1;
                return get.player().getUseValue({
                    name: button.link[2],
                    isCard: true,
                });
            },
            backup(links) {
                return {
                    viewAs: {
                        name: links[0][2],
                        isCard: true,
                    },
                    filterCard: () => false,
                    selectCard: -1,
                    log: false,
                    async precontent(event, trigger, player) {
                        const list = get.inpileVCardList(info => {
                            const name = info[2], type = get.type(name), infox = get.info({ name: name });
                            return type == "delay";
                        });
                        if (list.length) {
                            const result = await player
                                .chooseButton([`###拂晓###将你的一张牌当做一张延时锦囊牌置于你的判定区以视为使用${get.translation(event.result.card)}`, [list, "vcard"]])
                                .set("filterButton", button => {
                                    if (game.hasPlayer(target => target.hasJudge(button.link[2]))) return false;
                                    return get.player().canAddJudge({ name: button.link[2] });
                                })
                                .set("ai", function (button) {
                                    const player = get.player();
                                    return 1 / (get.effect(player, { name: button.link[2] }, player, player) + 0.1);
                                })
                                .forResult();
                            if (result?.bool && result.links?.length && player.countCards("he")) {
                                const cardResult = await player
                                    .chooseCard("he", true, "拂晓：选择一张牌作为判定牌")
                                    .set("ai", card => -get.value(card))
                                    .forResult();
                                if (cardResult?.bool && cardResult.cards?.length) {
                                    player.logSkill("seer_fuxiao");
                                    await player.addJudge({ name: result.links[0][2] }, cardResult.cards);
                                    player.awakenSkill("seer_fuxiao");
                                    // 把「已使用」同步给所有客户端（awakenSkill 只在主机生效）
                                    game.broadcastAll((pl, sk) => {
                                        pl.storage[sk + "_used"] = true;
                                    }, player, "seer_fuxiao");
                                    return;
                                }
                            }
                        }
                        event.parent.cancel();
                        event.parent.goto(0);
                        event.getParent(2).goto(0);
                    },
                }
            },
            prompt(links) {
                return `你可以将你的一张牌当做任意延时锦囊牌置入你的判定区内以视为使用一张` + get.translation(links[0][2]);
            },
        },
        hiddenCard(player, name) {
            return get.info("seer_fuxiao").getList(player, "seer_fuxiao").includes(name);
        },
        getList(player, skill) {
            if (!player.storage[skill]) return ["wuxie", "shan"];
            return player.storage[skill];
        },
        init(player, skill) {
            const list = get.info(skill).getList(player);
            player.storage[skill] = list;
        },
        ai: {
            order(item, player) {
                const list = get.info("seer_fuxiao").getList(player, "seer_fuxiao")
                    .map(name => get.order({ name: name }));
                return Math.max(...list) + 0.2;
            },
            result: {
                player(player) {
                    return 1;
                },
            },
        },
        subSkill: {
            backup: {},
        },
    },
//#noname-kit-end skill:seer_fuxiao
//#noname-kit-begin skill:seer_xiyao
    seer_xiyao: {
        enable: "chooseToUse",
        // 限定技：整局一次；关掉限定技自带的标记/动画
        limited: true,
        mark: false,
        skillAnimation: false,
        filter(event, player) {
            // 联机：客户端靠 storage 标记判定「已使用」
            if (player.storage.seer_xiyao_used) {
                return false;
            }
            return get.info("seer_fuxiao").getList(player, "seer_fuxiao").slice(1, 2).some(name => {
                return event.filterCard({
                    name: name,
                    isCard: true,
                }, player, event);
            });
        },
        chooseButton: {
            dialog(event, player) {
                const dialog = ui.create.dialog("拂晓", [get.info("seer_fuxiao").getList(player, "seer_fuxiao").slice(1, 2), "vcard"]);
                dialog.direct = true;
                return dialog;
            },
            filter(button, player) {
                var evt = _status.event.getParent();
                return evt.filterCard({
                    name: button.link[2],
                    isCard: true,
                }, player, evt);
            },
            check(button) {
                if (get.event().getParent().type != "phase") return 1;
                return get.player().getUseValue({
                    name: button.link[2],
                    isCard: true,
                });
            },
            backup(links) {
                return {
                    viewAs: {
                        name: links[0][2],
                        isCard: true,
                    },
                    filterCard: () => false,
                    selectCard: -1,
                    log: false,
                    async precontent(event, trigger, player) {
                        const cards = player.getCards("hej")
                            .filter(card => {
                                switch (get.position(card)) {
                                    case "h":
                                        return true;
                                        break;
                                    case "e":
                                        return game.hasPlayer(target => {
                                            return target.canEquip(card);
                                        });
                                        break;
                                    case "j":
                                        return game.hasPlayer(target => {
                                            return target.canAddJudge(card);
                                        });
                                        break;
                                }
                            });
                        if (cards.length) {
                            const result = await player
                                .chooseButton([get.prompt2("seer_xiyao"), cards])
                                .set("filterButton", button => {
                                    const player = get.player();
                                    switch (get.position(button.link)) {
                                        case "e":
                                            return game.hasPlayer(target => {
                                                return target != player && target.canEquip(button.link);
                                            });
                                        case "j":
                                            return game.hasPlayer(target => {
                                                return target != player && target.canAddJudge(button.link);
                                            });
                                        default:
                                            return true;
                                    }
                                })
                                .set("ai", button => {
                                    const player = get.player(),
                                        trigger = get.event().getTrigger(),
                                        target = trigger.player,
                                        pos = get.position(button.link);
                                    if (!trigger.source && (player.hp + player.countCards("hs", card => player.canSaveCard(card, player)) <= trigger.num)) return 0;
                                    if (get.attitude(player, target) < 0) {
                                        if (pos == "j") return 12;
                                        if (get.value(button.link, player) < 0 && get.effect(target, button.link, player, target) > 0) return 10;
                                        return 0;
                                    }
                                    switch (pos) {
                                        case "e": return 10;
                                        case "j": return -10;
                                        default: return get.value(button.link) * get.effect(target, button.link, player, target);;
                                    }
                                })
                                .forResult();
                            if (result.bool && result.links?.length) {
                                const links = result.links;
                                event.result2 = await player
                                    .chooseTarget(true)
                                    .set("cardx", links[0])
                                    .set("filterTarget", (card, player, target) => {
                                        if (target == player) return false;
                                        const cardx = get.event("cardx");
                                        switch (get.position(cardx)) {
                                            case "e":
                                                return target.canEquip(cardx);
                                            case "j":
                                                return target.canAddJudge(cardx);
                                            default:
                                                return true;
                                        }
                                    })
                                    .set("ai", target => {
                                        const player = get.player();
                                        const cardx = get.event("cardx");
                                        let att = get.attitude(player, target);
                                        if (cardx.name == "du") {
                                            if (target.hasSkillTag("nodu")) return 0.5;
                                            return -att;
                                        }
                                        if (get.position(cardx) == "j") return -att;
                                        return att;
                                    })
                                    .set("createDialog", ["选择将此牌移动至一名其他角色的对应区域内", links])
                                    .forResult()
                                if (event.result2?.bool && event.result2.targets?.length) {
                                    player.logSkill("seer_xiyao");
                                    const target = event.result2.targets[0];
                                    if (get.position(links[0]) == "h") {
                                        await target.gain(links, player, "giveAuto");
                                    } else {
                                        player.$give(links, target, false);
                                        if (get.position(links[0]) == "e") {
                                            await target.equip(links[0]);
                                        } else if (links[0].viewAs) {
                                            // 判定牌要整张移过去：不能先 discard，否则丢了 owner 就搬不走
                                            await target.addJudge({ name: links[0].viewAs }, [links[0]]);
                                        } else {
                                            await target.addJudge(links[0]);
                                        }
                                    }
                                    player.awakenSkill("seer_xiyao");
                                    // 把「已使用」同步给所有客户端
                                    game.broadcastAll((pl, sk) => {
                                        pl.storage[sk + "_used"] = true;
                                    }, player, "seer_xiyao");
                                    game.log(player, "的", get.position(links[0]) == "h" ? "一张手牌" : links[0], "被移动给了", target);
                                    return;
                                }
                            }
                        }
                        event.parent.cancel();
                        event.parent.goto(0);
                        event.getParent(2).goto(0);
                    },
                }
            },
            prompt(links) {
                return `你可以将牌堆顶的一张牌当做任意延时锦囊牌置入你的判定区内以视为使用一张` + get.translation(links[0][2]);
            },
        },
        hiddenCard(player, name) {
            return get.info("seer_fuxiao").getList(player, "seer_fuxiao").includes(name);
        },
        getList(player, skill) {
            if (!player.storage[skill]) return ["wuxie", "shan"];
            return player.storage[skill];
        },
        init(player, skill) {
            const list = get.info(skill).getList(player);
            player.storage[skill] = list;
        },
        ai: {
            order(item, player) {
                const list = get.info("seer_fuxiao").getList(player, "seer_fuxiao")
                    .map(name => get.order({ name: name }));
                return Math.max(...list) + 0.2;
            },
            result: {
                player(player) {
                    return 1;
                },
            },
        },
        subSkill: {
            backup: {},
        },
    },
//#noname-kit-end skill:seer_xiyao
//#noname-kit-begin skill:seer_chunti
    seer_chunti: {
        trigger: {
            global: "phaseEnd",
        },
        filter(event, player) {
            // 只响应其他角色的回合结束（自己的回合结束不触发）
            return event.player !== player;
        },
        forced: true,
        popup: false,
        group: "seer_chunti_hurt",
        async content(event, trigger, player) {
            // 本回合你受过伤：不发动，并清空计数
            if (player.storage.seer_chunti_hurt) {
                player.storage.seer_chunti_hurt = 0;
                return;
            }
            const used = ["seer_fuxiao", "seer_xiyao"].filter(skill => player.storage[skill + "_used"]);
            if (!used.length) {
                return;
            }
            player.logSkill("seer_chunti");
            let skill = used[0];
            if (used.length > 1) {
                const result = await player
                    .chooseControl(used.map(name => get.translation(name)))
                    .set("prompt", "春啼：复原一个技能")
                    .forResult();
                skill = used[result.index] || used[0];
            }
            player.restoreSkill(skill, true);
            // 联机：同步清除「已使用」标记
            game.broadcastAll((pl, sk) => {
                pl.storage[sk + "_used"] = false;
            }, player, skill);
            game.log(player, "复原了", `#g“${get.translation(skill)}”`);
        },
        ai: {
            combo: ["seer_fuxiao", "seer_xiyao"],
        },
        subSkill: {
            hurt: {
                // 只负责记账：每受到一次伤害 +1，回合结束时由主技能读取并清零
                trigger: {
                    player: "damage",
                },
                forced: true,
                silent: true,
                popup: false,
                charlotte: true,
                content(event, trigger, player) {
                    player.storage.seer_chunti_hurt = (player.storage.seer_chunti_hurt || 0) + 1;
                },
            },
        },
    },
//#noname-kit-end skill:seer_chunti
    //散华
//#noname-kit-begin skill:seer_ningshuang
    seer_ningshuang: {
        mod: {
            cardUsable(card, player, num) {
                if (!game.online && card.storage?.seer_ningshuang) return Infinity;
            },
        },
        enable: "phaseUse",
        position: "hes",
        locked: false,
        viewAs: {
            name: "sha",
            nature: "ice",
            isCard: true,
            storage: {
                seer_ningshuang: true,
            },
        },
        onChooseToUse(event) {
            if (!game.online && !event.seer_ningshuang) {
                event.set("seer_ningshuang", get.discarded().filterInD("d").length);
            }
        },
        filter(event, player) {
            return event.seer_ningshuang == player.getDamagedHp();
        },
        filterCard: (card, player = get.owner(card), source, strict) => {
            if (!player) {
                if (player === null) console.trace(`cardRecastable的player参数不应传入null,可以用void 0或undefined占位`);
                player = get.owner(card);
            }
            const mod = game.checkMod(card, player, source, "unchanged", "cardRecastable", player);
            if (!mod) return false;
            if (strict && mod == "unchanged") {
                const info = get.info(card), recastable = info.recastable || info.chongzhu;
                return Boolean(typeof recastable == "function" ? recastable(_status.event, player) : recastable);
            }
            return true;
        },
        check(card) {
            var player = get.player(),
                val = 5 + ["shan", "tao"].includes(get.name(card)) * 1.5;
            if (player.needsToDiscard() > 2 && get.name(card) == "sha" && player.countCards("hes", "sha") > 1) {
                val += 0.5;
            }
            return val - get.value(card);
        },
        lose: false,
        discard: false,
        delay: false,
        log: false,
        async precontent(event, trigger, player) {
            player.logSkill("seer_ningshuang");
            await player.recast(event.result.cards);
            event.result.cards = [];
            event.getParent().addCount = false;
        },
    },
//#noname-kit-end skill:seer_ningshuang
//#noname-kit-begin skill:seer_guankong
    seer_guankong: {
        enable: "phaseUse",
        onChooseToUse(event) {
            if (!game.online && !event.seer_guankong) {
                event.set("seer_guankong", get.discarded().filterInD("d"));
            }
        },

        chooseButton: {
            dialog(event, player) {
                const dialog = ui.create.dialog("观空", event.seer_guankong);

                return dialog;
            },
            filterOk() {
                const num = ui.selected.buttons.reduce((list, button) => {
                    list.add(get.type2(button.link));
                    return list;
                }, []).length
                return num == 1 || num == 3;
            },
            select: 3,
            backup(links) {
                const index = links.reduce((list, card) => {
                    list.add(get.type2(card));
                    return list;
                }, []).length > 1 ? 1 : 0;
                const next = get.copy(lib.skill.seer_guankong.backups[index]);
                next.cards = links;
                return next;
            },
            check(button) {
                const player = get.player();
                switch (button.link) {
                    case 0: {
                        if (player.getHp() + player.countCards("hs", card => player.canSaveCard(card, player)) <= 1) return 0;
                        return 1.1 + Math.random();
                    }
                        break;
                    case 1: {
                        return 1.35 + Math.random();
                    }
                        break;
                }
            },
            prompt(links) {
                return [
                    "你可将移出本回合弃牌堆三张类别均相同的牌并流失一点体力并摸一张牌",
                    "你可将移出本回合弃牌堆三张类别均不同的牌并视为使用一张【桃】或【酒】",
                ][links[0]];
            },
        },
        backups: [
            {
                filterCard: () => false,
                selectCard: -1,
                filterTarget: () => false,
                selectTarget: -1,
                delay: false,
                log: false,
                async content(event, trigger, player) {
                    const cards = lib.skill.seer_guankong_backup.cards;
                    await game.cardsGotoSpecial(cards);
                    game.log(player, "将", cards, "移出游戏");
                    await player.loseHp();
                    await player.draw();
                },
            },
            {
                chooseButton: {
                    dialog(event, player) {
                        const list = ["tao", "jiu"].filter(info => {
                            return event.filterCard(get.autoViewAs({ name: info }, "unsure"), player, event);
                        });
                        const dialog = ui.create.dialog("观空", [list, "vcard"]);
                        dialog.direct = true;
                        return dialog;
                    },
                    check(button) {
                        const player = get.player(),
                            link = button.link;
                        const card = new lib.element.VCard({ name: link[2], isCard: true });
                        return player.getUseValue(card);
                    },
                    backup(links, player) {
                        const cards = lib.skill.seer_guankong_backup.cards;
                        const next = {
                            viewAs: {
                                name: links[0][2],
                                isCard: true,
                            },
                            filterCard: () => false,
                            selectCard: -1,
                            log: false,
                            async precontent(event, trigger, player) {
                                const cards = lib.skill.seer_guankong_backup_backup.cards;
                                await game.cardsGotoSpecial(cards);
                                game.log(player, "将", cards, "移出游戏");
                            },
                            ai: {
                                result: {
                                    player(player) {
                                        return 1;
                                    },
                                },
                            },
                        };
                        next.cards = cards;
                        return next;
                    },
                    prompt(links, player) {
                        return `###观空###选择${get.translation(links[0][2])}的目标`;
                    },
                },
            },
        ],
        ai: {
            order: 10,
            result: {
                player(player) {
                    return 1;
                },
            },
        },
        subSkill: {
            backup: {},
        },
    },
//#noname-kit-end skill:seer_guankong
    //艾莉亚
//#noname-kit-begin skill:seer_changming
    seer_changming: {
        trigger: {
            global: "phaseDrawBegin",
        },
        async cost(event, trigger, player) {
            const target = trigger.player;
            const hasOwn = player.countCards("he") > 0;
            const hasTarget = target !== player && target.countCards("he") > 0;
            if (!hasOwn && !hasTarget) {
                return;
            }
            const controls = [];
            if (hasOwn) {
                controls.push("你的牌");
            }
            if (hasTarget) {
                controls.push(`${get.translation(target)}的牌`);
            }
            controls.push("cancel2");
            const result = await player
                .chooseControl(controls)
                .set("prompt", get.prompt2(event.skill, target))
                .set("ai", () => {
                    const prefer = get.attitude(player, target) > 0 ? "你的牌" : `${get.translation(target)}的牌`;
                    return Math.max(0, controls.indexOf(prefer));
                })
                .forResult();
            if (result.control === "cancel2") {
                return;
            }
            const source = result.control === "你的牌" ? player : target;
            let cards;
            if (source === player) {
                const result = await player
                    .chooseToDiscard("he", 1, true, get.prompt2(event.skill, target))
                    .set("ai", card => {
                        if (get.color(card) == "red") {
                            if (player.getHp() + player.countCards("hs", c => player.canSaveCard(c, player)) <= 1) {
                                return 0;
                            }
                            return 7 - get.value(card);
                        }
                        return 6 - get.value(card);
                    })
                    .forResult();
                if (!result?.bool) {
                    return;
                }
                cards = result.cards;
            } else {
                const result = await player
                    .choosePlayerCard(target, "he", 1, true, get.prompt2(event.skill, target))
                    .set("ai", button => (get.color(button.link) == "red" ? -1 : 1))
                    .forResult();
                if (!result?.bool) {
                    return;
                }
                cards = result.links;
            }
            event.result = {
                bool: true,
                cards,
                cost_data: source === player,
            };
        },
        logTarget: "player",
        async content(event, trigger, player) {
            const source = event.cost_data ? player : trigger.player;
            await source.discard(event.cards);
            await player.chooseToGuanxing(2);
            if (get.color(event.cards[0]) == "red") {
                await player.damage(trigger.player);
            }
        },
    },
//#noname-kit-end skill:seer_changming
//#noname-kit-begin skill:seer_dianyou
    seer_dianyou: {
        trigger: {
            player: "damageEnd",
        },
        mark: true,
        marktext: "☯",
        zhuanhuanji: true,
        intro: {
            content(storage, player, skill) {
                if (!storage) return "当你受到伤害后，你可以令伤害来源本回合攻击范围-1。";
                return "当你受到伤害后，你可以令伤害来源本回合手牌上限-1。";
            },
        },
        filter(event, player) {
            return event.source?.isIn();
        },
        check(event, player) {
            return get.attitude(player, event.source) <= 0;
        },
        async content(event, trigger, player) {
            await player.changeZhuanhuanji(event.name);
            if (player.storage[event.name]) {
                trigger.source.addTempSkill("seer_dianyou_atk");
                trigger.source.addMark("seer_dianyou_atk", 1, false);
            } else {
                trigger.source.addTempSkill("seer_dianyou_max");
                trigger.source.addMark("seer_dianyou_max", 1, false);
            }
        },
        ai: {
            "maixie_defend": true,
            effect: {
                target(card, player, target) {
                    if (player.hasSkillTag("jueqing", false, target)) {
                        return [1, -1];
                    }
                    return 0.8;
                },
            },
        },
        subSkill: {
            max: {
                charlotte: true,
                onremove: true,
                intro: {
                    markcount: storage => -storage,
                    content: "手牌上限-#",
                },
                mod: {
                    maxHandcard(player, num) {
                        return num - player.countMark("seer_dianyou_max");
                    },
                },
            },
            atk: {
                charlotte: true,
                onremove: true,
                intro: {
                    markcount: storage => -storage,
                    content: "攻击范围-#",
                },
                mod: {
                    attackRange(player, num) {
                        return num - player.countMark("seer_dianyou_atk");
                    },
                },
            },
        },
    },
//#noname-kit-end skill:seer_dianyou
    //梅赫维特
//#noname-kit-begin skill:seer_huaixin
    seer_huaixin: {
        global: "seer_huaixin_zhen",
        subSkill: {
            zhen: {
                trigger: {
                    player: "gainAfter",
                },
                round: 1,
                // 怀信持有者（可能不止一个）
                getOwners(player) {
                    const map = (lib.skill.globalmap && lib.skill.globalmap["seer_huaixin_zhen"]) || [];
                    const list = map.length ? map.slice() : game.filterPlayer(current => current.hasSkill("seer_huaixin"));
                    return list.filter(owner => owner.isIn() && owner != player);
                },
                filter(event, player) {
                    // 于回合外获得牌
                    if (_status.currentPhase == player) {
                        return false;
                    }
                    // 手动记录的本轮次数（全局技不会走引擎的 round 计数，这里兜底）
                    if (player.storage.seer_huaixin_round == game.roundNumber) {
                        return false;
                    }
                    // 获得者自己要有两张未明置的手牌
                    if (player.countCards("h") - player.getShownCards().length < 2) {
                        return false;
                    }
                    return lib.skill.seer_huaixin_zhen.getOwners(player).length > 0;
                },
                async content(event, trigger, player) {
                    const owners = lib.skill.seer_huaixin_zhen.getOwners(player);
                    if (!owners.length) {
                        return;
                    }
                    const owner = owners[0];
                    // 由获得牌的角色选择是否发动
                    const result = await player
                        .chooseBool(`怀信：是否令${get.translation(owner)}明置你的两张手牌，然后你回复1点体力？`)
                        .set("ai", () => (player.hp < player.maxHp ? 1 : 0))
                        .forResult();
                    if (!result?.bool) {
                        return;
                    }
                    // 本轮已发动
                    player.storage.seer_huaixin_round = game.roundNumber;
                    // 由怀信持有者从获得者的手牌里选两张明置
                    const cards = player.getCards("h").filter(card => !get.is.shownCard(card));
                    if (cards.length >= 2) {
                        const choice = await owner
                            .choosePlayerCard(player, "h", 2, true, `明置${get.translation(player)}的两张手牌`)
                            .set("filterButton", button => !get.is.shownCard(button.link))
                            .forResult();
                        if (choice?.bool && choice.cards?.length) {
                            player.addShownCards(choice.cards, "visible_seer");
                            game.log(owner, "明置了", player, "的", choice.cards);
                        }
                    }
                    await player.recover();
                },
                sub: true,
                sourceSkill: "seer_huaixin",
            }
        }
    },
//#noname-kit-end skill:seer_huaixin
//#noname-kit-begin skill:seer_zhaohui
    seer_zhaohui: {
        trigger: {
            player: "phaseDrawBegin",
        },
        forced: true,
        filter: function (event, player) {
            return game.hasPlayer(function (current) {
                return current.getShownCards().length > 0;
            });
        },
        content: function () {
            trigger.num += game.countPlayer(function (current) {
                return current.getShownCards().length > 0;
            });
        },
        group: ["seer_zhaohui_end"],
        subSkill: {
            end: {
                trigger: {
                    player: "phaseDrawEnd",
                },

                content: function () {
                    "step 0"
                    player.chooseCardTarget({
                        filterCard: true,
                        selectCard: [1, player.countCards('h')],
                        filterTarget: function (card, player, target) {
                            return player != target;
                        },
                        ai1: function (card) {
                            if (ui.selected.cards.length > 0) return -1;
                            if (card.name == 'du') return 20;
                            return (_status.event.player.countCards('h') - _status.event.player.hp);
                        },
                        ai2: function (target) {
                            var att = get.attitude(_status.event.player, target);
                            if (ui.selected.cards.length && ui.selected.cards[0].name == 'du') {
                                if (target.hasSkillTag('nodu')) return 0;
                                return 1 - att;
                            }
                            return att - 4;
                        },
                        prompt: '请选择要分配的牌'
                    });
                    "step 1"
                    if (result.bool) {
                        player.line(result.targets, 'green');
                        result.targets[0].gain(result.cards, player, 'giveAuto');
                        event.goto(0);
                    }
                },
                prompt: "是否分配你的手牌",
                sourceSkill: "seer_zhaohui",
                sub: true,
            },
        },
    },
//#noname-kit-end skill:seer_zhaohui
    //无名
//#noname-kit-begin skill:seer_suoxin
    seer_suoxin: {
        init: function (player) {
            player.storage.seer_suoxin = true;
            player.storage.seer_suoxin_target = [];
        },
        enable: "phaseUse",
        filter: function (event, player) {
            return player.storage.seer_suoxin && game.hasPlayer(function (current) {
                return !player.storage.seer_suoxin_target.includes(current);
            });
        },
        filterTarget: function (card, player, target) {
            return !player.storage.seer_suoxin_target.includes(target) && player != target;
        },
        async content(event, trigger, player) {
            const target = event.target;
            player.storage.seer_suoxin_target.push(target);
            const cards = target.getCards("h").filter(card => !get.is.shownCard(card));
            // 0 = 明置两张手牌；1 = 造成伤害并获得一张牌
            let choice = 1;
            if (cards.length >= 2) {
                const result = await target
                    .chooseControl("明置两张手牌", "受到伤害并被获得一张牌")
                    .set("prompt", "索信：请选择一项")
                    .set("ai", () => 0)
                    .forResult();
                choice = result.index;
            }
            if (choice === 0) {
                const result = await player
                    .choosePlayerCard(target, "h", 2, true, "明置其两张手牌")
                    .set("filterButton", button => !get.is.shownCard(button.link))
                    .forResult();
                if (result?.bool && result.cards?.length) {
                    target.addShownCards(result.cards, "visible_seer");
                    game.log(player, "明置了", target, "的", result.cards);
                    return;
                }
            }
            await target.damage();
            await player.gainPlayerCard(target, "he", true);
            player.storage.seer_suoxin = false;
        },
        group: ["seer_suoxin_reset"],
        subSkill: {
            reset: {
                trigger: {
                    global: "phaseEnd",
                },
                forced: true,
                direct: true,
                slient: true,
                content: function () {
                    player.storage.seer_suoxin = true;
                    player.storage.seer_suoxin_target = [];
                },
                sub: true,
                sourceSkill: "seer_suoxin",
            },
        },
    },
//#noname-kit-end skill:seer_suoxin
//#noname-kit-begin skill:seer_juquan
    seer_juquan: {
        trigger: {
            player: "phaseDrawBegin",
        },
        forced: true,
        filter: function (event, player) {
            return game.hasPlayer(function (current) {
                return current.getShownCards().length > 0;
            });
        },
        content: function () {
            trigger.num += game.countPlayer(function (current) {
                return current.getShownCards().length > 0;
            });
        },
        group: ["seer_juquan_end"],
        subSkill: {
            end: {
                trigger: {
                    player: "phaseDrawEnd",
                },
                forced: true,
                filter: function (event, player) {
                    return game.countPlayer(function (current) {
                        return current.getShownCards().length > 0;
                    }) > 0;
                },
                content: function () {
                    for (var i of game.players) {
                        if (i != player && i.getShownCards().length > 0) player.gain(i.getShownCards(), i, 'giveAuto');
                    }
                },
                sub: true,
                sourceSkill: "seer_juquan",
            },
        },
    },
//#noname-kit-end skill:seer_juquan
    //蒂朵
//#noname-kit-begin skill:seer_xinglv
    seer_xinglv: {
        trigger: {
            global: "phaseEnd",
        },
        forced: true,
        filter(event, player) {
            return event.player != player;
        },
        async content(event, trigger, player) {
            await player.draw();
            const suits = game.filterPlayer2()
                .map(target => {
                    return target.getHistory("useCard").reduce((list, evt) => list.add(get.suit(evt.card, false)), []);
                })
                .flat();
            event.result = await player
                .chooseToUse(`${get.translation(event.name)}：使用一张牌，否则你弃置两张牌`, function (card) {
                    if (get.event().suits.includes(get.suit(card, get.player()))) {
                        return false;
                    }
                    return lib.filter.cardEnabled.apply(this, arguments);
                })
                .set("suits", suits)
                .forResult();
            if (!event?.result?.bool) {
                await player.chooseToDiscard("he", 2, true);
            }
        },
    },
//#noname-kit-end skill:seer_xinglv
//#noname-kit-begin skill:seer_diyue
    seer_diyue: {
        trigger: {
            player: "logSkill",
        },
        forced: true,
        dutySkill: true,
        skillAnimation: "legend",
        animationColor: "thunder",
        filter(event, player) {
            return event.skill == "seer_diyue_effect" && player.countMark("seer_diyue_mark") >= 13;
        },
        async content(event, trigger, player) {
            player.awakenSkill(event.name);
            game.log(player, "成功完成使命");
            const target = player.storage.seer_diyue_effect;
            await player.recoverTo(player.maxHp);
            if (target?.isIn()) await target.recoverTo(target.maxHp);
        },
        group: "seer_diyue_use",
        subSkill: {
            use: {
                enable: "phaseUse",
                filter(event, player) {
                    if (player.storage.seer_diyue_use) {
                        return false;
                    }
                    return game.hasPlayer(target => target != player);
                },
                filterTarget: lib.filter.notMe,
                skillAnimation: true,
                animationColor: "thunder",
                prompt: "每局游戏出牌阶段限一次，你可选择一名其他角色；你或其的牌被弃置时，可用一张手牌交换对方的弃牌。成功：你与其共计交换13张牌时，双方恢复所有体力。",
                async content(event, trigger, player) {
                    const target = event.targets[0];
                    player.awakenSkill("seer_diyue_use");
                    player.addSkill("seer_diyue_effect");
                    player.setStorage("seer_diyue_effect", target);
                },
                ai: {
                    order: 12,
                    result: {
                        target: 1,
                    },
                },
            },
            effect: {
                trigger: {
                    global: ["loseAfter", "loseAsyncAfter"],
                },
                charlotte: true,
                filter(event, player) {
                    if (event.type != "discard" || event.getlx === false) return false;
                    if (event.name != "loseAsync") return event.player == player || event.player == player.storage.seer_diyue_effect;
                    return game.hasPlayer(target => {
                        if (!event.getl || event.getl(target)?.cards2?.length) return false;
                        return target == player || player.storage?.seer_diyue_effect == target;
                    });
                },
                getIndex(event, player) {
                    if (event.name != "loseAsync") return [event.player];
                    return game.filterPlayer(target => {
                        if (!event.getl || event.getl(target)?.cards2?.length) return false;
                        return target == player || player.storage.seer_diyue_effect == target;
                    });
                },
                async cost(event, trigger, player) {
                    const target = event.indexedData;
                    const source = (target == player ? player.storage.seer_diyue_effect : player);
                    const cards = trigger.getl(target).cards2;
                    event.result = await source.chooseCard("h", get.prompt("seer_diyue"), `你可以用一张手牌交换${get.translation(cards)}`)
                        .set("cardxs", cards)
                        .set("ai", card => {
                            const val = get.event("cardxs")
                                .reduce((sum, cardx) => sum + get.value(cardx), 0);
                            return val - get.value(card);
                        })
                        .forResult();
                },
                logTarget(event, player, name, target) {
                    return target;
                },
                async content(event, trigger, player) {
                    const target = event.targets[0],
                        cards = trigger.getl(target).cards2;
                    const source = (target == player ? player.storage.seer_diyue_effect : player);
                    await source.loseToDiscardpile(event.cards);
                    if (cards.length) {
                        await source.gain(cards, "gain2");
                        player.addMark("seer_diyue_mark", cards.length, false);
                    }
                    const num = player.countMark("seer_diyue_mark");
                    player.addTip("seer_diyue_effect", get.translation("seer_diyue_effect") + " " + get.translation(player.storage.seer_diyue_effect) + " " + num);
                },
                mark: true,
                intro: {
                    markcount(storage, player) {
                        return `${player.countMark("seer_diyue_mark")}`;
                    },
                    content: "当你与$的牌被弃置后，其或你可以用一张手牌交换对方的弃牌",
                },
            },
            mark: {

            },
        },
    },
//#noname-kit-end skill:seer_diyue
    //尤纳斯
//#noname-kit-begin skill:seer_shenkong
    seer_shenkong: {
        trigger: {
            target: "useCardToTarget",
        },
        forced: true,
        filter(event, player) {
            // 只响应“其他角色”使用的伤害牌（自己使用「深空」牌时不会触发）
            if (event.player == player) {
                return false;
            }
            return get.is.damageCard(event.card);
        },
        async content(event, trigger, player) {
            const expansions = player.getExpansions("seer_shenkong");
            if (expansions.length <= player.maxHp) {
                // “深空”牌数不多于体力上限：取消此牌对自己的结算，并将牌置于武将牌上
                trigger.getParent().excluded.add(player);
                game.log(trigger.card, "对", player, "无效");
                const cards = trigger.cards.filterInD();
                if (cards.length) {
                    const next = player.addToExpansion(cards, player, "gain2");
                    next.gaintag.add(event.name);
                    await next;
                }
                return;
            }
            // “深空”牌数多于体力上限：对自己使用所有“深空”牌
            const list = player.getExpansions("seer_shenkong").slice();
            if (!list.length) {
                return;
            }
            game.log(player, "「深空」爆发：将", "#y" + list.length, "张牌对自己使用");
            for (const card of list) {
                try {
                    await player.useCard(get.autoViewAs({ name: get.name(card) }, [card]), [player], false);
                } catch (e) {
                    console.warn("赛尔计划·深空：使用失败", card, e);
                    if (player.getExpansions("seer_shenkong").includes(card)) {
                        await player.loseToDiscardpile([card]);
                    }
                }
            }
        },
        intro: {
            content: "expansion",
            markcount: "expansion",
        },
        onremove(player, skill) {
            const cards = player.getExpansions(skill);
            if (cards.length) {
                player.loseToDiscardpile(cards);
            }
        },
    },
//#noname-kit-end skill:seer_shenkong
//#noname-kit-begin skill:seer_tansuo
    seer_tansuo: {
        trigger: {
            player: "phaseJieshu",
        },
        forced: true,
        async content(event, trigger, player) {
            const num = game.filterPlayer(target => target != player)
                .reduce((sum, target) => sum + target.maxHp, 0);
            if (player.maxHp > num) {
                return;
            }
            // 增加一点体力上限（不回复体力）
            await player.gainMaxHp();
            // 可将牌堆顶至多两张牌置于“深空”
            const result = await player
                .chooseControl(["0张", "1张", "2张"])
                .set("prompt", "坍缩：可将牌堆顶至多两张牌置于「深空」")
                .set("ai", () => 2)
                .forResult();
            const count = Number(result.index) || 0;
            if (count > 0) {
                const cards = get.cards(count);
                if (cards.length) {
                    const next = player.addToExpansion(cards, "gain2");
                    next.gaintag.add("seer_shenkong");
                    await next;
                }
            }
            // 然后摸“深空”牌数张牌
            const drawNum = player.getExpansions("seer_shenkong").length;
            if (drawNum > 0) {
                await player.draw(drawNum);
            }
        },
        ai: {
            combo: "seer_shenkong",
        },
    },
//#noname-kit-end skill:seer_tansuo
    //索杰德尔
//#noname-kit-begin skill:seer_hunzhilvfa
    seer_hunzhilvfa: {
        nobracket: true,
        trigger: {
            player: "phaseBegin",
        },
        forced: true,
        locked: false,
        filter(event, player) {
            return player.getCards("h")
                .reduce((list, card) => list.add(get.color(card)), [])
                .length == 1;
        },
        getLimit: 4,
        addMark(player, skill) {
            if (player.countMark(skill) < get.info("seer_hunzhilvfa").getLimit) player.addMark(skill, 1);
            player.removeMark(skill == "seer_hunzhilvfa_mingqi" ? "seer_hunzhilvfa_hunluo" : "seer_hunzhilvfa_mingqi");
            player.addTip("seer_hunzhilvfa", get.translation("seer_hunzhilvfa") + " " + `${player.countMark("seer_hunzhilvfa_mingqi")}/${player.countMark("seer_hunzhilvfa_hunluo")}`);
        },
        removeMark(player, skill, num) {
            player.removeMark(skill, 1);
            if (player.countMark(skill) < get.info("seer_hunzhilvfa").getLimit) player.addMark(skill == "seer_hunzhilvfa_mingqi" ? "seer_hunzhilvfa_hunluo" : "seer_hunzhilvfa_mingqi");
            player.addTip("seer_hunzhilvfa", get.translation("seer_hunzhilvfa") + " " + `${player.countMark("seer_hunzhilvfa_mingqi")}/${player.countMark("seer_hunzhilvfa_hunluo")}`);
        },
        async content(event, trigger, player) {
            const cards = player.getCards("h");
            await player.recast(cards);
            const num = player.storage.seer_hunzhilvfa_hunluo;
            player.storage.seer_hunzhilvfa_hunluo = player.storage.seer_hunzhilvfa_mingqi;
            player.storage.seer_hunzhilvfa_mingqi = num;
            player.update();
            player.addTip("seer_hunzhilvfa", get.translation("seer_hunzhilvfa") + " " + `${player.countMark("seer_hunzhilvfa_mingqi")}/${player.countMark("seer_hunzhilvfa_hunluo")}`);
        },
        onremove(player, skill) {
            player.removeTip(skill);
        },
        group: "seer_hunzhilvfa_init",
        subSkill: {
            init: {
                trigger: {
                    global: "phaseBefore",
                    player: "enterGame",
                },
                forced: true,
                locked: false,
                filter(event, player) {
                    return event.name != "phase" || game.phaseNumber == 0;
                },
                async content(event, trigger, player) {
                    player.addMark("seer_hunzhilvfa_mingqi", 2);
                    player.addMark("seer_hunzhilvfa_hunluo", 2);
                    player.addTip("seer_hunzhilvfa", get.translation("seer_hunzhilvfa") + " " + `${player.countMark("seer_hunzhilvfa_mingqi")}/${player.countMark("seer_hunzhilvfa_hunluo")}`);
                },
            },
            mingqi: {
                mark: true,
                marktext: "命起",
                intro: {
                    name: "命起",
                    content: "mark",
                },
            },
            hunluo: {
                mark: true,
                marktext: "魂落",
                intro: {
                    name: "魂落",
                    content: "mark",
                },
            },
        },
    },
//#noname-kit-end skill:seer_hunzhilvfa
//#noname-kit-begin skill:seer_mingdanruxu
    seer_mingdanruxu: {
        nobracket: true,
        trigger: {
            target: "useCardToTarget",
        },
        forced: true,
        filter(event, player) {
            const num = player.countMark("seer_hunzhilvfa_mingqi");
            return event.player.countCards("h") <= num || event.player.getHp(true) <= num;
        },
        logTarget: "player",
        async content(event, trigger, player) {
            trigger.getParent().excluded.add(player);
            game.log(trigger.card, "对", player, "无效");
            if (player.countMark('seer_hunzhilvfa_mingqi'))
                get.info("seer_hunzhilvfa").removeMark(player, "seer_hunzhilvfa_mingqi");
        },
    },
//#noname-kit-end skill:seer_mingdanruxu
//#noname-kit-begin skill:seer_hunyunruomeng
    seer_hunyunruomeng: {
        nobracket: true,
        trigger: {
            player: "useCard1",
        },
        forced: true,
        filter(event, player) {
            const num = player.countMark("seer_hunzhilvfa_hunluo");
            return event.targets?.some(target => {
                return target.countCards("h") == num || target.getHp(true) == num;
            });
        },
        async content(event, trigger, player) {
            if (player.countMark('seer_hunzhilvfa_hunluo'))
                get.info("seer_hunzhilvfa").removeMark(player, "seer_hunzhilvfa_hunluo");
        },
        mod: {
            cardUsableTarget(card, player, target) {
                const num = player.countMark("seer_hunzhilvfa_hunluo");
                if (target.countCards("h") == num || target.getHp(true) == num) return true;
            },
            targetInRange(card, player, target) {
                const num = player.countMark("seer_hunzhilvfa_hunluo");
                if (target.countCards("h") == num || target.getHp(true) == num) return true;
            },
            selectTarget(card, player, range) {
                const num = player.countMark("seer_hunzhilvfa_hunluo");
                if (
                    !game.hasPlayer(target => {
                        return target.countCards("h") == num || target.getHp(true) == num;
                    })
                )
                    return;
                if (range[1] != -1) range[1] = Infinity;
            },
        },
    },
//#noname-kit-end skill:seer_hunyunruomeng
    //布莱克
//#noname-kit-begin skill:seer_huaying
    seer_huaying: {
        enable: "chooseToUse",
        usable: 1,
        onChooseToUse(event) {
            if (!game.online && !event.seer_guankong) {
                const suits = get.discarded().filterInD("d").reduce((list, card) => {
                    list.add(get.suit(card));
                    return list;
                }, []);
                event.set("seer_huaying", Math.max(1, suits.length));
            }
        },
        hiddenCard(player, name) {
            if (get.type(name) != "basic") return false;
            const suits = get.discarded().filterInD("d").reduce((list, card) => {
                list.add(get.suit(card));
                return list;
            }, []);
            const num = Math.max(1, suits.length);
            if (player.countCards("he") < num) return false;
            return lib.inpile.includes(name);
        },
        filter(event, player) {
            if (player.countCards("he") <= event.seer_huaying) return false;
            for (const name of lib.inpile) {
                if (get.type(name) != "basic") continue;
                const card = { name: name, isCard: true };
                if (event.filterCard(card, player, event)) return true;
                if (name == "sha") {
                    for (const nature of lib.inpile_nature) {
                        card.nature = nature;
                        if (event.filterCard(card, player, event)) return true;
                    }
                }
            }
            return false;
        },
        chooseButton: {
            dialog(event, player) {
                const vcards = get.inpileVCardList(info => {
                    if (info[0] != "basic") return;
                    const card = { name: info[2], nature: info[3], isCard: true };
                    return event.filterCard(card, player, event);
                });
                const dialog = ui.create.dialog("化影", [vcards, "vcard"], "hidden");
                dialog.direct = true;
                return dialog;
            },
            check(button) {
                if (get.event().getParent().type != "phase") return 1;
                const player = get.player();
                const card = { name: button.link[2], nature: button.link[3] };
                if (
                    game.hasPlayer(current => {
                        return player.canUse(card, current) && get.effect(current, card, player, player) > 0;
                    })
                ) {
                    switch (button.link[2]) {
                        case "tao":
                            return 5;
                        case "jiu":
                            return 3.01;
                        case "sha":
                            if (button.link[3] == "fire") return 2.95;
                            else if (button.link[3] == "thunder") return 2.92;
                            else return 2.9;
                    }
                }
                return 0;
            },
            backup(links, player) {
                const num = get.event().seer_huaying;
                const next = {
                    viewAs: {
                        name: links[0][2],
                        nature: links[0][3],
                    },
                    filterCard: true,
                    position: "he",
                    check(card) {
                        return 10 - get.value(card);
                    },
                    log: false,
                    async precontent(event, trigger, player) {
                        const num = get.discarded().filterInD("d").reduce((list, card) => {
                            list.add(get.suit(card));
                            return list;
                        }, []).length;
                        player.logSkill("seer_huaying");
                        player
                            .when("useCardAfter")
                            .filter(evt => evt.skill == "seer_huaying_backup")
                            .then(async (event, trigger, player) => {
                                const suits = get.discarded().filterInD("d").reduce((list, card) => {
                                    list.add(get.suit(card));
                                    return list;
                                }, []);
                                debugger

                                if (suits.length > num) {
                                    await player.gain(lib.card.ying.getYing(1));
                                    player.refreshSkill("seer_huaying");
                                }
                            });
                    },
                    ai: {
                        order: 10,
                        result: {
                            player: 1,
                        },
                    },
                };
                next.num = num;
                next.selectCard = num;
                return next;
            },
            prompt(links, player) {
                const num = get.event().seer_huaying;
                return `你可以将${num}张牌当作${get.translation(links[0][3] || "")}${get.translation(links[0][2])}使用。`;
            },
        },
        ai: {
            order() {
                const player = get.player(),
                    event = get.event();
                if (event.filterCard({ name: "jiu" }, player, event) && get.effect(player, { name: "jiu" }) > 0) {
                    return get.order({ name: "jiu" }) + 0.1;
                }
                return get.order({ name: "sha" }) + 0.1;
            },
            respondSha: true,
            fireAttack: true,
            respondShan: true,
            result: {
                player(player) {
                    if (_status.event.dying) return get.attitude(player, _status.event.dying);
                    return 1;
                },
            },
        },
        subSkill: {
            backup: {},
        },
    },
//#noname-kit-end skill:seer_huaying
//#noname-kit-begin skill:seer_yemo
    seer_yemo: {
        trigger: {
            player: "useCardToPlayer",
        },
        filter(event, player) {
            return get.color(event.card) == "black" && event.target.countDiscardableCards(player, "he");
        },
        logTarget: "target",
        async content(event, trigger, player) {
            const target = event.targets[0];
            const result = await player.discardPlayerCard(target, "he", true).forResult();
            if (result?.bool && result.links?.length) {
                target
                    .when({ global: "phaseEnd" })
                    .then(async (event, trigger, player) => {
                        player.draw();
                    });
            }
        },
    },
//#noname-kit-end skill:seer_yemo
    //无极圣武
//#noname-kit-begin skill:seer_tianzheng
    seer_tianzheng: {
        enable: "phaseUse",
        viewAs(cards, player) {
            if (cards.length) {
                return {
                    name: "juedou",
                    storage: {
                        seer_tianzheng: true,
                    }
                };
            }
            return null;
        },
        filter(event, player) {
            return player.countCards("hes", card => {
                return player.hasUseTarget(get.autoViewAs({ name: "juedou" }, [card]), false, false);
            }) >= event.seer_tianzheng_num;
        },
        onChooseToUse(event) {
            if (!game.online && !event.seer_tianzheng_num) {
                const player = event.player,
                    history = player.getHistory("custom", evt => evt.seer_tianzheng_num);
                if (!history.length) {
                    event.set("seer_tianzheng_num", 1);
                } else {
                    const evt = history[history.length - 1];
                    event.set("seer_tianzheng_num", evt.seer_tianzheng_num);
                }
            }
        },
        filterCard: true,
        selectCard() {
            const num = get.event().seer_tianzheng_num;
            return [num || 1, Infinity];
        },
        position: "hea",
        check(card) {
            const player = get.event().player;
            if (get.name(card, player) == "sha") {
                return 1 / (get.value(card) || 0.5);
            }
            return 7 - get.value(card);
        },
        log: false,
        async precontent(event, trigger, player) {
            player.logSkill("seer_tianzheng");
            const num = event.result.cards.length + 1;
            player.getHistory("custom").push({
                seer_tianzheng_num: num,
            });
            player.addTempSkill("seer_tianzheng_buff");
        },
        subSkill: {
            buff: {
                trigger: {
                    global: "damageEnd",
                },
                forced: true,
                charlotte: true,
                filter(event, player) {
                    var evt = event.getParent();
                    return evt.skill == "seer_tianzheng" && evt.player == player;
                },
                async content(event, trigger, player) {
                    const num = trigger.player.hp - trigger.player.countCards("h");
                    if (num >= 0) {
                        await trigger.player.drawTo(trigger.player.hp);
                    } else {
                        await trigger.player.chooseToDiscard(trigger.player.countCards("h") - trigger.player.hp, true);
                    }
                },
            },
        },
    },
//#noname-kit-end skill:seer_tianzheng
//#noname-kit-begin skill:seer_wuzhu
    seer_wuzhu: {
        derivation: "repojun",
        group: ["seer_wuzhu_use", "seer_wuzhu_add"],
        subSkill: {
            use: {
                name: "破军",
                inherit: "repojun",
                filter(event, player) {
                    if (!lib.skill.repojun.filter(event, player)) {
                        return false;
                    }
                    return event.target.hasHistory("damage");
                },
            },
            add: {
                name: "破军",
                inherit: "repojun3",
                filter(event, player) {
                    if (!lib.skill.repojun3.filter(event, player)) {
                        return false;
                    }
                    return event.player.hasHistory("damage");
                },
            },
        },
    },
//#noname-kit-end skill:seer_wuzhu
    //琉梦
//#noname-kit-begin skill:seer_liumeng_mengqi
    seer_liumeng_mengqi: {
        enable: "phaseUse",
        filter(event, player) {
            return player.countCards("he");
        },
        filterCard: true,
        position: "he",
        check(card) {
            const player = get.event().player;
            if (card.hasGaintag("seer_liumeng_mingyin_blocker") && !player.hasUseTarget(card)) {
                return 20;
            }
            return 5 - get.value(card);
        },
        async content(event, trigger, player) {
            const num = 1 + get.discarded().filterInD("d").reduce((list, card) => list.add(get.suit(card)), []).length;
            if (num > 0) {
                const cards = get.cards(num, true);
                await player.viewCards(get.translation(event.name), cards);
            }
        },
        ai: {
            order: 1,
            result: {
                player(player) {
                    if (player.countCards("h", card => {
                        return card.hasGaintag("seer_liumeng_mingyin_blocker") && !player.hasUseTarget(card);
                    })) {
                        return 1;
                    }
                    return 0;
                },
            },
        },
    },
//#noname-kit-end skill:seer_liumeng_mengqi
//#noname-kit-begin skill:seer_liumeng_mingyin
    seer_liumeng_mingyin: {
        enable: "phaseUse",
        filter(event, player) {
            if (player.hasCard((card) => card.hasGaintag("seer_liumeng_mingyin_blocker"), "h")) {
                return false;
            }
            if (player.getStorage("seer_liumeng_mingyin_used").length >= 5) {
                return false;
            }
            return true;
        },
        chooseButton: {
            dialog(event, player) {
                const dialog = ui.create.dialog("命引：选择获得牌堆顶的牌", "hidden");
                return dialog;
            },
            chooseControl(event, player) {
                const list = [1, 2, 3, 4, 5].filter(i => !player.hasStorage("seer_liumeng_mingyin_used", i));
                list.push("cancel2");
                return list;
            },
            check(button, player) {
                const list = [1, 2, 3, 4, 5].filter(i => !player.hasStorage("seer_liumeng_mingyin_used", i));
                return list.randomGet();
            },
            backup(result, player) {
                return {
                    filterCard: () => false,
                    selectCard: -1,
                    num: result.control,
                    async content(event, trigger, player) {
                        const num = lib.skill["seer_liumeng_mingyin_backup"].num;
                        player.addTempSkill("seer_liumeng_mingyin_used", "phaseUseAfter");
                        player.markAuto("seer_liumeng_mingyin_used", [num]);
                        const card = Array.from(ui.cardPile.childNodes)?.[num - 1];
                        if (card) {
                            player.addSkill("seer_liumeng_mingyin_blocker");
                            await player.gain(card, "draw").set("gaintag", ["seer_liumeng_mingyin_blocker"]);
                        }
                    },
                    ai: {
                        order: 10,
                        result: {
                            player: 1,
                        },
                    },
                };
            },
        },
        ai: {
            order: 10,
            result: {
                player: 1,
            },
        },
        subSkill: {
            backup: {},
            used: {
                charlotte: true,
                onremove: true,
            },
            blocker: {
                charlotte: true,
                onremove: (player, skill) => player.removeGaintag(skill),
            },
        },
    },
//#noname-kit-end skill:seer_liumeng_mingyin



    //以下为超舟扩展角色
    //卡莉
//#noname-kit-begin skill:seer_tsdcs
    "seer_tsdcs": {
        nobracket: true,
        trigger: {
            player: "dyingAfter",
        },
        nobracket: true,
        forced: true,
        content: function () {
            player.storage.seer_tsdcs = true
        },
        group: 'seer_tsdcs_sub',
        subSkill: {
            sub: {
                trigger: {
                    player: 'phaseBegin'
                },
                filter: function (event, player) {
                    return player.storage.seer_tsdcs
                },
                forced: true,
                content: function () {
                    player.removeSkill('seer_tsdcs')
                    player.addSkill('seer_shby')
                    game.broadcastAll(function (player, target) {
                        player.say('该动真格的了，全部破坏......')
                        player.node.avatar.setBackgroundImage('extension/赛尔计划/image/character/seer_kaliEGO.jpg');
                        lib.config.background_music = 'music_custom';
                        lib.config.background_music_src = lib.assetURL + 'extension/赛尔计划/audio/redmist.mp3';
                        game.playBackgroundMusic();
                    }, player);
                }
            }
        }
    },
//#noname-kit-end skill:seer_tsdcs
//#noname-kit-begin skill:seer_xrdzq
    "seer_xrdzq": {
        nobracket: true,
        trigger: {
            player: ["useCardAfter"],
        },
        forced: true,
        usable: 1,
        filter: function (event, player) {
            for (var i of game.players) {
                if (i.countCards('h') < player.countCards('h')) return false
            }
            return true
        },
        content: function () {
            var num = 0
            for (var i of game.players) {
                if (i.isMaxHandcard()) num = i.countCards('h')
            }
            player.drawTo(num + 1)
        },
    },
//#noname-kit-end skill:seer_xrdzq
//#noname-kit-begin skill:seer_ssdjq
    "seer_ssdjq": {

        nobracket: true,
        enable: "phaseUse",
        enable: ["chooseToUse", "chooseToRespond"],
        hiddenCard: function (player, name) {
            if (get.type(name) != "basic") return false;

            return player.countCards("h",/*, (card) => get.type(card) == 'basic'*/) >= 2
        },
        filter: function (event, player) {
            if (player.countCards("h",/*, (card) => get.type(card) == 'basic'*/) < 2) return false;

            for (var name of lib.inpile) {
                if (get.type(name) != "basic") continue;
                if (event.filterCard(get.autoViewAs({ name }, "unsure"), player, event)) return true;
                if (name == "sha") {
                    for (var nature of lib.inpile_nature) {
                        if (
                            event.filterCard(
                                get.autoViewAs({ name, nature }, "unsure"),
                                player,
                                event
                            )
                        )
                            return true;
                    }
                }
            }
            return false;
        },

        chooseButton: {
            dialog: function (event, player) {
                var list = [];
                for (var name of lib.inpile) {
                    if (get.type(name) != "basic") continue;
                    if (event.filterCard(get.autoViewAs({ name }, "unsure"), player, event)) {
                        list.push(["基本", "", name]);
                    }
                    if (name == "sha") {
                        for (var nature of lib.inpile_nature) {
                            if (
                                event.filterCard(
                                    get.autoViewAs({ name, nature }, "unsure"),
                                    player,
                                    event
                                )
                            )
                                list.push(["基本", "", "sha", nature]);
                        }
                    }
                }
                return ui.create.dialog("生疏的技巧", [list, "vcard"], "hidden");
            },
            check: function (button) {
                var player = _status.event.player;
                var card = { name: button.link[2], nature: button.link[3] };
                if (
                    _status.event.getParent().type != "phase" ||
                    game.hasPlayer(function (current) {
                        return (
                            player.canUse(card, current) &&
                            get.effect(current, card, player, player) > 0
                        );
                    })
                ) {
                    switch (button.link[2]) {
                        case "tao":
                        case "shan":
                            return 5;
                        case "jiu": {
                            if (
                                player.storage.yizan &&
                                player.countCards("hs", { type: "basic" }) > 2
                            )
                                return 3;
                        }
                        case "sha":
                            if (button.link[3] == "fire") return 2.95;
                            else if (button.link[3] == "thunder" || button.link[3] == "ice")
                                return 2.92;
                            else return 2.9;
                    }
                }
                return 0;
            },
            backup: function (links, player) {
                return {

                    filterCard: function (card, player, target) {

                        return true;
                    },
                    complexCard: true,
                    selectCard: function () {

                        return 2;
                    },
                    check: function (card, player, target) {
                        if (!ui.selected.cards.length && get.type(card) == "basic") return 6;
                        else return 6 - get.value(card);
                    },
                    viewAs: { name: links[0][2], nature: links[0][3] },
                    position: "hes",
                    popname: true,
                    onuse: function (result, player) {
                        if (get.suit(result.cards[0]) != get.suit(result.cards[1])) player.tempBanSkill("seer_ssdjq")
                    }
                };
            },
            prompt: function (links, player) {

                return (
                    "将两张牌当做" +
                    get.translation(links[0][3] || "") +
                    get.translation(links[0][2]) +
                    "使用或打出"
                );
            },
        },
        ai: {
            basic: {
                order: 8.9,
                useful: 1,
                value: 5,
            },
            result: {
                target: 2,
            },
        },
        subSkill: {
            wuzhong: {
                charlotte: true,
                sub: true,
            },
            shunshou: {
                charlotte: true,
                sub: true,
            },
            juedou: {
                charlotte: true,
                sub: true,
            },
        },

    },
//#noname-kit-end skill:seer_ssdjq
//#noname-kit-begin skill:seer_shby
    'seer_shby': {
        nobracket: true,
        trigger: {
            player: ["shaBegin"],
        },
        forced: true,
        content: function () {
            trigger.baseDamage += game.dead.length
        },
        mod: {
            cardUsable: function (card, player, num) {
                if (card.name == 'sha')
                    return num + game.dead.length;
            },
        },
    },
//#noname-kit-end skill:seer_shby
//#noname-kit-begin skill:seer_dgs
    'seer_dgs': {
        nobracket: true,
                            trigger: {
                                player: 'phaseAfter'
                            },
                            init: function (player) {
                                player.gainMaxHp(2)
                            },
                            direct: true,
                            content: function () {
                                const chatLine = ['“你一个人，该如何拦住湍流？”', '“那个按钮，挡不住洪水！”'].randomGet();
                                game.broadcastAll(function (player, line2) {
                                    player.say(line2);
                                }, player, chatLine);
                                for (var i of game.players) {
                                    if (i != player) {
                                        i.loseHp()
                                        player.recover()
                                        game.delay(0.2)
                                    }
                                }
                            }
                        },
//#noname-kit-end skill:seer_dgs
                        

//#noname-kit-begin skill:seer_zhexueceng
    'seer_zhexueceng': {
            nobracket: true, init: function (player) {
            player.storage.seer_zxc = ['长臂', '巨目', '小喙']
            },
            trigger: {
                player: 'phaseBegin'
            },
            direct: true,
            filter: function (event, player) {
                                return game.roundNumber % 2 != 0 && player.storage.seer_zxc && player.storage.seer_zxc.length > 0
            },
                            onremove: function (player, skill) {
                                game.broadcastAll(function (player, target) {

                                    ui.background.setBackgroundImage('image/background/' + lib.config.image_background + '.jpg');
                                }, player);
                            },
                            content: function () {
                                'step 0'
                                player.chooseControl(player.storage.seer_zxc)
                                'step 1'
                                if (result.control == '长臂') {
                                    player.storage.seer_zxc = player.storage.seer_zxc.filter(function (str) { return str != '长臂' })
                                    player.addSkill('seer_changbi')

                                }
                                if (result.control == '巨目') {
                                    player.storage.seer_zxc = player.storage.seer_zxc.filter(function (str) { return str != '巨目' })
                                    player.addSkill('seer_jumu')

                                }
                                if (result.control == '小喙') {
                                    player.storage.seer_zxc = player.storage.seer_zxc.filter(function (str) { return str != '小喙' })
                                    player.addSkill('seer_xiaohui')

                                }
                                'step 2'
                                if (player.storage.seer_zxc.length == 2) {
                                    game.broadcastAll(function (player, target) {
                                        game.playAudio('..', 'extension', '赛尔计划/audio', 'seer_xiangzhi' + '.mp3')

                                        player.say('让我看看...你的决心...')

                                        lib.config.background_music = 'music_custom';
                                        lib.config.background_music_src = lib.assetURL + 'extension/赛尔计划/audio/binah1.mp3';
                                        game.playBackgroundMusic();
                                    }, player);
                                }
                                if (player.storage.seer_zxc.length == 1) {
                                    game.playAudio('..', 'extension', '赛尔计划/audio', 'seer_xiangzhi' + '.mp3')
                                    game.broadcastAll(function (player, target) {

                                        player.say('“潮起。”')
                                        lib.config.background_music = 'music_custom';
                                        lib.config.background_music_src = lib.assetURL + 'extension/赛尔计划/audio/binah2.mp3';
                                        game.playBackgroundMusic();
                                    }, player);
                                }
                                if (player.storage.seer_zxc.length == 0) {
                                    player.addSkill('seer_dgs')
                                    const chatLine = ['“分析——压缩——展开——”', "“直面恐惧，斩断循环”"].randomGet();
                                    game.broadcastAll(function (player, line2) {
                                        var fj = document.createElement("img");
                                        fj.src = lib.assetURL + 'extension/赛尔计划/image/background/binah_dgs.jpg';
                                        fj.style.margin = "0";
                                        fj.style.width = "100%";
                                        fj.style.height = "100%";
                                        fj.style.left = '0px';
                                        fj.style.top = '0px';
                                        fj.style.position = "absolute";
                                        fj.style.position = "absolute";
                                        fj.classList.add("荆棘铠甲");
                                        fj.style.backgroundSize = 'cover'
                                        fj.style.zIndex = "98";
                                        document.body.appendChild(fj)

                                        var fl1 = document.body.getElementsByClassName("荆棘铠甲");
                                        setTimeout(function () {
                                            fj.classList.add('arkout')
                                        }, 2000);
                                        setTimeout(function () {
                                            if (fl1[0]) {
                                                fl1[0].parentNode.removeChild(fl1[0]);
                                            }
                                        }, 3000);
                                        game.playAudio('..', 'extension', '赛尔计划/audio', 'haojiao' + '.mp3')
                                        player.say(line2)

                                        ui.background.setBackgroundImage('extension/赛尔计划/image/background/binah_dgs.gif');


                                        player.node.avatar.setBackgroundImage('extension/赛尔计划/image/character/seer_Binahmax.png');
                                        lib.config.background_music = 'music_custom';
                                        lib.config.background_music_src = lib.assetURL + 'extension/赛尔计划/audio/binah3.mp3';
                                        game.playBackgroundMusic();
                                    }, player, chatLine);
                                }
                            }
            },
//#noname-kit-end skill:seer_zhexueceng
//#noname-kit-begin skill:seer_bwzdl3
                        'seer_bwzdl3': {
                            nobracket: true,
                            trigger: {
                                player: 'phaseEnd'
                            },
                            forced: true,
                            content: function () {
                                player.drawTo(player.maxHp)
                            },
                            group: ['seer_bwzdl_die'],
                            subSkill: {
                                die: {
                                    trigger: {
                                        player: 'dieBegin'
                                    },
                                    direct: true,
                                    content: function () {
                                        game.broadcastAll(function (player, target) {
                                            player.say('出色。')
                                        }, player);
                                    }
                                }
                            }
                        },
//#noname-kit-end skill:seer_bwzdl3
//#noname-kit-begin skill:seer_xiaohui
                        'seer_xiaohui': {
                            trigger: { player: ["shaMiss"] },

                            direct: true,
                            content: function () {
                                "step 0";
                                player.chooseCard('小喙：你可以弃置一张牌对其造成一点伤害')
                                'step 1'
                                if (result.bool) {
                                    player.discard(result.cards[0])
                                    trigger.target.damage()
                                    const chatLine = ['自觉能够躲开？', '荡涤杂质，击碎星辰'].randomGet();
                                    game.broadcastAll(function (player, line2) {
                                        player.say(line2)
                                    }, player, chatLine)
                                }
                            },


                        },
//#noname-kit-end skill:seer_xiaohui
//#noname-kit-begin skill:seer_changbi
                        'seer_changbi': {
                            trigger: {
                                player: 'damageBegin'
                            },
                            forced: true,
                            filter: function (event, player) {
                                return event.nature
                            },
                            content: function () {
                                trigger.cancel()
                            }
                        },
//#noname-kit-end skill:seer_changbi
//#noname-kit-begin skill:seer_jumu
                        'seer_jumu': {
                            init: function (player) {
                                for (var i of game.players) {
                                    if (i != player) i.addTempSkill("baiban")
                                }

                            },
                            enable: 'phaseUse',
                            usable: 1,
                            content: function () {
                                player.loseHp()


                                for (var i of game.players) {
                                    if (i != player) i.addTempSkill("baiban")
                                }
                            },

                        },
//#noname-kit-end skill:seer_jumu
    // “剑”标记：不挂给任何武将，仅用于给 markSkill 提供 intro，使武将牌上的“剑”显示标记
//#noname-kit-begin skill:seer_jian
    seer_jian: {
        nobracket: true,
        marktext: "剑",
        intro: {
            content: "expansion",
            markcount: "expansion",
        },
    },
//#noname-kit-end skill:seer_jian
//#noname-kit-begin skill:seer_shouhu
    seer_shouhu: {
        dutySkill: true,
        trigger: {
            global: "gameStart",
            player: ["enterGame", "damage"],
        },
        firstDo: true,
        forced: true,
        locked: false,
        async content(event, trigger, player) {
            // —— 内部辅助函数（仅本技能使用）——
            // 使命失败处理（场上所有“剑”归于己身）
            async function seer_zhengyi_fail(p) {
                if (p.storage.seer_duty_failed) return;
                p.storage.seer_duty_failed = true;
                game.log(p, "场上所有“剑”皆归于己身，使命失败");
                await p.recover(p.maxHp - p.hp);
                await p.addSkills("seer_leifengzhijian");
                p.awakenSkill("seer_shouhu");
                // 使命失败：更名为“绝望骑士”并更换立绘
                // 名字 HTML 在主机端算好后作为参数传入，避免在客户端调用 get（联机安全）
                const jwNameHtml = get.slimName("seer_juewangqishi");
                game.broadcastAll(function (pp, nameHtml) {
                    pp.node.avatar.setBackgroundImage("extension/赛尔计划/image/character/seer_juewangqishi.jpg");
                    pp.node.name.innerHTML = nameHtml;
                    // 切换游戏背景为“绝望骑士”场景（相对路径由各端本地 lib.assetURL 拼出，联机可用）
                    ui.background.setBackgroundImage("extension/赛尔计划/image/background/seer_juewangqishi.jpg");
                    // 切换背景音乐为绝望骑士主题（联机下各端各自播放）
                    lib.config.background_music = "music_custom";
                    lib.config.background_music_src = lib.assetURL + "extension/赛尔计划/audio/seer_dutyfail.ogg";
                    game.playBackgroundMusic();
                }, p, jwNameHtml);
            }
            // 给“剑”打上局内标记（走 broadcastAll，联机安全）
            function seer_mark_jian(p, cs) {
                if (!cs) return;
                if (!Array.isArray(cs)) cs = [cs];
                p.addGaintag(cs, "seer_jian");
            }
            // 只有明确是“受到伤害”事件才走判定/移剑分支；
            // 其余一律（gameStart / enterGame）视为游戏开始，执行布置“剑”。
            const isDamage = !!trigger && (trigger.name === "damage" || trigger.name === "damageBegin");
            // 游戏开始时：将【杀】【决斗】【火攻】各一张置于一名其他角色的武将牌上
            if (!isDamage) {
                if (player.storage.seer_shouhu_started) return;
                player.storage.seer_shouhu_started = true;
                const names = ["sha", "juedou", "huogong"];
                const cards = [];
                for (const name of names) {
                    const card = get.cardPile(c => c.name === name);
                    if (card) cards.push(card);
                }
                if (cards.length < 3) {
                    game.log(player, "牌堆中剑不足，守护未能布置");
                    return;
                }
                // 注意：联机下此对象会被整包序列化发到客户端重建，
                // filterTarget 必须只使用自身参数，绝不能引用外层闭包的 player（否则客户端找不到变量而卡死）
                const result = await player.chooseTarget({
                    prompt: "守护：选择一名其他角色，将“剑”置于其武将牌上",
                    selectTarget: 1,
                    forced: true,
                    filterTarget: function (card, player, target) {
                        return target !== player && !target.isDead();
                    },
                }).forResult();
                if (!result.bool) return;
                const target = result.targets[0];
                const next = target.addToExpansion(cards, "draw");
                if (!Array.isArray(next.gaintag)) next.gaintag = [];
                next.gaintag.add("seer_jian");
                await next;
                seer_mark_jian(target, cards);
                player.storage.seer_jian = cards.slice();
                game.log(player, "将", cards.length, "柄剑置于了", target, "的武将牌上");
                return;
            }
            // 受到伤害后：判定♠则恢复一点体力，否则将场上一张“剑”移置自己的武将牌上
            const allJian = player.storage.seer_jian || [];
            if (allJian.length > 0 && allJian.every(c => get.owner(c) === player)) {
                await seer_zhengyi_fail(player);
                return;
            }
            const result = await player.judge((card) => get.suit(card) === "spade" ? 2 : -2).forResult();
            if (result.bool) {
                game.log(player, "的“守护”判定为♠，恢复了一点体力");
                await player.recover(1);
            } else {
                const jians = allJian.filter(card => {
                    const o = get.owner(card);
                    return o && o !== player;
                });
                if (!jians.length) return;
                let card;
                if (jians.length === 1) {
                    card = jians[0];
                } else {
                    const list = jians.map(c => [get.suit(c), get.number(c), c.name, c.nature || ""]);
                    const choose = await player.chooseButton(["守护：选择一张“剑”移置你的武将牌上", [list, "vcard"]], true)
                        .set("ai", () => 1)
                        .set("selectButton", [1, 1])
                        .forResult();
                    if (!choose?.bool) return;
                    const chosenName = choose.links[0][2];
                    card = jians.find(c => c.name === chosenName) || jians[0];
                }
                const from = get.owner(card);
                const next2 = player.addToExpansion(card, from, "give");
                if (!Array.isArray(next2.gaintag)) next2.gaintag = [];
                next2.gaintag.add("seer_jian");
                await next2;
                // 移置后重新标记“剑”（多重兜底确保可见）
                seer_mark_jian(player, [card]);
                game.log(player, "将场上的一柄剑移置到了自己身上");
                if ((player.storage.seer_jian || []).length > 0 && (player.storage.seer_jian || []).every(c => get.owner(c) === player)) {
                    await seer_zhengyi_fail(player);
                }
            }
        },
    },
//#noname-kit-end skill:seer_shouhu
//#noname-kit-begin skill:seer_yuxinzhijian
    seer_yuxinzhijian: {
        locked: false,
        trigger: {
            global: "damageBegin",
        },
        forced: true,
        filter(event, player) {
            const target = event.player;
            if (!target || !event.card) return false;
            const jians = player.storage.seer_jian || [];
            return jians.some(card => get.owner(card) === target && card.name === event.card.name);
        },
        content(event, trigger, player) {
            trigger.cancel();
        },
    },
//#noname-kit-end skill:seer_yuxinzhijian
//#noname-kit-begin skill:seer_leifengzhijian
    seer_leifengzhijian: {
        locked: false,
        trigger: {
            player: "phaseEnd",
        },
        forced: true,
        async content(event, trigger, player) {
            // 取自己武将牌上的“剑”（getExpansions 为邪餍同款 API）
            let jians = player.getExpansions("seer_jian");
            if (!jians.length) {
                jians = (player.storage.seer_jian || []).filter(card => get.owner(card) === player);
            }
            if (!jians.length) return;
            // 用 chooseButton + vcard 列表自选“剑”（御心之剑同款写法，已验证可用）
            const list = jians.map(c => [get.suit(c), get.number(c), c.name, c.nature || ""]);
            const choose = await player.chooseButton(
                ["泪锋：选择至少一张“剑”视为使用（未造成伤害的牌，其目标将获得该剑）", [list, "vcard"]],
                true
            )
                .set("ai", () => 1)
                .set("selectButton", [1, Math.min(3, jians.length)])
                .forResult();
            if (!choose?.bool || !choose.links?.length) {
                jians = [jians[0]];
            } else {
                const picked = [];
                for (const item of choose.links) {
                    const c = jians.find(x => x.name === item[2] && get.number(x) === item[1] && !picked.includes(x));
                    if (c) picked.push(c);
                }
                jians = picked.length ? picked : [jians[0]];
            }
            for (const card of jians) {
                const vcard = get.autoViewAs({ name: card.name, isCard: true });
                if (!player.hasUseTarget(vcard)) continue;
                // 记录各玩家本回合已累计的伤害事件数（护甲吸收也会写入历史且 num>0，故可区分“未造成伤害”）
                const dmgBefore = {};
                for (const p of game.players) {
                    const h = p.getHistory("damage");
                    dmgBefore[p.playerid] = Array.isArray(h) ? h.length : 0;
                }
                const choose = await player.chooseUseTarget(vcard, true).forResult();
                if (!choose?.bool) continue;
                const target = choose.targets && choose.targets[0];
                if (!target) continue;
                // 以此法使用的牌若未对目标造成任何伤害（被闪避、被完全防止等），目标将对应的“剑”加入手牌。
                // 护甲吸收、受伤后立即回血等情形，伤害事件均已写入历史且 num>0，故不计为“未造成伤害”。
                const hist = target.getHistory("damage");
                let dealtDamage = false;
                if (Array.isArray(hist)) {
                    for (let i = dmgBefore[target.playerid] ?? 0; i < hist.length; i++) {
                        const ev = hist[i];
                        if (ev && ev.num > 0) {
                            dealtDamage = true;
                            break;
                        }
                    }
                }
                if (!dealtDamage) {
                    await target.gain([card], "gain2");
                    game.log(target, "获得了“剑”", card, "（来自泪锋）");
                }
            }
        },
    },
//#noname-kit-end skill:seer_leifengzhijian

    // 幸福之魔法少女
//#noname-kit-begin skill:seer_weilexingfu
    seer_weilexingfu: {
        nobracket: true,
        dutySkill: true,
        trigger: {
            global: ["gainAfter", "gameStart"],
        },
        forced: true,
        async content(event, trigger, player) {
            // 游戏开始：标记已开局，排除发牌阶段的大量获得事件
            // 注意：本引擎里 content 的第 2 参 trigger 是“源事件”，不是钩子名——
            //   gameStart 钩子挂在名为 "game" 的开局事件上（game/index.js:7484 createEvent("game")），
            //   获得牌的 gainAfter 钩子，trigger 则是名为 "gain" 的 gain 事件。
            //   钩子名要用 event.triggername（content.js:3675 写入），改用 trigger.name 会永远匹配不到，
            //   导致 seer_xf_ready 永不被置位、整个技能空转。
            if (event.triggername === "gameStart") {
                player.storage.seer_xf_ready = true;
                return;
            }
            if (!player.storage.seer_xf_ready || player.storage.seer_duty_failed) return;
            const gainer = trigger.player;
            if (!gainer) return;
            // 判断本次获得是否为“摸牌”（父事件链中存在 draw / phaseDraw）
            let isDraw = false;
            let p = trigger.getParent();
            let depth = 0;
            while (p && depth < 6) {
                if (p.name === "draw" || p.name === "phaseDraw") {
                    isDraw = true;
                    break;
                }
                p = p.getParent();
                depth++;
            }
            const outsideTurn = _status.currentPhase && _status.currentPhase !== gainer;
            // 失败追踪：任意角色在回合外累计摸四张牌
            if (isDraw && outsideTurn) {
                gainer.storage.seer_xf_outdraw = (gainer.storage.seer_xf_outdraw || 0) + (trigger.cards ? trigger.cards.length : 1);
                if (gainer.storage.seer_xf_outdraw >= 4) {
                    player.storage.seer_duty_failed = true;
                    game.log(player, "有人于回合外贪婪摸牌，使命失败，化作贪婪国王");
                    await player.recover(player.maxHp - player.hp);
                    await player.addSkills("seer_baowangzhilu");
                    // 使命失败：更名为“贪婪国王”，更换立绘/游戏背景与音乐
                    // 名字/图片路径作为实参传入，避免在客户端调用 get（联机安全，遵循绝望骑士写法）
                    const xfNameHtml = "贪婪国王";
                    const xfAvatar = "extension/赛尔计划/image/character/seer_tanlanguowang.jpg";
                    const xfBg = "extension/赛尔计划/image/background/seer_tanlanguowang_bg.jpg";
                    game.broadcastAll(function (pp, nameHtml, avatarImg, bgImg) {
                        pp.node.avatar.setBackgroundImage(avatarImg);
                        pp.node.name.innerHTML = nameHtml;
                        ui.background.setBackgroundImage(bgImg);
                        lib.config.background_music = "music_custom";
                        lib.config.background_music_src = lib.assetURL + "extension/赛尔计划/audio/seer_dutyfail.ogg";
                        game.playBackgroundMusic();
                    }, player, xfNameHtml, xfAvatar, xfBg);
                    return;
                }
            }
            // 为了幸福：所有角色不以摸牌而获得牌时，你可令其摸一张牌
            if (!player.storage.seer_duty_failed && !isDraw) {
                const choose = await player.chooseBool(`为了幸福：是否令${get.translation(gainer)}摸一张牌？`)
                    .set("ai", () => false)
                    .forResult();
                if (choose.bool) {
                    await gainer.draw(1);
                }
            }
        },
    },
//#noname-kit-end skill:seer_weilexingfu
//#noname-kit-begin skill:seer_shanjinzhilu
    seer_shanjinzhilu: {
        nobracket: true,
        enable: "phaseUse",
        usable: 1, // 每回合限一次
        viewAs: {
            name: "wugu",
            isCard: true,
        },
        filterCard(card) {
            return get.suit(card) === "diamond";
        },
        selectCard: [1, 1],
        position: "he",
        group: "seer_shanjinzhilu_gain",
        subSkill: {
            gain: {
                trigger: {
                    global: "gainAfter",
                },
                forced: true,
                popup: false,
                // 优先级高于“为了幸福”（默认0）：同一次 gainAfter 上两技能都触发时，
                // 引擎只对 priority 相同的技能弹“选择下一个触发的技能”框，
                // 设为 1(引擎内部 ×100) 可固定“先K化、再询问摸牌”的顺序且不弹框
                priority: 1,
                filter(event, player) {
                    const evt = event.getParent("wugu", true);
                    return evt && evt.skill == "seer_shanjinzhilu" && evt.player == player;
                },
                async content(event, trigger, player) {
                    for (const card of trigger.cards) {
                        if (get.itemtype(card) === "card") {
                            // 点数必须写数字 13，不能写字符串 "K"：
                            // 引擎的 card.number 是数字（card.js:310 parseInt），显示层用 get.strNumber 转换，
                            // 而 get.strNumber 对非数字直接 return undefined（get/index.js:3993）。
                            // 写成 "K" 时手牌靠 $init 的兜底还能显示 K（card.js:345），
                            // 但装备区是 `${suit}${number} ${name}`（player.js:15324/15332），会显示成 "♦undefined 贯石斧"。
                            card.number = 13;
                            card.$init([card.suit, card.number, card.name, card.nature]);
                        }
                    }
                    game.log(player, "以闪金之路获得的牌点数修改为K");
                },
            },
        },
    },
//#noname-kit-end skill:seer_shanjinzhilu
//#noname-kit-begin skill:seer_baowangzhilu
    seer_baowangzhilu: {
        nobracket: true,
        locked: true,
        forced: true,
        trigger: {
            player: ["phaseUse", "phaseDiscard"],
        },
        async content(event, trigger, player) {
            const name = trigger.name;
            if (name === "phaseUse") {
                // 出牌阶段开始时，选择一张手牌与所有其他角色拼点
                const targets = game.filterPlayer(t => t !== player && !t.isDead() && t.countCards("h") > 0);
                if (!targets.length) return;
                const result = await player.chooseToCompare(targets).forResult();
                if (!result || result.cancelled) return;
                const myNum = get.number(result.player, player);
                const tCards = result.targets;
                for (let i = 0; i < targets.length; i++) {
                    const target = targets[i];
                    const tCard = tCards && tCards[i];
                    const tNum = tCard ? get.number(tCard, target) : -1;
                    if (myNum > tNum) {
                        await target.damage(2, player);
                    } else if (tCard) {
                        await player.gain(tCard, "gain2");
                    }
                }
            } else if (name === "phaseDiscard") {
                // 弃牌阶段开始时，流失X点体力并获得X点手牌上限（X=应弃置的牌数）
                const limit = player.getHandcardLimit();
                const handCount = player.countCards("h");
                const X = Math.max(0, handCount - limit);
                if (X > 0) {
                    await player.loseHp(X);
                    player.storage.seer_baowang_limit = (player.storage.seer_baowang_limit || 0) + X;
                }
            }
        },
        mod: {
            maxHandcard(player, num) {
                if (player.storage && player.storage.seer_baowang_limit) {
                    return num + player.storage.seer_baowang_limit;
                }
                return num;
            },
        },
    },
//#noname-kit-end skill:seer_baowangzhilu
//#noname-kit-begin skill:seer_kuangren
    seer_kuangren: {
        locked: true,
        forced: true,
        trigger: {
            source: "damageEnd",
        },
        group: "seer_kuangren_bonus",
        filter(event, player) {
            return event.num > 0 && event._dyinged;
        },
        async content(event, trigger, player) {
            const num = trigger.num;
            await player.draw(num);
            player.storage.seer_kuangren_bonus = (player.storage.seer_kuangren_bonus || 0) + num;
            game.log(player, `狂刃：摸${num}张牌，下一次造成的伤害+${num}`);
        },
        subSkill: {
            bonus: {
                // 下一次造成的伤害 +X（damageBegin1 时加算并清零）
                trigger: {
                    source: "damageBegin1",
                },
                forced: true,
                silent: true,
                popup: false,
                filter(event, player) {
                    return (player.storage.seer_kuangren_bonus || 0) > 0;
                },
                content(event, trigger, player) {
                    const bonus = player.storage.seer_kuangren_bonus || 0;
                    trigger.num += bonus;
                    player.storage.seer_kuangren_bonus = 0;
                    game.log(player, `狂刃：本次伤害+${bonus}`);
                },
            },
        },
    },
//#noname-kit-end skill:seer_kuangren
//#noname-kit-begin skill:seer_jitao
    seer_jitao: {
        mod: {
            // 本回合下一张是第奇数张 → 无距离限制
            targetInRange(card, player, target) {
                if (player.getStorage("seer_jitao_count", 0) % 2 === 0) {
                    return true;
                }
            },
            // 本回合下一张是第偶数张 → 无次数限制
            cardUsable(card, player, num) {
                if (player.getStorage("seer_jitao_count", 0) % 2 === 1) {
                    return Infinity;
                }
            },
        },
        trigger: {
            global: "phaseBegin",
            player: "useCard",
        },
        forced: true,
        silent: true,
        content(event, trigger, player) {
            if (trigger.name === "phase") {
                player.setStorage("seer_jitao_count", 0);
            } else {
                player.setStorage("seer_jitao_count", player.getStorage("seer_jitao_count", 0) + 1);
            }
        },
    },
//#noname-kit-end skill:seer_jitao
//#noname-kit-begin skill:seer_yifu
    seer_yifu: {
        // 每回合限一次：任一角色使用「仅以自己为目标」的牌时，把【伊芙】移到他身上并 +1
        trigger: {
            global: "useCardAfter",
        },
        usable: 1,
        mark: true,
        marktext: "伊芙",
        intro: {
            markcount(storage, player) {
                return player.storage.seer_yifu || 0;
            },
            content(storage, player) {
                return `“伊芙”${player.storage.seer_yifu || 0} 枚。持有者出牌阶段结束时获得一张【桃】；使用单目标基本牌或普通锦囊牌时，可交给西斯一张牌令此牌额外结算一次，然后“伊芙”数减一。`;
            },
        },
        filter(event, player) {
            const targets = event.targets;
            if (!targets || targets.length !== 1) {
                return false;
            }
            return targets[0] === event.player;
        },
        async content(event, trigger, player) {
            const target = trigger.player;
            const old = game.filterPlayer(current => current !== target && (current.storage.seer_yifu || 0) > 0)[0];
            const num = (old?.storage?.seer_yifu || 0) + 1;
            game.broadcastAll((oldPlayer, newPlayer, count) => {
                if (oldPlayer) {
                    oldPlayer.storage.seer_yifu = 0;
                    oldPlayer.unmarkSkill("seer_yifu");
                }
                newPlayer.storage.seer_yifu = count;
                newPlayer.markSkill("seer_yifu");
            }, old || null, target, num);
            game.log(target, "获得了", "#g【伊芙】", `（${num} 枚）`);
        },
    },
//#noname-kit-end skill:seer_yifu
//#noname-kit-begin skill:seer_zhuzhan
    seer_zhuzhan: {
        // ① 拥有【伊芙】的角色，出牌阶段结束时获得一张【桃】
        group: "seer_zhuzhan_use",
        trigger: {
            global: "phaseUseEnd",
        },
        forced: true,
        popup: false,
        filter(event, player) {
            return (event.player.storage.seer_yifu || 0) > 0;
        },
        async content(event, trigger, player) {
            const holder = trigger.player;
            holder.logSkill("seer_zhuzhan");
            // 点数随机（花色随机红桃/方块），且进入弃牌堆时直接销毁
            const number = 1 + Math.floor(Math.random() * 13);
            const card = game.createCard("tao", "red", number);
            card.destroyed = "discardPile";
            await holder.gain(card, "gain2");
        },
        subSkill: {
            use: {
                // ② 拥有【伊芙】的角色使用单目标基本/普通锦囊牌时，可交给西斯一张牌令此牌额外结算一次
                trigger: {
                    global: "useCardToPlayer",
                },
                forced: true,
                popup: false,
                silent: true,
                charlotte: true,
                filter(event, player) {
                    if (!event.isFirstTarget) {
                        return false;
                    }
                    if (event.targets?.length !== 1) {
                        return false;
                    }
                    if (!["basic", "trick"].includes(get.type(event.card))) {
                        return false;
                    }
                    const holder = event.player;
                    if ((holder.storage.seer_yifu || 0) <= 0) {
                        return false;
                    }
                    return holder === player || holder.countCards("he") > 0;
                },
                async content(event, trigger, player) {
                    const holder = trigger.player;
                    const isSelf = holder === player;
                    const result = await holder
                        .chooseBool(isSelf ? "助战：消耗 1 枚【伊芙】，令此牌额外结算一次？" : "助战：交给西斯一张牌，令此牌额外结算一次？（消耗 1 枚【伊芙】）")
                        .forResult();
                    if (!result.bool) {
                        return;
                    }
                    if (!isSelf) {
                        const cardResult = await holder
                            .chooseCard("he", true, "助战：交给西斯一张牌")
                            .set("ai", card => -get.value(card))
                            .forResult();
                        if (!cardResult?.bool || !cardResult.cards?.length) {
                            return;
                        }
                        holder.$give(cardResult.cards, player, false);
                        await player.gain(cardResult.cards, holder, "giveAuto");
                    }
                    trigger.getParent().effectCount++;
                    game.log(trigger.card, "额外结算一次");
                    game.broadcastAll(current => {
                        current.storage.seer_yifu = Math.max(0, (current.storage.seer_yifu || 0) - 1);
                        if (current.storage.seer_yifu > 0) {
                            current.markSkill("seer_yifu");
                        } else {
                            current.unmarkSkill("seer_yifu");
                        }
                    }, holder);
                },
            },
        },
    },
//#noname-kit-end skill:seer_zhuzhan
//#noname-kit-begin skill:seer_zhuanyi
    seer_zhuanyi: {
        trigger: {
            player: "useCardToPlayer",
        },
        usable: 1,
        filter(event, player) {
            if (!event.isFirstTarget) {
                return false;
            }
            return ["basic", "trick"].includes(get.type(event.card));
        },
        async content(event, trigger, player) {
            const result = await player
                .chooseTarget("转移：选择此牌新的使用者", (card, player2, target) => target !== player2)
                .set("ai", target => -get.attitude(player, target))
                .forResult();
            if (!result?.bool || !result.targets?.length) {
                return;
            }
            const target = result.targets[0];
            player.logSkill("seer_zhuanyi", target);
            trigger.untrigger();
            trigger.getParent().player = target;
            game.log(target, "成为了", trigger.card, "的使用者");
        },
    },
//#noname-kit-end skill:seer_zhuanyi
//#noname-kit-begin skill:seer_huangjinluoxuan
    seer_huangjinluoxuan: {
        nobracket: true,
        // 锁定技：摸牌阶段额外摸牌，随后弃牌；弃到装备/锦囊叠永久加成
        trigger: {
            player: "phaseDrawBegin2",
        },
        forced: true,
        popup: false,
        mark: true,
        marktext: "螺",
        intro: {
            markcount(storage, player) {
                return player.getStorage("seer_huangjin_sha", 0);
            },
            content(storage, player) {
                const draw = player.getStorage("seer_huangjin_draw", 0);
                const discard = player.getStorage("seer_huangjin_discard", 0);
                const sha = player.getStorage("seer_huangjin_sha", 0);
                return `黄金螺旋：额外摸牌 ${1 + draw} 张、弃牌 ${1 + discard} 张、使用【杀】次数上限 +${sha}`;
            },
        },
        mod: {
            cardUsable(card, player, num) {
                if (card.name == "sha") {
                    return num + player.getStorage("seer_huangjin_sha", 0);
                }
            },
        },
        async content(event, trigger, player) {
            // 额外摸牌（锁定，不询问）
            const add = 1 + player.getStorage("seer_huangjin_draw", 0);
            trigger.num += add;
            game.log(player, "黄金螺旋：额外摸", "#y" + add, "张牌");
            player.addTempSkill("seer_huangjinluoxuan_discard");
        },
        subSkill: {
            discard: {
                // 摸牌结束后强制弃牌，弃到装备/锦囊触发加成
                trigger: {
                    player: "phaseDrawAfter",
                },
                forced: true,
                popup: false,
                silent: true,
                charlotte: true,
                async content(event, trigger, player) {
                    player.removeSkill(event.name);
                    const discardNum = 1 + player.getStorage("seer_huangjin_discard", 0);
                    const count = Math.min(discardNum, player.countCards("he"));
                    if (count <= 0) {
                        return;
                    }
                    const result = await player
                        .chooseToDiscard(count, "he", true, `黄金螺旋：弃置${count}张牌`)
                        .set("ai", card => -get.value(card))
                        .forResult();
                    const cards = result?.cards || [];
                    const list = cards.filter(card => ["basic", "trick", "equip"].includes(get.type(card)));
                    // 基本牌：令一个［］数值+1；锦囊牌：出杀次数+1；装备牌：获得1点临时护甲
                    for (const card of list) {
                        const type = get.type(card);
                        if (type == "basic") {
                            const choice = await player
                                .chooseControl("摸牌数+1", "弃牌数+1")
                                .set("prompt", `黄金螺旋：${get.translation(card)}（基本牌）的加成`)
                                .set("ai", () => 0)
                                .forResult();
                            if (choice.index === 0) {
                                player.setStorage("seer_huangjin_draw", player.getStorage("seer_huangjin_draw", 0) + 1);
                            } else {
                                player.setStorage("seer_huangjin_discard", player.getStorage("seer_huangjin_discard", 0) + 1);
                            }
                        } else if (type == "trick") {
                            // 锦囊牌：出杀次数 +1（永久）
                            player.setStorage("seer_huangjin_sha", player.getStorage("seer_huangjin_sha", 0) + 1);
                        } else if (type == "equip") {
                            // 装备牌：获得1点护甲
                            await player.changeHujia(1);
                        }
                    }
                    player.markSkill("seer_huangjinluoxuan");
                    await game.delay();
                },
            },
        },
    },
//#noname-kit-end skill:seer_huangjinluoxuan
//#noname-kit-begin skill:seer_hnxt
    seer_hnxt: {
        nobracket: true,
        // 开局（第一回合开始时，此时已发完牌）：记录初始手牌 + 额外 2 次手气卡
        trigger: {
            global: "phaseBegin",
        },
        init(player, skill) {
            player.storage.seer_hnxt_done = false;
        },
        filter(event, player) {
            return !player.storage.seer_hnxt_done;
        },
        group: ["seer_hnxt_shijiu"],
        forced: true,
        mark: true,
        marktext: "皇",
        intro: {
            content(storage, player) {
                const list = player.storage.seer_hnxt_initial || [];
                if (!list.length) {
                    return "尚无初始手牌记录";
                }
                return `初始手牌：${list.map(name => get.translation(name)).join("、")}`;
            },
        },
        async content(event, trigger, player) {
            player.storage.seer_hnxt_done = true;
            // 记录初始手牌（与引擎一致：_start_cards = 开局发到的牌）
            const record = () => {
                const cards = player._start_cards && player._start_cards.length ? player._start_cards : player.getCards("h");
                player.storage.seer_hnxt_initial = cards.map(card => get.name(card));
                player.markSkill("seer_hnxt");
            };
            record();
            // 额外 2 次手气卡：与官方 replaceHandcards 完全一致的重铸写法
            for (let i = 0; i < 2; i++) {
                const left = 2 - i;
                const result = await player
                    .chooseBool(`皇女系统：是否使用手气卡重铸所有手牌？（剩余 ${left} 次）`)
                    .set("ai", () => false)
                    .forResult();
                if (!result?.bool) {
                    break;
                }
                const hs = player.getCards("h");
                if (!hs.length) {
                    break;
                }
                const cards = [];
                for (const card of hs) {
                    card.removeGaintag(true);
                    card.discard(false);
                }
                cards.addArray(get.cards(hs.length));
                player.directgain(cards);
                // 重铸后的牌就是新的初始手牌
                player._start_cards = cards;
                record();
            }
        },
        subSkill: {
            shijiu: {
                trigger: {
                    // 求桃失败、即将死亡时触发（dieBefore 在死亡结算之前）
                    player: "dieBefore",
                },
                forceDie: true,
                forced: true,
                async content(event, trigger, player) {
                    // 已经被救回就不处理；体力上限已不足 1 点（再减就死）时也不触发，直接死亡
                    if (player.hp > 0 || player.maxHp <= 1) {
                        return;
                    }
                    // 防重入：避免同一溣死流程里反复触发
                    if (player.storage.seer_hnxt_busy) {
                        return;
                    }
                    player.storage.seer_hnxt_busy = true;
                    // 取消死亡
                    trigger.cancel();
                    game.log(player, "「皇女」系统：失救，体力上限-1并回满体力");
                    await player.loseMaxHp();
                    if (player.hp < player.maxHp) {
                        await player.recover(player.maxHp - player.hp);
                    }
                    await player.discard(player.getCards("h"));
                    const names = (player.storage.seer_hnxt_initial || []).slice();
                    const num = Math.min(player.hp || 0, names.length);
                    if (num > 0) {
                        const result = await player
                            .chooseButton(num, ["皇女系统：选择你要获得的牌", [names, "vcard"]], true)
                            .forResult();
                        if (result?.bool && result.links?.length) {
                            const cards = result.links.map(link => game.createCard({ name: link[2] }));
                            await player.gain(cards, "gain2");
                        }
                    }
                    delete player.storage.seer_hnxt_busy;
                },
            },
        },
    },
//#noname-kit-end skill:seer_hnxt
//#noname-kit-begin skill:seer_sjzf
    seer_sjzf: {
        nobracket: true,
        trigger: {
            global: ["chooseToRespondBefore", "chooseToUseBefore"],
        },
        filter(event, player) {
            if (event.responded) {
                return false;
            }
            // 手里没有【闪】就别询问
            if (!player.countCards("h", card => get.name(card) == "shan")) {
                return false;
            }
            if (!event.filterCard({ name: "shan", isCard: true }, player, event)) {
                return false;
            }
            return event.player != player && player.inRange(event.player);
        },
        check(event, player) {
            return get.attitude(player, event.player) > 0;
        },
        // 不弹「是否发动」询问，直接进入选闪/取消
        direct: true,
        async content(event, trigger, player) {
            const next = player.chooseToRespond("是否替" + get.translation(trigger.player) + "打出一张闪？", { name: "shan" });
            next.set("source", player);
            next.autochoose = lib.filter.autoRespondShan;
            const result = await next.forResult();
            if (!result?.bool || !result.cards?.length) {
                return;
            }
            const numShan = get.number(result.cards[0]) || 0;
            const numCard = get.number(trigger.parent.card) || 0;
            if (numShan > numCard) {
                // 闪的点数大于被响应的牌：获得那张牌
                const cards = trigger.parent.cards ? trigger.parent.cards.filterInD() : [];
                if (cards.length) {
                    await player.gain(cards, "gain2");
                }
            } else {
                await player.damage(1, trigger.parent.player);
            }
            trigger.result = { bool: true, card: { name: "shan", isCard: true } };
            trigger.responded = true;
            trigger.animate = false;
        },
    },
//#noname-kit-end skill:seer_sjzf
//#noname-kit-begin skill:seer_psgt
    seer_psgt: {
        nobracket: true,
        trigger: {
            player: "damageEnd",
        },
        forced: true,
        group: ["seer_psgt_add", "seer_psgt_reset"],
        async content(event, trigger, player) {
            const source = trigger.source;
            if (source && source.isIn() && source.countCards("he")) {
                await player.discardPlayerCard(source, "he", true);
            }
            player.storage.seer_psgt_pending = true;
            game.log(player, "破损光体：本回合下次受到的伤害+1");
        },
        subSkill: {
            add: {
                trigger: {
                    player: "damageBegin1",
                },
                forced: true,
                filter(event, player) {
                    return !!player.storage.seer_psgt_pending;
                },
                content(event, trigger, player) {
                    trigger.num += 1;
                    delete player.storage.seer_psgt_pending;
                    game.log(player, "破损光体：本次伤害+1");
                },
            },
            reset: {
                trigger: {
                    global: "phaseEnd",
                },
                forced: true,
                silent: true,
                popup: false,
                charlotte: true,
                filter(event, player) {
                    return !!player.storage.seer_psgt_pending;
                },
                content(event, trigger, player) {
                    delete player.storage.seer_psgt_pending;
                },
            },
        },
    },
//#noname-kit-end skill:seer_psgt
};


export default skills;
