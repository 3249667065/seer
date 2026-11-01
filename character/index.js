import { lib, game, ui, get, ai, _status } from "noname";
import characters from "./character.js";
import cards from "./card.js";
import pinyins from "./pinyin.js";
import skills from "./skill.js";
import translates from "./translate.js";
import characterIntros from "./intro.js";
import characterFilters from "./characterFilter.js";
import characterTitles from "./characterTitle.js";
import characterReplaces from "./characterReplace.js";
import dynamicTranslates from "./dynamicTranslate.js";
import voices from "./voices.js";
import { characterSort, characterSortTranslate } from "./sort.js";

game.import("character", function () {
	const seer = {
		name: "seer",
		connect: true,
		character: { ...characters },
		characterSort: {
			seer: characterSort
		},
		characterFilter: { ...characterFilters },
		characterTitle: {...characterTitles},
		
		dynamicTranslate: { ...dynamicTranslates },
		characterIntro: { ...characterIntros },
		characterReplace: { ...characterReplaces },
		card: { ...cards },
		skill: { ...skills },
		translate: { ...translates, ...voices, ...characterSortTranslate },
		pinyins: { ...pinyins },
	};
	if (!lib.config[`extension_赛尔计划_characterPack_seer_enable`]) {
		game.saveExtensionConfig("赛尔计划", "characterPack_seer_enable", true);
		lib.config.characters.add("seer");
		game.saveConfig("characters", lib.config.characters);
	}
    lib.translate["seer_character_config"] = "赛尔计划";
    return seer;
});


