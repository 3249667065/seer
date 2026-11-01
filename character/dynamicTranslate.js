import { lib, game, ui, get, ai, _status } from '../../../../noname.js'

const dynamicTranslates = {
    seer_fuxiao(player) {
        if (get.info("seer_fuxiao").getList(player, "seer_fuxiao").slice(0, 1).includes("shan"))
            return "限定技，当你需要使用【闪】时，你可以将你的一张牌当做一张场上没有的判定牌置入你的判定区以视为使用之。";
        return "限定技，当你需要使用【无懈可击】时，你可以将你的一张牌当做一张场上没有的判定牌置入你的判定区以视为使用之。";
    },
    seer_xiyao(player) {
        if (get.info("seer_fuxiao").getList(player, "seer_fuxiao").slice(1, 2).includes("wuxie"))
            return "限定技，当你需要使用【无懈可击】时，你可以将你区域内一张牌移动至其他角色的对应区域以视为使用之。";
        return "限定技，当你需要使用【闪】时，你可以将你区域内一张牌移动至其他角色的对应区域以视为使用之。";
    },
    seer_chunti() {
        return "锁定技，其他角色的回合结束时，若你于该回合内未受到过伤害，你复原一个已使用的技能。";
    },

};
export default dynamicTranslates;
