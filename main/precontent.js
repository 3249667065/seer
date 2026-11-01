import { lib, game, ui, get, ai, _status } from "noname";
lib.init.css(lib.assetURL + 'extension/赛尔计划/main', 'extension.css')
export async function precontent() {
    Promise.all([
        import("../card/index.js"),
        import("../character/index.js"),
    ])
        .then(() => {
            lib.translate.seer_card_config = "赛尔计划";
            lib.translate.seer_character_config = "赛尔计划";
        })
        .catch(err => {
            alert("『赛尔计划』扩展导入失败", err);
            console.error("Error:『赛尔计划』扩展导入失败" + err.message);
        });

    // Reflect.defineProperty(HTMLDivElement.prototype, 'setBackground', {
    //     configurable: true,
    //     enumerable: false,
    //     writable: true,
    //     value: function (name, type, ext, subfolder) {
    //         if (!name) return;
    //         let src;
    //         if (ext == 'noskin') ext = '.jpg';
    //         ext = ext || '.jpg';
    //         subfolder = subfolder || 'default';
    //         if (type) {
    //             let dbimage = null, extimage = null, modeimage = null, nameinfo, gzbool = false;
    //             const mode = get.mode();
    //             if (type == 'character') {
    //                 if (lib.characterPack[`mode_${mode}`] && lib.characterPack[`mode_${mode}`][name]) {
    //                     if (mode == 'guozhan') {
    //                         nameinfo = lib.character[name];
    //                         if (name.startsWith('gz_shibing')) name = name.slice(3, 11);
    //                         else {
    //                             if (lib.config.mode_config.guozhan.guozhanSkin && lib.character[name] && lib.character[name][4].includes('gzskin')) gzbool = true;
    //                             name = name.slice(3);
    //                         }
    //                     }
    //                     else modeimage = mode;
    //                 }
    //                 else if (name.includes('::')) {
    //                     name = name.split('::');
    //                     modeimage = name[0];
    //                     name = name[1];
    //                 }
    //                 else {
    //                     nameinfo = get.character(name);
    //                 }
    //             }
    //             if (!modeimage && nameinfo && nameinfo[4]) for (const value of nameinfo[4]) {
    //                 if (value.startsWith('ext:')) {
    //                     extimage = value;
    //                     break;
    //                 }
    //                 else if (value.startsWith('db:')) {
    //                     dbimage = value;
    //                     break;
    //                 }
    //                 else if (value.startsWith('mode:')) {
    //                     modeimage = value.slice(5);
    //                     break;
    //                 }
    //                 else if (value.startsWith('character:')) {
    //                     name = value.slice(10);
    //                     break;
    //                 }
    //             }
    //             if (extimage) src = extimage.replace(/^ext:/, 'extension/');
    //             else if (dbimage) {
    //                 this.setBackgroundDB(dbimage.slice(3));
    //                 return this;
    //             }
    //             else if (modeimage) src = `image/mode/${modeimage}/character/${name}${ext}`;
    //             else if (type == 'character' && lib.config.skin[name] && arguments[2] != 'noskin') src = `image/skin/${name}/${lib.config.skin[name]}${ext}`;
    //             else if (type == 'character') {
    //                 src = `image/character/${gzbool ? 'gz_' : ''}${name}${ext}`;
    //             }
    //             else src = `image/${type}/${subfolder}/${name}${ext}`;
    //         }
    //         else src = `image/${name}${ext}`;
    //         this.setBackgroundImage(src);
    //         this.style.backgroundPositionX = 'center';
    //         this.style.backgroundSize = 'cover';
    //         return this;
    //     }
    // });




}
