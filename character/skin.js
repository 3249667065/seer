'use strict';
import { game, get, lib, ui, _status, ai } from '../../../../noname.js';

if (!lib.qhlypkg) {
    lib.qhlypkg = [];
}
var taici = {};

lib.qhlypkg.push({
    isExt: true,//是否是扩展，一般填true
    filterCharacter: function (name) {
        //判断此ID的武将是否属于此皮肤包
        return name.indexOf('赛尔计划_') == 0 || name.indexOf('db_赛尔计划_') == 0;
    },
    skillSkin: function (name, skin, skill) {
        var extSkin = {};
        var info = extSkin[name];
        if (info) {
            var info2 = info[skin ? skin : '___origin'];
            if (info2) {
                return info2[skill];
            }
        }
        return undefined;
    },
    characterNameTranslate: function (name) {
        //这里根据武将ID返回其中文名字。
        return get.translation(name);
    },
    characterTaici: function (name) {
        //这里返回武将原皮台词。
        return taici[name];
    },
    originSkinInfo: function (name) {
        var info = {};
        return info[name];
    },
    characterInfo: function (name) {
        //这里可以返回角色资料。如不返回则显示get.characterIntro(name)。
    },
    //原皮前缀，标识原皮肤的位置
    prefix: 'extension/赛尔计划/image/character/', 
    //露头前缀，标识原皮肤的位置
    lutouPrefix: 'extension/赛尔计划/image/skin/lutou/',
    isLutou: false,
    skin: {
        //可切换普通皮肤的前缀
        standard: 'extension/赛尔计划/image/skin/standard/',
        //皮肤位置
        lutou: 'extension/赛尔计划/image/skin/lutou/',
        //皮肤原画在千幻聆音扩展内的位置
        origin: 'extension/赛尔计划/image/skin/yuanhua/',
    },
    //原技能配音位置
    audioOrigin: 'extension/赛尔计划/audio/skill/',
    //切换皮肤后的技能配音位置
    audio: 'extension/赛尔计划/image/skin/audio/skill/',
    skininfo: {},
    skinShare: {},
    skinChange:{},
});
