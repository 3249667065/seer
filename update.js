import { lib, game, ui, get, ai, _status } from "../../noname.js";
import { checkVersion, createProgress } from "../../noname/library/update.js";
import { EXTENSION_VERSION } from "./version.js";

// ============ 线上更新配置 ============
const EXTNAME = "赛尔计划";
// 内置仓库根目录（GitHub raw；也支持 Gitee raw 等任意静态托管根目录）
export const DEFAULT_REPO = "https://raw.githubusercontent.com/3249667065/seer/refs/heads/main";
// 镜像源前缀，顺序与 main/config.js 的 update_source 选项一致
const MIRRORS = ["", "https://gh-proxy.com/", "https://hk.gh-proxy.com/", "https://tvv.tw/"];
// 只属于本地开发的文件：不参与更新、也不会被清理逻辑误删
const LOCAL_ONLY = [
	/(^|\/)backup(\/|$)/i,
	/\.bak$/i,
	/^genManifest\.js$/,
	/^noname-kit\.history\.json$/i,
	/^manifest\.json$/i,
	/\.zip$/i,
	/^新建文件夹(\/|$)/,
	/(^|\/)_bak/i,
];
const isLocalOnly = (rel) => LOCAL_ONLY.some((re) => re.test(rel));

function getRepo() {
	const custom = String(lib.config[`extension_${EXTNAME}_update_repo`] || "")
		.trim()
		.replace(/\/+$/, "");
	return custom || DEFAULT_REPO;
}

// 从 raw 地址里解析出 owner / repo / branch（用于 API 兜底）
function parseGithub(repo) {
	const m = repo.match(/^https?:\/\/(?:raw\.githubusercontent\.com|github\.com)\/([^/]+)\/([^/?#]+)/);
	if (!m) return null;
	let branch = "main";
	const bm = repo.match(/\/refs\/heads\/([^/?#]+)/);
	if (bm) {
		branch = bm[1];
	} else {
		const rest = repo.replace(/^https?:\/\/[^/]+\//, "").split("/").filter(Boolean);
		if (rest.length > 2) branch = rest[rest.length - 1];
	}
	return { owner: m[1], name: m[2].replace(/\.git$/, ""), branch };
}

function b64ToBytes(s) {
	const clean = String(s || "").replace(/\s/g, "");
	const bin = atob(clean);
	const buf = new Uint8Array(bin.length);
	for (let i = 0; i < bin.length; i++) buf[i] = bin.charCodeAt(i);
	return buf;
}

async function fetchJson(url, timeout = 8000) {
	const opt = { cache: "no-store" };
	if (typeof AbortSignal !== "undefined" && AbortSignal.timeout) opt.signal = AbortSignal.timeout(timeout);
	const r = await fetch(url, opt);
	if (!r.ok) throw new Error("HTTP " + r.status);
	return r.json();
}

// 用 GitHub API 取文件（contents 接口 ≤1MB，大文件走 git/blobs）
async function apiFile(gh, path) {
	const data = await fetchJson(`https://api.github.com/repos/${gh.owner}/${gh.name}/contents/${encodeURI(path)}?ref=${gh.branch}`, 15000);
	if (data && data.content) return b64ToBytes(data.content);
	const tree = await fetchJson(`https://api.github.com/repos/${gh.owner}/${gh.name}/git/trees/${gh.branch}?recursive=1`, 15000);
	const node = (tree.tree || []).find((x) => x.path === path);
	if (!node) throw new Error("仓库中不存在该文件");
	const blob = await fetchJson(`https://api.github.com/repos/${gh.owner}/${gh.name}/git/blobs/${node.sha}`, 20000);
	return b64ToBytes(blob.content);
}

async function apiManifest(gh) {
	const url = `https://api.github.com/repos/${gh.owner}/${gh.name}/contents/manifest.json?ref=${gh.branch}`;
	const data = await fetchJson(url, 12000);
	const text = new TextDecoder().decode(b64ToBytes(data.content));
	return { manifest: JSON.parse(text), source: "api", url };
}

// 获取清单：所有镜像 + GitHub API 并行竞速，谁先成功用谁；全失败再串行重试一轮
async function fetchManifest(gh, errors) {
	const REPO = getRepo();
	const mirrorList = REPO.includes("github.com") ? MIRRORS : [""];
	const primary = mirrorList[Number(lib.config[`extension_${EXTNAME}_update_source`]) || 0] ?? "";
	const ordered = [primary, ...mirrorList.filter((x) => x !== primary)];

	const attempts = ordered.map(async (p) => {
		const url = `${p}${REPO}/manifest.json`;
		try {
			return { manifest: await fetchJson(url, 7000), source: p, url };
		} catch (e) {
			errors.push(`[镜像] ${url} -> ${e && e.message ? e.message : e}`);
			throw e;
		}
	});
	if (gh) {
		attempts.push(
			apiManifest(gh).catch((e) => {
				errors.push(`[API] manifest -> ${e && e.message ? e.message : e}`);
				throw e;
			})
		);
	}
	try {
		return await Promise.any(attempts);
	} catch (e) {
		/* 全部失败，走串行重试 */
	}
	for (const p of ordered) {
		const url = `${p}${REPO}/manifest.json`;
		try {
			return { manifest: await fetchJson(url, 15000), source: p, url };
		} catch (e) {
			errors.push(`[重试] ${url} -> ${e && e.message ? e.message : e}`);
		}
	}
	if (gh) {
		try {
			return await apiManifest(gh);
		} catch (e) {
			errors.push(`[重试API] manifest -> ${e && e.message ? e.message : e}`);
		}
	}
	return null;
}

// 询问是否更新：用系统 confirm，不碰游戏内 UI
function askUpdate(text) {
	return confirm(text);
}

// ============ 核心更新流程 ============
async function performUpdate(isManual, localVersion) {
	if (_status.connectMode && isManual) {
		alert("联机状态下无法更新");
		throw new Error("联机状态下无法更新");
	}
	if (!window.navigator.onLine && isManual) {
		alert("断网状态下无法检查更新，请检查网络连接");
		throw new Error("网络连接失败");
	}
	if (!isManual && sessionStorage.seer_check) return;

	const REPO = getRepo();
	if (!REPO) {
		if (isManual) alert("没有配置更新源地址");
		sessionStorage.seer_check = true;
		return;
	}
	const gh = parseGithub(REPO);
	const errors = [];

	const picked = await fetchManifest(gh, errors);
	sessionStorage.seer_check = true;
	if (!picked) {
		console.warn("赛尔计划：获取清单失败", errors);
		if (isManual) alert("清单文件获取失败。\n\n尝试过的地址：\n" + errors.slice(0, 5).join("\n"));
		throw new Error("清单文件获取失败");
	}
	const m = picked.manifest;
	console.log(`赛尔计划：使用 ${picked.source || "直连"} 源获取清单成功`, picked.url);

	if (checkVersion(localVersion, m.version) > 0) {
		if (isManual) alert(`本地《${EXTNAME}》版本 ${localVersion} 高于仓库版本 ${m.version}，已跳过更新`);
		return;
	}

	// 逐个比对 SHA-1
	const hex = Array.from({ length: 256 }, (_, i) => i.toString(16).padStart(2, "0"));
	const entries = Object.entries(m.files);
	const onlyCode = lib.config[`extension_${EXTNAME}_update_method`];
	const updateFiles = [];
	const debugSamples = {};
	for (let i = 0; i < entries.length; i += 5) {
		const batch = entries.slice(i, i + 5);
		await Promise.all(
			batch.map(async ([f, h]) => {
				if (onlyCode && !f.endsWith(".js") && !f.endsWith(".css")) return;
				const path = `extension/${EXTNAME}/${f}`;
				if ((await game.promises.checkFile(path)) !== 1) {
					updateFiles.push(f);
					return;
				}
				try {
					const buf = await game.promises.readFile(path);
					const hashBuf = await crypto.subtle.digest("SHA-1", buf);
					const localHash = Array.from(new Uint8Array(hashBuf), (x) => hex[x]).join("");
					if (["character/skill.js", "character/translate.js", "version.js"].includes(f)) {
						debugSamples[f] = `${localHash.slice(0, 8)} vs ${h.slice(0, 8)}`;
					}
					if (localHash !== h) updateFiles.push(f);
				} catch (e) {
					updateFiles.push(f);
				}
			})
		);
	}

	if (updateFiles.length === 0) {
		if (isManual) {
			const samples = Object.entries(debugSamples)
				.map(([k, v]) => `${k}: ${v}`)
				.join("\n");
			alert(`已经是最新版本\n仓库版本：${m.version}\n本地版本：${localVersion}\n比对文件：${entries.length} 个（哈希全部一致）\n极速更新：${onlyCode ? "开" : "关"}\n${samples}`);
		}
		return;
	}
	const okToUpdate = askUpdate(`《${EXTNAME}》发现新版本 ${m.version}\n${updateFiles.length} 个文件需更新\n更新说明：\n${m.update || "无"}`);
	if (!okToUpdate) return;

	let prog = createProgress(`更新 ${EXTNAME} 扩展`, updateFiles.length);
	try {
		async function fetchFileBytes(f, source) {
			const tryUrls = [];
			if (source !== "api") {
				const mirrorList = REPO.includes("github.com") ? MIRRORS : [""];
				const order = [source, ...mirrorList.filter((x) => x !== source)];
				for (const p of order) tryUrls.push({ url: `${p}${REPO}/${encodeURI(f)}` });
			}
			if (gh) tryUrls.push({ api: true });
			let lastErr = null;
			for (const item of tryUrls) {
				for (let attempt = 0; attempt <= 2; attempt++) {
					try {
						if (item.api) return await apiFile(gh, f);
						const opt = {};
						if (typeof AbortSignal !== "undefined" && AbortSignal.timeout) opt.signal = AbortSignal.timeout(20000);
						const r = await fetch(item.url, opt);
						if (!r.ok) throw new Error("HTTP " + r.status);
						return new Uint8Array(await r.arrayBuffer());
					} catch (e) {
						lastErr = e;
						await new Promise((res) => setTimeout(res, 400 * (attempt + 1)));
					}
				}
			}
			throw lastErr || new Error("下载失败");
		}

		async function ensureDir(dirPath) {
			let current = "";
			for (const part of dirPath.split("/")) {
				current += (current ? "/" : "") + part;
				try {
					await game.promises.createDir(current);
				} catch (e) {
					/* 已存在 */
				}
			}
		}

		for (let i = 0; i < updateFiles.length; i++) {
			const f = updateFiles[i];
			prog.setProgressValue(i + 1);
			prog.setFileName(`正在下载：${f}`);
			const data = await fetchFileBytes(f, picked.source);
			const fullPath = `extension/${EXTNAME}/${f}`;
			const dir = fullPath.split("/").slice(0, -1).join("/");
			await ensureDir(dir);
			await game.promises.writeFile(data, dir, fullPath.split("/").pop());
			await new Promise((resolve) => setTimeout(resolve, 100));
		}

		await game.promises.writeFile(JSON.stringify(m, null, 2), `extension/${EXTNAME}`, "manifest.json");

		const clean = async (path, pre = "") => {
			const [dirs, files] = await game.promises.getFileList(path);
			let list = files.map((file) => (pre ? `${pre}/${file}` : file));
			for (const d of dirs) list = list.concat(await clean(`${path}/${d}`, pre ? `${pre}/${d}` : d));
			return list;
		};
		const fList = (await clean(`extension/${EXTNAME}`)).filter((file) => {
			if (file === "manifest.json") return false;
			if (m.files[file]) return false;
			if (isLocalOnly(file)) return false;
			if (onlyCode && !file.endsWith(".js") && !file.endsWith(".css")) return false;
			return true;
		});
		if (fList.length) {
			const cleanProg = createProgress("清理文件", fList.length);
			for (let i = 0; i < fList.length; i++) {
				cleanProg.setProgressValue(i + 1);
				try {
					await game.promises.removeFile(`extension/${EXTNAME}/${fList[i]}`);
				} catch (e) {
					console.warn(`清理文件失败: ${fList[i]}`, e);
				}
			}
			cleanProg.remove();
		}

		prog.remove();
		alert("更新完成！（将自动重启）");
		game.reload();
	} catch (e) {
		if (prog) prog.remove();
		console.warn("赛尔计划：更新失败", e);
		if (isManual) alert("更新失败：" + (e && e.message ? e.message : e));
		throw e;
	}
}

// ============ 导出主函数 ============
export default async (b, localVersion = EXTENSION_VERSION) => {
	let autoUpdateQueue = Promise.resolve();

	if (b) {
		game.importedPack = true;
		try {
			await performUpdate(true, localVersion);
		} catch (e) {
			console.warn(e);
		} finally {
			game.importedPack = false;
		}
	} else {
		async function doAutoUpdate() {
			if (sessionStorage.seer_check) return;
			if (game.importedPack) {
				await new Promise((resolve) => {
					const check = () => {
						if (!game.importedPack) resolve();
						else setTimeout(check, 300);
					};
					check();
				});
			}
			game.importedPack = true;
			try {
				await performUpdate(false, localVersion);
			} catch (e) {
				console.warn("赛尔计划：自动更新失败", e);
			} finally {
				game.importedPack = false;
			}
		}
		autoUpdateQueue = autoUpdateQueue.then(() => doAutoUpdate()).catch(() => {});
		await autoUpdateQueue;
	}
};
