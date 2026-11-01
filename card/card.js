import { lib, game, ui, get, ai, _status } from "noname";

const card = {
//#noname-kit-begin card:seer_mohe
	seer_mohe: {
		fullskin: true,
	    derivation: "seer_zhezhi",
	    type: "equip",
	    subtype: "equip5",
	    skills: ["seer_mohe_skill"],
	    ai: {
	    	basic: {
	    		equipValue: 9.5,
	    	},
	    },
	    cardPrompt(card) {
	    	const list = lib.skill.seer_mohe_skill.initList();
	    	const str = list.map(name => get.translation(name)).join(" ");
	        return `你的牌结算后，将随机一个不在［］中的基本或普通锦囊牌名置于［］中，你可将此牌当做［${str}］中的牌名使用并移除［］中的对应牌名。`;
	    },
	},
//#noname-kit-end card:seer_mohe
};

for (let i in card) {
	card[i].image = "ext:赛尔计划/image/card/" + i + ".png";
}

export default card;
