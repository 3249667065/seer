import { lib, game, ui, get, ai, _status } from "noname";
import card from "./card.js";
import list from "./list.js";
import skill from "./skill.js";
import translate from "./translate.js";

game.import("card", function () {
	const seer = {
		name: "seer",
		connect: true,
		card,
		skill,
		translate,
		list,
	};
	lib.translate["seer_card_config"] = "赛尔计划";
	lib.config.all.cards.add("seer");
	return seer;
});
