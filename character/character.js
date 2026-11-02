import { lib } from "noname";

const characters = {
//#noname-kit-begin character:seer_aofeiliya
    seer_aofeiliya: {
        sex: "female",
        hp: 4,
        group: "shu",
        skills: ["seer_xingming", "seer_yisong"],
        trashBin: [],
    },
//#noname-kit-end character:seer_aofeiliya
//#noname-kit-begin character:seer_sp_meiheweite
    seer_sp_meiheweite: {
        sex: "female",
        hp: 4,
        group: "qun",
        skills: ["seer_zhurichangshi", "seer_zhuoritianxing", "seer_changzhoudagao"],
        trashBin: [],
    },
//#noname-kit-end character:seer_sp_meiheweite
//#noname-kit-begin character:seer_huodeer
    seer_huodeer: {
        sex: "male",
        hp: 3,
        group: "qun",
        skills: ["seer_jinyejuexi", "seer_youzhangchuiming"],
        trashBin: [],
        hasHiddenSkill: true,
    },
//#noname-kit-end character:seer_huodeer
//#noname-kit-begin character:seer_zhixushenghua
    seer_zhixushenghua: {
        sex: "female",
        hp: 3,
        group: "shen",
        skills: ["seer_yaoshi", "seer_zhengfa", "seer_chongsu", "seer_jiamian"],
        trashBin: [],
        isZhugong: true,
    },
//#noname-kit-end character:seer_zhixushenghua
//#noname-kit-begin character:seer_zhezhi
    seer_zhezhi: {
        sex: "female",
        hp: 3,
        group: "qun",
        skills: ["seer_miaobi", "seer_huajing"],
        trashBin: [],
    },
//#noname-kit-end character:seer_zhezhi
//#noname-kit-begin character:seer_dilutianfeng
    seer_dilutianfeng: {
        sex: "female",
        hp: 4,
        group: "qun",
        skills: ["seer_wancangshudilu", "seer_fenghaojinxueyu"],
        trashBin: [],
    },
//#noname-kit-end character:seer_dilutianfeng
//#noname-kit-begin character:seer_suolunsen
    seer_suolunsen: {
        sex: "male",
        hp: 7,
        group: "devil",
        skills: ["seer_anmiejunwang", "seer_beiqishengling"],
        trashBin: [],
    },
//#noname-kit-end character:seer_suolunsen
//#noname-kit-begin character:seer_mixiuli
    seer_mixiuli: {
        sex: "female",
        hp: 4,
        group: "jin",
        skills: ["seer_shihuangwenhen", "seer_buyezhixue"],
        trashBin: [],
    },
//#noname-kit-end character:seer_mixiuli
//#noname-kit-begin character:seer_shengyuxieyan
    seer_shengyuxieyan: {
        sex: "male",
        hp: 3,
        maxHp: 4,
        group: "devil",
        skills: ["seer_cishenjiwujian", "seer_shengxiezhixuwang"],
        trashBin: [],
    },
//#noname-kit-end character:seer_shengyuxieyan
//#noname-kit-begin character:seer_moruier
    seer_moruier: {
        sex: "female",
        hp: 4,
        group: "wu",
        skills: ["seer_qianchungongzhan", "seer_fangxinyongcun"],
        trashBin: [],
    },
//#noname-kit-end character:seer_moruier
//#noname-kit-begin character:seer_aertuimisi
    seer_aertuimisi: {
        sex: "female",
        hp: 4,
        group: "qun",
        skills: ["seer_shousha", "seer_guanyue", "seer_zhulie"],
        trashBin: [],
    },
//#noname-kit-end character:seer_aertuimisi
//#noname-kit-begin character:seer_monika
    seer_monika: {
        sex: "female",
        hp: 4,
        group: "qun",
        skills: ["seer_enzewanling", "seer_shengyukongxin"],
        trashBin: [],
    },
//#noname-kit-end character:seer_monika
//#noname-kit-begin character:seer_aiensi
    seer_aiensi: {
        sex: "male",
        hp: 4,
        group: "shu",
        skills: ["seer_fantianjunyan", "seer_huozhongyongcun"],
        trashBin: [],
    },
//#noname-kit-end character:seer_aiensi
//#noname-kit-begin character:seer_canglan
    seer_canglan: {
        sex: "female",
        hp: 3,
        // hujia: 1,
        group: "wei",
        skills: ["seer_luoshuijinghong", "seer_canghaiyongcun"],
        trashBin: [],
    },
//#noname-kit-end character:seer_canglan
//#noname-kit-begin character:seer_luomuhuaite
    seer_luomuhuaite: {
        sex: "male",
        hp: 4,
        group: "qun",
        skills: ["seer_shitu", "seer_yueshi"],
        trashBin: [],
    },
//#noname-kit-end character:seer_luomuhuaite
//#noname-kit-begin character:seer_shacao
    seer_shacao: {
        sex: "female",
        hp: 3,
        group: "wu",
        skills: ["seer_wanjuanshu", "seer_wanlilu"],
        trashBin: [],
    },
//#noname-kit-end character:seer_shacao
//#noname-kit-begin character:seer_guimianyoudie
    seer_guimianyoudie: {
        sex: "female",
        hp: 3,
        group: "qun",
        skills: ["seer_yingsuo", "seer_yingguang"],
        trashBin: [],
    },
//#noname-kit-end character:seer_guimianyoudie
//#noname-kit-begin character:seer_nanshuang
    seer_nanshuang: {
        sex: "female",
        hp: 4,
        group: "wei",
        skills: ["seer_zhefu", "seer_hanlu", "seer_zhufa"],
        trashBin: [],
    },
//#noname-kit-end character:seer_nanshuang
//#noname-kit-begin character:seer_donghui
    seer_donghui: {
        sex: "male",
        hp: 4,
        group: "wei",
        skills: ["seer_jingzhe", "seer_jingmo", "seer_shizui"],
        trashBin: [],
    },
//#noname-kit-end character:seer_donghui
//#noname-kit-begin character:seer_gaiya
    seer_gaiya: {
        sex: "male",
        hp: 4,
        group: "qun",
        skills: ["seer_guiyuan", "seer_aofa", "seer_yunshang"],
        trashBin: [],
    },
//#noname-kit-end character:seer_gaiya
//#noname-kit-begin character:seer_zhujiecangxing
    seer_zhujiecangxing: {
        sex: "female",
        hp: 4,
        group: "wei",
        skills: ["seer_jiegou", "seer_zaishu"],
        trashBin: [],
    },
//#noname-kit-end character:seer_zhujiecangxing
//#noname-kit-begin character:seer_xiye
    seer_xiye: {
        sex: "male",
        hp: 4,
        group: "wu",
        skills: ["seer_fusang", "seer_ruomu", "seer_shangsi"],
        trashBin: [],
    },
//#noname-kit-end character:seer_xiye
//#noname-kit-begin character:seer_beiniao
    seer_beiniao: {
        sex: "female",
        hp: 4,
        group: "wu",
        skills: ["seer_fuxiao", "seer_xiyao", "seer_chunti"],
        trashBin: [],
    },
//#noname-kit-end character:seer_beiniao
//#noname-kit-begin character:seer_sanhua
    seer_sanhua: {
        sex: "female",
        hp: 3,
        hujia: 1,
        group: "wei",
        skills: ["seer_ningshuang", "seer_guankong"],
        trashBin: [],
    },
//#noname-kit-end character:seer_sanhua
//#noname-kit-begin character:seer_ailiya
    seer_ailiya: {
        sex: "female",
        hp: 3,
        group: "qun",
        skills: ["seer_changming", "seer_dianyou"],
        trashBin: [],
    },
//#noname-kit-end character:seer_ailiya
//#noname-kit-begin character:seer_meheweite
    seer_meheweite: {
        sex: "female",
        hp: 4,
        group: "shen",
        skills: ["seer_huaixin", "seer_zhaohui"],
        trashBin: [],
    },
//#noname-kit-end character:seer_meheweite
//#noname-kit-begin character:seer_wuming
    seer_wuming: {
        sex: "female",
        hp: 4,
        group: "shen",
        skills: ["seer_suoxin", "seer_juquan"],
        trashBin: [],
    },
//#noname-kit-end character:seer_wuming
//#noname-kit-begin character:seer_diduo
    seer_diduo: {
        sex: "female",
        hp: 4,
        group: "jin",
        skills: ["seer_xinglv", "seer_diyue"],
        trashBin: [],
    },
//#noname-kit-end character:seer_diduo
//#noname-kit-begin character:seer_younasi
    seer_younasi: {
        sex: "male",
        hp: 2,
        group: "qun",
        skills: ["seer_shenkong", "seer_tansuo"],
        trashBin: [],
    },
//#noname-kit-end character:seer_younasi
//#noname-kit-begin character:seer_suojiedeer
    seer_suojiedeer: {
        sex: "female",
        hp: 4,
        group: "jin",
        skills: ["seer_hunzhilvfa", "seer_mingdanruxu", "seer_hunyunruomeng"],
        trashBin: [],
    },
//#noname-kit-end character:seer_suojiedeer
//#noname-kit-begin character:seer_wujishengwu
    seer_wujishengwu: {
        sex: "male",
        hp: 5,
        group: "qun",
        skills: ["seer_tianzheng", "seer_wuzhu"],
        trashBin: [],
    },
//#noname-kit-end character:seer_wujishengwu
//#noname-kit-begin character:seer_liumeng
    seer_liumeng: {
        sex: "male",
        hp: 4,
        group: "qun",
        skills: ["seer_liumeng_mengqi", "seer_liumeng_mingyin"],
        trashBin: [],
    },
//#noname-kit-end character:seer_liumeng
//#noname-kit-begin character:seer_sp_liumeng
    seer_sp_liumeng: {
        sex: "female",
        hp: 3,
        group: "qun",
        skills: ["seer_zhouyuan", "seer_shimeng", "seer_huayan"],
        trashBin: [],
    },
//#noname-kit-end character:seer_sp_liumeng
//#noname-kit-begin character:seer_zhakesi
    seer_zhakesi: {
        sex: "none",
        hp: 4,
        group: "qun",
        skills: ["seer_fuyu", "seer_linmou"],
        trashBin: [],
    },
//#noname-kit-end character:seer_zhakesi

    //以下为超舟扩展角色
//#noname-kit-begin character:seer_kali
    seer_kali: {
        sex: "female",
        hp: 4,
        group: "shu",
        skills: ["seer_tsdcs", "seer_xrdzq", "seer_ssdjq"],
        trashBin: [],
    },
//#noname-kit-end character:seer_kali
//#noname-kit-begin character:seer_Binah
    seer_Binah: {
        sex: "female",
        hp: 4,
        group: "qun",
        skills: ["seer_bwzdl3", "seer_zhexueceng"],
        trashBin: [],
    },
//#noname-kit-end character:seer_Binah
//#noname-kit-begin character:seer_zhengyizhimofashaonv
    seer_zhengyizhimofashaonv: {
        sex: "female",
        hp: 3,
        group: "qun",
        skills: ["seer_shouhu", "seer_yuxinzhijian"],
        trashBin: [],
    },
//#noname-kit-end character:seer_zhengyizhimofashaonv
//#noname-kit-begin character:seer_huoguang
    seer_huoguang: {
        sex: "male",
        hp: 4,
        group: "qun",
        skills: ["seer_kuangren", "seer_jitao"],
        trashBin: [],
        hasHiddenSkill: true,
    },
//#noname-kit-end character:seer_huoguang
//#noname-kit-begin character:seer_xisi
    seer_xisi: {
        sex: "female",
        hp: 3,
        group: "qun",
        skills: ["seer_yifu", "seer_zhuzhan", "seer_zhuanyi"],
        trashBin: [],
    },
//#noname-kit-end character:seer_xisi
//#noname-kit-begin character:seer_keleifude
    seer_keleifude: {
        sex: "male",
        hp: 4,
        group: "qun",
        skills: ["seer_huangjinluoxuan"],
        trashBin: [],
    },
//#noname-kit-end character:seer_keleifude
    // 【已隐藏】幸福之魔法少女（seer_xingfuzhimofashaonv）：暂不放出，以后重做，代码保留。
    // 恢复：① 去掉下面块注释 ② 回 sort.js 的 SEER_qt 加回 'seer_xingfuzhimofashaonv'
    //       ③ 去掉 translate.js「幸福之魔法少女」段的注释（称号在 characterTitle.js 里没动，无需处理）
    /*
    seer_xingfuzhimofashaonv: {
        sex: "female",
        hp: 4,
        group: "qun",
        skills: ["seer_weilexingfu", "seer_shanjinzhilu"],
        trashBin: [],
    },
    */
};
for (let i in characters) {
    characters[i].img = `extension/赛尔计划/image/character/${i}.jpg`;
}
export default characters;
