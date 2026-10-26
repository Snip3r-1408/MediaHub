(() => {
  "use strict";

  const ID = "mediahub";
  const STYLE_ID = "mediahub-styles";
  const STORE_KEY = "mediahub-playlists-v1";
  const MODE_KEY = "mediahub-play-mode-v1";
  const AUTO_MIX_KEY = "mediahub-auto-mix-v1";
  const MIX_STYLE_KEY = "mediahub-mix-style-v1";
  const GENRE_CACHE_KEY = "mediahub-genre-cache-v1";
  const MIX_BUFFER_TARGET = 12;
  const MIX_BUFFER_LOW_WATER = 5;
  const MIX_SEARCH_TIMEOUT = 10000;
  const YTMUSIC_REQUEST_TIMEOUT = 15000;
  const YTMUSIC_RETRY_AFTER = 10000;
  const MIX_MAX_QUERIES_PER_REFILL = 4;
  const MIX_HISTORY_KEEP = 6;
  let disposeView = null;
  let ytMusicClientPromise = null;
  let ytMusicClientFrame = null;
  let ytMusicClientOrigin = "";
  let ytMusicRequestId = 0;
  const ytMusicPending = new Map();
  let ytMusicBridgeFailedAt = 0;

  const css = `
    .mediahub{height:100%;min-height:560px;overflow:hidden;color:var(--text-main,#f5f5f5);font-family:inherit;box-sizing:border-box;background:linear-gradient(145deg,#0c0d12 0%,#090a0e 55%,#11101a 100%);container-type:inline-size}.mediahub *{box-sizing:border-box}.mediahub button,.mediahub input,.mediahub select{font-family:inherit}
    .mh-hidden{display:none!important}.mh-app{height:100%;min-height:560px;overflow:hidden}.mh-btn{border:0;border-radius:999px;padding:10px 16px;background:linear-gradient(135deg,var(--accent-color,#7166ff),#9b5cff);color:#fff;font:inherit;font-weight:750;cursor:pointer;transition:background .16s ease,color .16s ease,transform .16s ease,box-shadow .16s ease}.mh-btn:hover{transform:translateY(-1px);box-shadow:0 8px 24px #6d5fff2e}.mh-btn:disabled{opacity:.5;cursor:wait;transform:none;box-shadow:none}.mh-btn.ghost{background:#ffffff0a;color:var(--text-muted,#b6b6c2)}.mh-btn.ghost:hover{background:#ffffff15;color:#fff}.mh-icon-btn{width:38px;height:38px;display:grid;place-items:center;padding:0;border-radius:50%}.mh-icon-btn svg,.mh-mini svg,.mh-plus svg,.mh-nav-item svg{width:18px;height:18px;fill:none;stroke:currentColor;stroke-width:1.9;stroke-linecap:round;stroke-linejoin:round}
    .mh-welcome{min-height:560px;display:grid;place-items:center;padding:30px;text-align:center;background:radial-gradient(circle at 50% 36%,#7765ff20,transparent 28%)}.mh-welcome-inner{max-width:480px;padding:34px}.mh-mark{width:62px;height:62px;margin:0 auto 22px;display:grid;place-items:center;border-radius:50%;background:linear-gradient(145deg,var(--accent-color,#7166ff),#b45cff);font-size:24px;box-shadow:0 18px 55px #6c5cff42}.mh-eyebrow{margin:0 0 9px;color:#9188ff;font-size:10px;font-weight:850;letter-spacing:.2em}.mh-welcome h1{margin:0 0 12px;font-size:34px;letter-spacing:-.04em}.mh-welcome p{margin:0 auto 25px;color:var(--text-muted,#aaaab8);font-size:15px;line-height:1.65}
    .mh-top{height:64px;display:grid;grid-template-columns:190px minmax(240px,560px) 1fr 42px;align-items:center;gap:16px;padding:10px 18px;border-bottom:1px solid #ffffff0b;background:#090a0ee8;backdrop-filter:blur(18px)}.mh-brand{display:flex;align-items:center;gap:10px}.mh-brand-mark{width:35px;height:35px;display:grid;place-items:center;border-radius:50%;background:linear-gradient(145deg,var(--accent-color,#7166ff),#b252ff);font-size:13px;font-weight:900;box-shadow:0 8px 28px #6d5fff3b}.mh-brand h1{margin:0;font-size:19px;letter-spacing:-.045em}.mh-search{display:flex;gap:4px;padding:4px 4px 4px 12px;border:1px solid #ffffff10;border-radius:999px;background:#ffffff0b;transition:border-color .16s ease,background .16s ease}.mh-search:focus-within{border-color:#8a7cff80;background:#ffffff10}.mh-input,.mh-select{min-width:0;border:0;background:transparent;color:inherit;font:inherit;outline:0}.mh-search .mh-input{flex:1;padding:6px 2px}.mh-search .mh-input::placeholder{color:#777785}.mh-select{padding:8px 9px;border-radius:9px;background:#ffffff0a}.mh-select option{background:#18181f;color:#fff}.mh-top-spacer{min-width:0}.mh-error{margin:0 0 12px;padding:9px 12px;border:1px solid #ff727225;border-radius:11px;background:#ff5f5f10;color:#ffaaaa;font-size:12px}
    .mh-content{height:calc(100% - 64px);display:grid;grid-template-columns:190px minmax(330px,1fr) minmax(250px,330px);min-height:0}.mh-sidebar{min-width:0;overflow:hidden;padding:18px 12px;border-right:1px solid #ffffff0b;background:#090a0dac}.mh-nav{display:grid;gap:4px}.mh-nav-item{width:100%;display:flex;align-items:center;gap:12px;border:0;border-radius:11px;padding:10px 12px;background:transparent;color:#aaaab7;font:inherit;font-size:13px;font-weight:650;text-align:left;cursor:pointer;transition:.16s ease}.mh-nav-item:hover{background:#ffffff09;color:#fff}.mh-nav-item.active{background:linear-gradient(90deg,#7668ff28,#9a5dff0b);color:#fff}.mh-nav-item.active svg{color:#9185ff}.mh-side-rule{height:1px;margin:17px 8px;background:#ffffff0b}.mh-side-label{margin:0 10px 8px;color:#666777;font-size:9px;font-weight:850;letter-spacing:.16em}.mh-sidebar-playlists{display:grid;gap:2px;max-height:calc(100% - 180px);overflow:auto}.mh-sidebar-list{width:100%;overflow:hidden;border:0;border-radius:9px;padding:8px 10px;background:transparent;color:#8f909d;font:inherit;font-size:11px;text-align:left;text-overflow:ellipsis;white-space:nowrap;cursor:pointer}.mh-sidebar-list:hover{background:#ffffff08;color:#fff}.mh-sidebar-list.active{color:#fff}.mh-workspace{min-width:0;min-height:0;overflow:auto;padding:18px 20px 22px}.mh-queue-panel{min-width:0;min-height:0;overflow:hidden;padding:18px 12px 16px;border-left:1px solid #ffffff0b;background:#090a0da8}.mh-queue-heading{display:flex;justify-content:space-between;align-items:end;margin:0 4px 13px}.mh-queue-heading h2{margin:0;font-size:15px;letter-spacing:-.02em}.mh-queue-heading span{color:#6f7080;font-size:10px}
    .mh-player,.mh-library{min-width:0}.mh-player{margin-bottom:18px}.mh-player-label{display:flex;justify-content:space-between;align-items:center;margin:0 2px 10px}.mh-player-label h2{margin:0;font-size:15px;letter-spacing:-.02em}.mh-player-label span{max-width:60%;overflow:hidden;color:var(--text-muted,#858694);font-size:10px;text-overflow:ellipsis;white-space:nowrap}.mh-player-placeholder{min-height:245px;display:grid;place-items:center;overflow:hidden;border:1px solid #ffffff08;border-radius:16px;background:radial-gradient(circle at 50% 35%,#7568ff24,transparent 42%),linear-gradient(145deg,#11121a,#08090c);color:var(--text-muted,#858694);font-size:12px;text-align:center;padding:25px;box-shadow:0 18px 44px #0004}.mh-player-idle .mh-player-placeholder{min-height:132px}.mh-player-idle .mh-player-empty{grid-template-columns:auto 1fr;align-items:center;justify-items:start;text-align:left}.mh-player-idle .mh-player-empty-mark{width:48px;height:48px}.mh-player-empty{display:grid;justify-items:center;gap:12px}.mh-player-empty-mark{width:58px;height:58px;display:grid;place-items:center;border-radius:50%;background:linear-gradient(145deg,#ffffff12,#ffffff05);color:#ffffff64;font-size:23px}.mh-frame{height:290px;min-height:220px;overflow:hidden;border-radius:16px;background:#000;box-shadow:0 18px 44px #0006}.mh-frame iframe{width:100%;height:100%;border:0;display:block}
    .mh-library{padding-top:2px}.mh-tabs{display:flex;align-items:center;gap:20px;margin-bottom:10px;border-bottom:1px solid #ffffff0b}.mh-tab{position:relative;border:0;background:transparent;color:var(--text-muted,#777886);font:inherit;font-size:13px;font-weight:750;padding:7px 0 11px;cursor:pointer}.mh-tab.active{color:#fff}.mh-tab.active:after{content:"";position:absolute;left:0;right:0;bottom:-1px;height:2px;border-radius:2px;background:linear-gradient(90deg,var(--accent-color,#7166ff),#ac5cff)}.mh-count{margin-left:auto;padding-bottom:7px;color:#6f7080;font-size:10px}.mh-list,.mh-queue,.mh-catalog{margin:0;padding:0;list-style:none;overflow:auto}.mh-list{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:5px;max-height:245px;padding-right:4px}.mh-queue{height:calc(100% - 82px);padding-right:3px}.mh-empty{margin:0;padding:28px 8px;color:var(--text-muted,#858694);font-size:12px;line-height:1.55}.mh-library-overview{min-height:180px;display:grid;place-items:center;padding:20px;border-radius:15px;background:linear-gradient(135deg,#7568ff15,#ffffff03)}.mh-library-card{text-align:center}.mh-library-card .mh-mark{width:48px;height:48px;margin-bottom:14px;font-size:18px}.mh-library-card h3{margin:0 0 5px;font-size:19px}.mh-library-card p{margin:0;color:#898a98;font-size:12px}.mh-catalog{display:grid;gap:22px;max-height:360px;padding:2px 4px 12px 0}.mh-catalog-intro{display:flex;justify-content:space-between;align-items:end;gap:16px}.mh-catalog-intro h2{margin:0;font-size:24px;letter-spacing:-.045em}.mh-catalog-intro p{margin:5px 0 0;color:#868795;font-size:11px}.mh-catalog-section{display:grid;gap:10px}.mh-catalog-heading{display:flex;align-items:center;justify-content:space-between}.mh-catalog-heading h3{margin:0;font-size:14px;letter-spacing:-.02em}.mh-card-grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(112px,1fr));gap:10px}.mh-catalog-card{position:relative;min-width:0;border:0;border-radius:13px;padding:8px;background:#ffffff06;color:inherit;text-align:left;transition:.16s ease}.mh-catalog-card:hover,.mh-catalog-card:focus-within{background:#ffffff0d;transform:translateY(-2px)}.mh-catalog-open{width:100%;display:block;border:0;padding:0;background:transparent;color:inherit;text-align:left;cursor:pointer}.mh-catalog-cover{aspect-ratio:1;width:100%;display:grid;place-items:center;overflow:hidden;border-radius:9px;background:linear-gradient(145deg,#7568ff38,#242433);color:#ffffff8a;font-size:24px}.mh-catalog-cover img{width:100%;height:100%;object-fit:cover}.mh-catalog-copy{display:grid;gap:3px;padding:8px 2px 2px}.mh-catalog-copy strong,.mh-catalog-copy span{overflow:hidden;text-overflow:ellipsis;white-space:nowrap}.mh-catalog-copy strong{font-size:11px}.mh-catalog-copy span{color:#7e7f8d;font-size:9px}.mh-catalog-add{position:absolute;right:13px;top:13px;width:28px;height:28px;display:grid;place-items:center;border:0;border-radius:50%;background:#0b0c10d9;color:#fff;cursor:pointer;opacity:0;transition:.16s ease}.mh-catalog-card:hover .mh-catalog-add,.mh-catalog-card:focus-within .mh-catalog-add,.mh-catalog-add:focus-visible{opacity:1}.mh-catalog-add svg{width:15px;height:15px;fill:none;stroke:currentColor;stroke-width:2}.mh-catalog-loading{min-height:160px;display:grid;place-items:center;color:#858694;font-size:12px}.mh-catalog-hero{display:grid;grid-template-columns:92px minmax(0,1fr);gap:16px;align-items:end;padding:13px;border-radius:16px;background:linear-gradient(135deg,#7568ff24,#ffffff05)}.mh-catalog-hero img{width:92px;height:92px;border-radius:11px;object-fit:cover;background:#ffffff09}.mh-catalog-hero h2{margin:0 0 4px;font-size:23px;letter-spacing:-.04em}.mh-catalog-hero p{margin:0;color:#9293a1;font-size:11px;line-height:1.5}
    .mh-result{display:grid;grid-template-columns:54px minmax(0,1fr) 28px;gap:9px;align-items:center;min-width:0;padding:6px;border-radius:10px;cursor:pointer;transition:.14s ease}.mh-result:hover{background:#ffffff09}.mh-result.active{background:linear-gradient(90deg,#7769ff20,#ffffff04)}.mh-result img{width:54px;height:42px;border-radius:7px;object-fit:cover;background:#ffffff08}.mh-copy{display:grid;min-width:0;gap:2px}.mh-copy>*{overflow:hidden;text-overflow:ellipsis;white-space:nowrap}.mh-copy strong{font-size:12px}.mh-copy span{color:var(--text-muted,#858694);font-size:10px}.mh-plus,.mh-remove{border:0;background:transparent;color:var(--text-muted,#80818e);cursor:pointer}.mh-plus{width:27px;height:27px;display:grid;place-items:center;border-radius:50%}.mh-plus:hover{background:#ffffff14;color:#fff}
    .mh-playlist-bar{display:grid;grid-template-columns:minmax(0,1fr) auto auto auto;gap:5px;margin-bottom:10px}.mh-mini{padding:7px 9px;border-radius:9px}.mh-mini.active{background:linear-gradient(135deg,var(--accent-color,#7166ff),#985eff);color:#fff}.mh-mix-style{width:100%;font-size:10px}.mh-menu{position:relative}.mh-menu>summary{list-style:none}.mh-menu>summary::-webkit-details-marker{display:none}.mh-menu-panel{position:absolute;z-index:20;right:0;top:43px;width:205px;padding:8px;display:grid;gap:6px;border:1px solid #ffffff12;border-radius:12px;background:#17171e;box-shadow:0 18px 42px #000b}.mh-menu-panel .mh-select{width:100%}.mh-menu-panel .mh-btn{width:100%;display:flex;align-items:center;gap:9px;justify-content:flex-start;font-size:11px}.mh-menu-panel .mh-btn svg{width:16px;height:16px}.mh-queue-row{display:grid;grid-template-columns:42px minmax(0,1fr) 25px;gap:8px;align-items:center;padding:5px;border-radius:9px;cursor:pointer;transition:.14s ease}.mh-queue-row:hover{background:#ffffff08}.mh-queue-row.active{background:linear-gradient(90deg,#7568ff2a,transparent)}.mh-queue-cover{width:42px;height:42px;border-radius:7px;object-fit:cover;background:#ffffff08}.mh-queue-copy{display:grid;min-width:0;gap:2px}.mh-queue-copy strong,.mh-queue-copy span{overflow:hidden;text-overflow:ellipsis;white-space:nowrap}.mh-queue-copy strong{font-size:11px}.mh-queue-copy span{color:var(--text-muted,#81828f);font-size:9px}.mh-remove{width:25px;height:25px;border-radius:50%;font-size:15px}.mh-remove:hover{background:#ffffff10;color:#fff}
    @container(max-width:1050px){.mh-top{grid-template-columns:58px minmax(220px,1fr) 42px}.mh-top-spacer{display:none}.mh-brand h1,.mh-nav-item span,.mh-side-label,.mh-sidebar-playlists{display:none}.mh-brand{justify-content:center}.mh-content{grid-template-columns:58px minmax(330px,1fr) 250px}.mh-sidebar{padding-inline:7px}.mh-nav-item{justify-content:center;padding:10px}.mh-list{grid-template-columns:1fr}}
    @container(max-width:700px){.mediahub,.mh-app{min-height:680px;height:auto;overflow:visible}.mh-top{grid-template-columns:1fr 42px;height:auto}.mh-brand{display:none}.mh-search{grid-column:1}.mh-content{height:auto;grid-template-columns:1fr}.mh-sidebar{display:none}.mh-workspace{overflow:visible;padding:16px}.mh-queue-panel{min-height:300px;border-top:1px solid #ffffff0b;border-left:0}.mh-frame{height:250px}.mh-list{grid-template-columns:repeat(2,minmax(0,1fr));max-height:280px}.mh-queue{height:auto;max-height:280px}.mh-catalog{max-height:none}}
    @container(max-width:570px){.mh-list{grid-template-columns:1fr}.mh-workspace{padding:13px}.mh-frame{height:225px}.mh-search .mh-input{font-size:12px}}
    @media(hover:none){.mh-catalog-add{opacity:1}}
  `;

  const el = (tag, cls, text) => {
    const node = document.createElement(tag);
    if (cls) node.className = cls;
    if (text !== undefined) node.textContent = text;
    return node;
  };

  function icon(name) {
    const paths = {
      search: ["M11 4a7 7 0 1 0 0 14 7 7 0 0 0 0-14", "m16.2 16.2 4.3 4.3"],
      logout: ["M10 5H6a2 2 0 0 0-2 2v10a2 2 0 0 0 2 2h4", "m15 8 4 4-4 4", "M19 12H9"],
      plus: ["M12 5v14", "M5 12h14"],
      trash: ["M4 7h16", "M9 7V4h6v3", "m6 4-.5 8", "m-5 0-.5-8", "M6 7l1 14h10l1-14"],
      order: ["M5 7h14", "M5 12h14", "M5 17h10", "m17 15 2 2-2 2"],
      repeat: ["m17 2 4 4-4 4", "M3 11V9a3 3 0 0 1 3-3h15", "m7 22-4-4 4-4", "M21 13v2a3 3 0 0 1-3 3H3"],
      shuffle: ["M16 3h5v5", "M4 20 21 3", "M21 16v5h-5", "m15 15 6 6", "M4 4l5 5"],
      home: ["m3 11 9-8 9 8", "M5 10v10h14V10", "M9 20v-6h6v6"],
      compass: ["M12 22a10 10 0 1 0 0-20 10 10 0 0 0 0 20", "m16 8-2.3 5.7L8 16l2.3-5.7L16 8Z"],
      library: ["M5 4v16", "M9 4v16", "M13 6v14", "m17 5 3 14"],
      sparkles: ["m12 3 1.2 3.3L16.5 7.5l-3.3 1.2L12 12l-1.2-3.3-3.3-1.2 3.3-1.2L12 3", "m19 13 .8 2.2L22 16l-2.2.8L19 19l-.8-2.2L16 16l2.2-.8L19 13", "m6 14 1 2.8 2.8 1L7 18.8 6 22l-1-3.2-3-1 3-1L6 14"]
    };
    const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
    svg.setAttribute("viewBox", "0 0 24 24");
    svg.setAttribute("aria-hidden", "true");
    for (const data of paths[name] || []) {
      const path = document.createElementNS("http://www.w3.org/2000/svg", "path");
      path.setAttribute("d", data);
      svg.append(path);
    }
    return svg;
  }

  function decode(value) {
    const node = document.createElement("textarea");
    node.innerHTML = String(value || "");
    return node.value;
  }

  async function loadYtMusicClient() {
    if (!window.pluginHttpAPI?.getAssetUrl) return null;
    if (ytMusicClientFrame?.contentWindow) return ytMusicClientFrame;
    if (ytMusicBridgeFailedAt && Date.now() - ytMusicBridgeFailedAt < YTMUSIC_RETRY_AFTER) return null;
    if (ytMusicClientPromise) return ytMusicClientPromise;
    ytMusicClientPromise = (async () => {
      try {
        const assetUrl = await window.pluginHttpAPI.getAssetUrl(ID, "ytmusic-client.html");
        const origin = new URL(assetUrl).origin;
        const iframe = document.createElement("iframe");
        iframe.hidden = true;
        iframe.title = "MediaHub YouTube Music Engine";
        iframe.setAttribute("aria-hidden", "true");
        iframe.src = `${assetUrl}?t=${Date.now()}`;
        await new Promise((resolve, reject) => {
          const timer = window.setTimeout(() => reject(new Error("YouTube-Music-Client konnte nicht geladen werden")), 5000);
          iframe.addEventListener("load", () => {
            window.clearTimeout(timer);
            resolve();
          }, { once: true });
          iframe.addEventListener("error", () => {
            window.clearTimeout(timer);
            reject(new Error("YouTube-Music-Client konnte nicht geladen werden"));
          }, { once: true });
          document.body.appendChild(iframe);
        });
        ytMusicClientFrame = iframe;
        ytMusicClientOrigin = origin;
        ytMusicBridgeFailedAt = 0;
        return iframe;
      } catch {
        ytMusicBridgeFailedAt = Date.now();
        return null;
      }
    })().finally(() => { ytMusicClientPromise = null; });
    return ytMusicClientPromise;
  }

  async function ytMusicRequest(route, payload) {
    const iframe = await loadYtMusicClient();
    if (!iframe?.contentWindow) return null;
    const requestId = `${Date.now()}-${++ytMusicRequestId}`;
    return new Promise(resolve => {
      const timer = window.setTimeout(() => {
        ytMusicPending.delete(requestId);
        ytMusicBridgeFailedAt = Date.now();
        resolve(null);
      }, YTMUSIC_REQUEST_TIMEOUT);
      ytMusicPending.set(requestId, { resolve, timer });
      iframe.contentWindow.postMessage({
        source: "mediahub-ytmusic-parent",
        requestId,
        route,
        payload
      }, ytMusicClientOrigin);
    });
  }

  window.addEventListener("message", event => {
    if (event.source !== ytMusicClientFrame?.contentWindow
      || event.origin !== ytMusicClientOrigin
      || event.data?.source !== "mediahub-ytmusic-client") return;
    const pending = ytMusicPending.get(String(event.data.requestId || ""));
    if (!pending) return;
    ytMusicPending.delete(String(event.data.requestId));
    window.clearTimeout(pending.timer);
    if (event.data.ok) ytMusicBridgeFailedAt = 0;
    pending.resolve(event.data.ok ? (event.data.result ?? null) : null);
  });

  function ytMusicSearch(query, limit = 20) {
    return ytMusicRequest("/v1/search", { query, limit });
  }

  function ytMusicRadio(videoId, limit = 30) {
    return videoId ? ytMusicRequest("/v1/radio", { videoId, limit }) : Promise.resolve(null);
  }

  function ytMusicHome(limit = 6) {
    return ytMusicRequest("/v1/home", { limit });
  }

  function ytMusicExplore() {
    return ytMusicRequest("/v1/explore", {});
  }

  function ytMusicAlbum(browseId) {
    return ytMusicRequest("/v1/album", { browseId });
  }

  function ytMusicArtist(browseId) {
    return ytMusicRequest("/v1/artist", { browseId });
  }

  function ytMusicPlaylist(playlistId, limit = 100) {
    return ytMusicRequest("/v1/playlist", { playlistId, limit });
  }

  function ytMusicMoodPlaylists(params) {
    return ytMusicRequest("/v1/mood-playlists", { params });
  }

  function disposeYtMusicClient() {
    ytMusicClientFrame?.remove();
    ytMusicClientFrame = null;
    ytMusicClientOrigin = "";
    ytMusicClientPromise = null;
    for (const pending of ytMusicPending.values()) {
      window.clearTimeout(pending.timer);
      pending.resolve(null);
    }
    ytMusicPending.clear();
  }

  function loadPlaylists() {
    try {
      const stored = JSON.parse(localStorage.getItem(STORE_KEY) || "[]");
      if (Array.isArray(stored) && stored.length) return stored;
    } catch { /* use default */ }
    return [{ id: "queue", name: "Meine Playlist", items: [] }];
  }

  function injectStyle() {
    if (document.getElementById(STYLE_ID)) return;
    const style = el("style");
    style.id = STYLE_ID;
    style.textContent = css;
    document.head.appendChild(style);
  }

  function render() {
    disposeView?.();
    const auth = window.mediaHubAuth;
    const api = window.playerAPI;
    const root = el("section", "mediahub");
    let playlists = loadPlaylists();
    let playlistId = playlists[0].id;
    let selected = null;
    let currentResults = [];
    let frame = null;
    let frameOrigin = null;
    let frameLoadPromise = null;
    let playerReady = false;
    let currentTab = "results";
    let currentSection = "home";
    let catalogueRequestToken = 0;
    const catalogueCache = new Map();
    let playMode = localStorage.getItem(MODE_KEY) || "once";
    let autoMix = localStorage.getItem(AUTO_MIX_KEY) === "true";
    let mixStyle = localStorage.getItem(MIX_STYLE_KEY) || "genre";
    let lastSearchQuery = "";
    const failedVideoIds = new Set();
    const playedVideoIds = new Set();
    let mixRound = 0;
    let advancing = false;
    let activeAdvanceToken = 0;
    let advanceQueuedToken = 0;
    let blockedRecoveries = 0;
    let lastGenreRequest = 0;
    let mixRefillPromise = null;
    let mixRefillGeneration = 0;
    let mixRetryTimer = null;
    let mixRetryAttempt = 0;
    let mixResumePending = null;
    let mixGeneration = 0;
    let disposed = false;
    let playbackToken = 0;
    let transitionedToken = 0;
    let playbackWatchdogTimer = null;
    let stoppedByUser = false;
    let transitionGeneration = 0;
    const playHistory = [];
    let mixSource = "Magischer Mix";
    let mixAnchor = null;
    let genreCache = {};
    try { genreCache = JSON.parse(localStorage.getItem(GENRE_CACHE_KEY) || "{}"); } catch { genreCache = {}; }

    const welcome = el("div", "mh-welcome");
    const welcomeInner = el("div", "mh-welcome-inner");
    welcomeInner.append(el("div", "mh-mark", "▶"), el("p", "mh-eyebrow", "MEDIAHUB STREAMING"), el("h1", "", "Willkommen bei MediaHub"), el("p", "", "Bitte melden Sie sich mit Google an, um diesen Service zu nutzen."));
    const login = el("button", "mh-btn", "Mit Google anmelden");
    login.type = "button";
    welcomeInner.append(login);
    welcome.append(welcomeInner);

    const app = el("div", "mh-app mh-hidden");
    const brand = el("div", "mh-brand");
    brand.append(el("div", "mh-brand-mark", "M"), el("h1", "", "MediaHub"));
    const form = el("form", "mh-search");
    const input = el("input", "mh-input");
    input.type = "search";
    input.placeholder = "Titel, Künstler oder Album suchen";
    const search = el("button", "mh-btn mh-icon-btn");
    search.type = "submit";
    search.title = "Suchen";
    search.setAttribute("aria-label", "Suchen");
    search.append(icon("search"));
    form.append(input, search);
    const logout = el("button", "mh-btn ghost mh-icon-btn");
    logout.type = "button";
    logout.title = "Abmelden";
    logout.setAttribute("aria-label", "Abmelden");
    logout.append(icon("logout"));
    const top = el("header", "mh-top");
    top.append(brand, form, el("div", "mh-top-spacer"), logout);
    const error = el("p", "mh-error");
    error.hidden = true;

    const resultTab = el("button", "mh-tab active", "Entdecken");
    const playlistTab = el("button", "mh-tab", "Mediathek");
    resultTab.type = playlistTab.type = "button";
    const count = el("span", "mh-count");
    const tabs = el("div", "mh-tabs");
    tabs.append(resultTab, playlistTab, count);
    const resultsView = el("div");
    const results = el("ol", "mh-list");
    const resultsEmpty = el("p", "mh-empty", "Suche nach einem Titel, Künstler oder Album.");
    resultsView.append(resultsEmpty, results);
    const catalogueView = el("div", "mh-catalog");
    const catalogueLoading = el("div", "mh-catalog-loading", "YouTube Music wird geladen …");
    catalogueView.append(catalogueLoading);

    const playlistView = el("aside", "mh-queue-panel");
    const queueHeading = el("div", "mh-queue-heading");
    const queueTitle = el("h2", "", "Als Nächstes");
    const queueMeta = el("span", "", "Deine Playlist");
    queueHeading.append(queueTitle, queueMeta);
    const picker = el("select", "mh-select");
    const mixStylePicker = el("select", "mh-select mh-mix-style");
    [
      ["related", "Ähnliche Künstler"],
      ["genre", "Gleiches Genre"],
      ["wide", "Breiter Mix"],
      ["surprise", "Überraschung"]
    ].forEach(([value, label]) => {
      const option = el("option", "", label);
      option.value = value;
      option.selected = value === mixStyle;
      mixStylePicker.append(option);
    });
    mixStylePicker.title = "Art des Auto-Mix";
    const mixButton = el("button", "mh-btn ghost mh-mini");
    const modeButton = el("button", "mh-btn ghost mh-mini");
    const newList = el("button", "mh-btn ghost mh-mini");
    const deleteList = el("button", "mh-btn ghost mh-mini");
    mixButton.type = modeButton.type = newList.type = deleteList.type = "button";
    mixButton.setAttribute("aria-label", "Auto-Mix umschalten");
    modeButton.setAttribute("aria-label", "Wiedergabemodus ändern");
    newList.title = "Neue Playlist";
    deleteList.title = "Playlist löschen";
    newList.setAttribute("aria-label", "Neue Playlist");
    deleteList.setAttribute("aria-label", "Playlist löschen");
    newList.append(icon("plus"), el("span", "", "Neue Playlist"));
    deleteList.append(icon("trash"), el("span", "", "Playlist löschen"));
    const menu = el("details", "mh-menu");
    const menuToggle = el("summary", "mh-btn ghost mh-icon-btn", "•••");
    menuToggle.title = "Playlist verwalten";
    menuToggle.setAttribute("aria-label", "Playlist verwalten");
    const menuPanel = el("div", "mh-menu-panel");
    menuPanel.append(picker, newList, deleteList);
    menu.append(menuToggle, menuPanel);
    const playlistBar = el("div", "mh-playlist-bar");
    playlistBar.append(mixStylePicker, mixButton, modeButton, menu);
    const queue = el("ol", "mh-queue");
    const queueEmpty = el("p", "mh-empty", "Füge Treffer über das Plus zu deiner Warteschlange hinzu.");
    playlistView.append(queueHeading, playlistBar, queueEmpty, queue);
    const playlistOverview = el("div", "mh-library-overview mh-hidden");
    const playlistCard = el("div", "mh-library-card");
    const playlistOverviewName = el("h3", "", "Meine Playlist");
    const playlistOverviewMeta = el("p", "", "Noch keine Titel gespeichert");
    playlistCard.append(el("div", "mh-mark", "♪"), playlistOverviewName, playlistOverviewMeta);
    playlistOverview.append(playlistCard);
    const library = el("section", "mh-library");
    library.append(tabs, catalogueView, resultsView, playlistOverview);

    const playerLabel = el("div", "mh-player-label");
    const playerStatus = el("span", "", "MediaHub Player");
    const playerTitle = el("h2", "", "Jetzt läuft");
    playerLabel.append(playerTitle, playerStatus);
    const playerHost = el("div", "mh-player-placeholder");
    const playerEmpty = el("div", "mh-player-empty");
    playerEmpty.append(el("div", "mh-player-empty-mark", "♪"), el("span", "", "Wähle einen Titel aus"));
    playerHost.append(playerEmpty);
    const player = el("section", "mh-player mh-player-idle");
    player.append(playerLabel, playerHost);
    const homeNav = el("button", "mh-nav-item active");
    const discoverNav = el("button", "mh-nav-item");
    const libraryNav = el("button", "mh-nav-item");
    homeNav.type = discoverNav.type = libraryNav.type = "button";
    homeNav.append(icon("home"), el("span", "", "Startseite"));
    discoverNav.append(icon("compass"), el("span", "", "Entdecken"));
    libraryNav.append(icon("library"), el("span", "", "Mediathek"));
    const nav = el("nav", "mh-nav");
    nav.append(homeNav, discoverNav, libraryNav);
    const sidebarPlaylists = el("div", "mh-sidebar-playlists");
    const sidebar = el("aside", "mh-sidebar");
    sidebar.append(nav, el("div", "mh-side-rule"), el("p", "mh-side-label", "DEINE PLAYLISTS"), sidebarPlaylists);
    const workspace = el("main", "mh-workspace");
    workspace.append(error, player, library);
    const content = el("div", "mh-content");
    content.append(sidebar, workspace, playlistView);
    app.append(top, content);
    root.append(welcome, app);

    const showError = message => {
      error.textContent = message || "";
      error.hidden = !message;
    };
    const activePlaylist = () => playlists.find(list => list.id === playlistId) || playlists[0];
    const save = () => localStorage.setItem(STORE_KEY, JSON.stringify(playlists));
    const post = message => frame?.contentWindow?.postMessage(message, frameOrigin || "*");

    function showLoggedIn(loggedIn) {
      welcome.classList.toggle("mh-hidden", loggedIn);
      app.classList.toggle("mh-hidden", !loggedIn);
      if (loggedIn) {
        setTab("results", "home");
        loadCatalogue("home").catch(() => renderCatalogue([], "Für dich", "Der Katalog ist gerade nicht erreichbar – nutze einfach die Suche."));
      } else {
        catalogueRequestToken += 1;
      }
    }

    function catalogueSong(item) {
      const videoId = item?.videoId || ((item?.kind === "song" || item?.kind === "video") ? item?.id : "");
      if (!videoId) return null;
      return {
        ...item,
        id: videoId,
        channel: item.channel || item.subtitle || item.artists?.join(", ") || "YouTube Music"
      };
    }

    function catalogueSubtitle(item) {
      const parts = [item?.subtitle || item?.channel, item?.album, item?.year].filter(Boolean);
      return parts.join(" · ") || ({ artist: "Künstler", album: "Album", playlist: "Playlist", mood: "Stimmung & Genre" }[item?.kind] || "YouTube Music");
    }

    function renderCatalogue(sections, heading, subtitle, hero = null) {
      catalogueView.replaceChildren();
      if (hero) {
        const heroNode = el("div", "mh-catalog-hero");
        const heroImage = document.createElement("img");
        heroImage.src = hero.thumbnail || "";
        heroImage.alt = "";
        const heroCopy = el("div");
        heroCopy.append(
          el("h2", "", decode(hero.title) || heading),
          el("p", "", decode(hero.subtitle || hero.description || subtitle || "YouTube Music"))
        );
        heroNode.append(heroImage, heroCopy);
        catalogueView.append(heroNode);
      } else {
        const intro = el("div", "mh-catalog-intro");
        const copy = el("div");
        copy.append(el("h2", "", heading), el("p", "", subtitle));
        intro.append(copy);
        catalogueView.append(intro);
      }

      const usableSections = (Array.isArray(sections) ? sections : []).filter(section => Array.isArray(section?.items) && section.items.length);
      if (!usableSections.length) {
        catalogueView.append(el("p", "mh-empty", "Für diese Ansicht sind gerade keine YouTube-Music-Inhalte verfügbar. Die Suche funktioniert weiterhin."));
        return;
      }
      usableSections.forEach(section => {
        const block = el("section", "mh-catalog-section");
        const sectionHeading = el("div", "mh-catalog-heading");
        sectionHeading.append(el("h3", "", decode(section.title || "Empfehlungen")));
        const grid = el("div", "mh-card-grid");
        section.items.slice(0, 12).forEach(item => {
          const card = el("article", "mh-catalog-card");
          const openButton = el("button", "mh-catalog-open");
          openButton.type = "button";
          openButton.setAttribute("aria-label", decode(item.title || "YouTube-Music-Inhalt öffnen"));
          const cover = el("div", "mh-catalog-cover", item.kind === "mood" ? "✦" : "♪");
          if (item.thumbnail) {
            const image = document.createElement("img");
            image.src = item.thumbnail;
            image.alt = "";
            cover.replaceChildren(image);
          }
          const cardCopy = el("div", "mh-catalog-copy");
          cardCopy.append(el("strong", "", decode(item.title)), el("span", "", decode(catalogueSubtitle(item))));
          openButton.append(cover, cardCopy);
          card.append(openButton);
          const song = catalogueSong(item);
          if (song) {
            const add = el("button", "mh-catalog-add");
            add.type = "button";
            add.title = "Zur Playlist hinzufügen";
            add.setAttribute("aria-label", "Zur Playlist hinzufügen");
            add.append(icon("plus"));
            add.addEventListener("click", event => {
              event.stopPropagation();
              addToPlaylist(song);
            });
            card.append(add);
          }
          const open = () => openCatalogueItem(item).catch(error => {
            showError(error.message || "Der Inhalt konnte nicht geöffnet werden.");
            loadCatalogue(currentSection).catch(() => renderCatalogue([], "Entdecken", "Der Inhalt ist gerade nicht erreichbar."));
          });
          openButton.addEventListener("click", open);
          grid.append(card);
        });
        block.append(sectionHeading, grid);
        catalogueView.append(block);
      });
    }

    async function openCatalogueItem(item) {
      const song = catalogueSong(item);
      if (song) {
        mixAnchor = song;
        await play(song);
        return;
      }
      const token = ++catalogueRequestToken;
      catalogueLoading.textContent = `${decode(item?.title) || "Inhalt"} wird geladen …`;
      catalogueView.replaceChildren(catalogueLoading);
      showError("");
      let detail = null;
      if (item?.kind === "album" && item.browseId) detail = await ytMusicAlbum(item.browseId);
      else if (item?.kind === "artist" && item.browseId) detail = await ytMusicArtist(item.browseId);
      else if (item?.kind === "playlist" && (item.playlistId || item.browseId)) {
        detail = await ytMusicPlaylist(item.playlistId || item.browseId);
      } else if (item?.kind === "mood" && (item.params || item.id)) {
        const moodItems = await ytMusicMoodPlaylists(item.params || item.id);
        detail = { ...item, sections: [{ title: "Playlists", items: Array.isArray(moodItems) ? moodItems : [] }] };
      }
      if (token !== catalogueRequestToken || disposed) return;
      if (!detail) throw new Error("Dieser YouTube-Music-Inhalt ist momentan nicht verfügbar.");
      const sections = Array.isArray(detail.sections) ? [...detail.sections] : [];
      if (Array.isArray(detail.tracks) && detail.tracks.length) sections.unshift({ title: "Titel", items: detail.tracks });
      if (Array.isArray(detail.otherVersions) && detail.otherVersions.length) sections.push({ title: "Weitere Versionen", items: detail.otherVersions });
      if (Array.isArray(detail.related) && detail.related.length) sections.push({ title: "Das könnte dir auch gefallen", items: detail.related });
      renderCatalogue(sections, decode(detail.title || item.title), "YouTube Music", {
        ...detail,
        title: detail.title || item.title,
        subtitle: detail.subtitle || catalogueSubtitle(item),
        thumbnail: detail.thumbnail || item.thumbnail
      });
    }

    async function loadCatalogue(section, force = false) {
      const token = ++catalogueRequestToken;
      const cached = !force && catalogueCache.get(section);
      const heading = section === "home" ? "Für dich" : "Entdecken";
      const subtitle = section === "home"
        ? "Schnelle Auswahl aus dem öffentlichen YouTube-Music-Katalog"
        : "Neue Veröffentlichungen, Trends und Musik für jede Stimmung";
      if (cached) {
        renderCatalogue(cached, heading, subtitle);
        return;
      }
      catalogueLoading.textContent = `${heading} wird geladen …`;
      catalogueView.replaceChildren(catalogueLoading);
      const sections = section === "home" ? await ytMusicHome(6) : await ytMusicExplore();
      if (token !== catalogueRequestToken || disposed || currentSection !== section) return;
      if (Array.isArray(sections) && sections.length) catalogueCache.set(section, sections);
      renderCatalogue(sections, heading, subtitle);
    }

    function setTab(tab, section = tab === "playlist" ? "library" : "discover") {
      currentTab = tab;
      currentSection = section;
      const isResults = tab === "results";
      const isCatalogue = isResults && (section === "home" || section === "explore");
      resultTab.classList.toggle("active", isResults);
      playlistTab.classList.toggle("active", !isResults);
      tabs.classList.toggle("mh-hidden", isCatalogue);
      catalogueView.classList.toggle("mh-hidden", !isCatalogue);
      resultsView.classList.toggle("mh-hidden", !isResults || isCatalogue);
      playlistOverview.classList.toggle("mh-hidden", isResults);
      homeNav.classList.toggle("active", currentSection === "home");
      discoverNav.classList.toggle("active", currentSection === "discover" || currentSection === "explore");
      libraryNav.classList.toggle("active", currentSection === "library");
      count.textContent = isResults && !isCatalogue && currentResults.length ? `${currentResults.length} Treffer` : "";
    }

    function renderPicker() {
      picker.replaceChildren();
      playlists.forEach(list => {
        const option = el("option", "", list.name);
        option.value = list.id;
        option.selected = list.id === playlistId;
        picker.append(option);
      });
      deleteList.disabled = playlists.length === 1;
      picker.hidden = playlists.length === 1;
      const active = activePlaylist();
      playlistTab.textContent = `Mediathek${active.items.length ? ` (${active.items.length})` : ""}`;
      queueMeta.textContent = active.name;
      playlistOverviewName.textContent = active.name;
      playlistOverviewMeta.textContent = active.items.length
        ? `${active.items.length} ${active.items.length === 1 ? "Titel" : "Titel"} · Warteschlange rechts`
        : "Noch keine Titel gespeichert";
      sidebarPlaylists.replaceChildren();
      playlists.forEach(list => {
        const button = el("button", `mh-sidebar-list${list.id === playlistId ? " active" : ""}`, list.name);
        button.type = "button";
        button.title = list.name;
        button.addEventListener("click", () => {
          if (playlistId !== list.id) {
            mixGeneration += 1;
            mixResumePending = null;
            clearMixRetry();
            playlistId = list.id;
            mixAnchor = activePlaylist().items.find(item => !item.mediaHubAutoAdded) || null;
            renderQueue();
            if (autoMix) ensureMixBuffer({ force: true }).catch(() => scheduleMixRetry());
          }
          setTab("playlist", "library");
        });
        sidebarPlaylists.append(button);
      });
    }

    function renderPlayMode() {
      const modes = {
        once: { icon: "order", title: "Einmal der Reihe nach" },
        repeat: { icon: "repeat", title: "Playlist im Kreis wiederholen" },
        shuffle: { icon: "shuffle", title: "Zufällige Wiedergabe" }
      };
      const mode = modes[playMode] || modes.once;
      modeButton.replaceChildren(icon(mode.icon));
      modeButton.title = mode.title;
      modeButton.classList.toggle("active", playMode !== "once");
    }

    function renderAutoMix() {
      mixButton.replaceChildren(icon("sparkles"));
      mixButton.title = autoMix
        ? "Auto-Mix ist an: passende Musik wird automatisch ergänzt"
        : "Auto-Mix einschalten";
      mixButton.classList.toggle("active", autoMix);
      refreshMixStatus();
    }

    function renderQueue() {
      const items = activePlaylist().items;
      queue.replaceChildren();
      queueEmpty.hidden = items.length > 0;
      items.forEach((item, index) => {
        const row = el("li", `mh-queue-row${selected?.id === item.id ? " active" : ""}`);
        const image = document.createElement("img");
        image.className = "mh-queue-cover";
        image.src = item.thumbnail || "";
        image.alt = "";
        const copy = el("span", "mh-queue-copy");
        copy.append(el("strong", "", decode(item.title)), el("span", "", decode(item.channel)));
        row.append(image, copy);
        const remove = el("button", "mh-remove", "×");
        remove.type = "button";
        remove.addEventListener("click", event => {
          event.stopPropagation();
          items.splice(index, 1);
          save();
          renderPicker();
          renderQueue();
          if (autoMix) ensureMixBuffer().catch(() => scheduleMixRetry());
        });
        row.append(remove);
        row.addEventListener("click", () => {
          if (!item.mediaHubAutoAdded) mixAnchor = item;
          play(item);
        });
        queue.append(row);
      });
      renderPicker();
    }

    function addToPlaylist(item) {
      const list = activePlaylist();
      if (!list.items.some(entry => entry.id === item.id)) {
        list.items.push(item);
        save();
        renderQueue();
        if (autoMix) ensureMixBuffer().catch(() => scheduleMixRetry());
      }
    }

    function forgetBlockedItem(videoId) {
      if (!videoId) return;
      const list = activePlaylist();
      const blocked = list.items.find(item => item.id === videoId);
      if (blocked) blocked.mediaHubUnavailable = true;
      currentResults = currentResults.filter(item => item.id !== videoId);
      save();
      renderResults(currentResults);
      renderQueue();
    }

    function compactAutoMixQueue() {
      if (!autoMix || !selected?.id) return;
      const list = activePlaylist();
      const currentIndex = list.items.findIndex(item => item.id === selected.id);
      if (currentIndex <= MIX_HISTORY_KEEP) return;
      const expiredIds = new Set(
        list.items
          .slice(0, currentIndex - MIX_HISTORY_KEEP)
          .filter(item => item.mediaHubAutoAdded)
          .map(item => item.id)
      );
      if (!expiredIds.size) return;
      list.items = list.items.filter(item => !expiredIds.has(item.id));
      save();
    }

    function leastRecentlyPlayed(items) {
      const candidates = items.filter(item => item.id !== selected?.id);
      if (!candidates.length) return items[0] || null;
      return candidates.sort((left, right) => playHistory.lastIndexOf(left.id) - playHistory.lastIndexOf(right.id))[0];
    }

    function artistKey(item) {
      return seedArtist(item).toLocaleLowerCase();
    }

    function cleanArtist(value) {
      return decode(value || "")
        .replace(/\s*[-–—]\s*(topic|vevo|official)$/i, "")
        .replace(/\s+(official|vevo)$/i, "")
        .replace(/^[\s"'“”]+|[\s"'“”]+$/g, "")
        .trim();
    }

    function seedArtist(item, fallback = "") {
      const title = decode(item?.title || "").replace(/&quot;/gi, '"');
      const titleArtist = title.split(/\s+(?:-|–|—|\|)\s+/)[0];
      if (titleArtist && titleArtist.length <= 70 && titleArtist !== title) return cleanArtist(titleArtist);
      const channel = cleanArtist(item?.channel);
      if (channel && !/(records|music|entertainment|official channel)$/i.test(channel)) return channel;
      return cleanArtist(fallback.split(/\s+(?:-|–|—)\s+/)[0]);
    }

    function broadGenre(tags) {
      const joined = tags.join(" ").toLowerCase();
      if (/(metalcore|post-hardcore|screamo|hardcore|metal)/.test(joined)) return ["modern metal", "alternative metal", "post-hardcore"];
      if (/(punk|emo)/.test(joined)) return ["alternative rock", "pop punk", "emo rock"];
      if (/(hip hop|rap|trap)/.test(joined)) return ["hip hop", "alternative rap", "modern rap"];
      if (/(electronic|techno|house|edm)/.test(joined)) return ["electronic", "dance", "alternative electronic"];
      if (/(country|folk|americana)/.test(joined)) return ["country rock", "folk rock", "americana"];
      if (/(pop|r&b|soul)/.test(joined)) return ["alternative pop", "modern rock", "indie pop"];
      return tags.slice(0, 3);
    }

    function durationSeconds(item) {
      const raw = item?.durationSeconds ?? item?.lengthSeconds ?? item?.duration;
      if (Number.isFinite(Number(raw))) return Number(raw);
      const text = String(raw || "").trim();
      const iso = text.match(/^PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?$/i);
      if (iso) return Number(iso[1] || 0) * 3600 + Number(iso[2] || 0) * 60 + Number(iso[3] || 0);
      if (/^\d{1,2}:\d{2}(?::\d{2})?$/.test(text)) {
        return text.split(":").reduce((total, part) => total * 60 + Number(part), 0);
      }
      return 0;
    }

    function isLongForm(item) {
      if (durationSeconds(item) > 12 * 60) return true;
      const title = decode(item?.title || "").toLowerCase();
      return /(full\s+album|complete\s+album|album\s+completo|entire\s+album|\d+\s*(?:hour|hours|stunden?)|one\s+hour|non[ -]?stop|continuous\s+mix|full\s+concert|live\s+concert|greatest\s+hits|best\s+of\s+\d{4}|music\s+compilation|full\s+set)/i.test(title);
    }

    async function findGenres(artist) {
      const key = artist.toLocaleLowerCase();
      const cached = genreCache[key];
      const cacheAge = Date.now() - Number(cached?.savedAt || 0);
      if (cached && cacheAge < (cached.tags?.length ? 30 * 24 * 60 * 60 * 1000 : 60 * 60 * 1000)) {
        return cached.tags || [];
      }
      const wait = Math.max(0, 1100 - (Date.now() - lastGenreRequest));
      if (wait) await new Promise(resolve => window.setTimeout(resolve, wait));
      lastGenreRequest = Date.now();
      const controller = new AbortController();
      const timer = window.setTimeout(() => controller.abort(), 6500);
      try {
        const query = new URLSearchParams({ query: `artist:"${artist}"`, fmt: "json", limit: "3" });
        const response = await fetch(`https://musicbrainz.org/ws/2/artist/?${query}`, {
          headers: { Accept: "application/json" },
          signal: controller.signal
        });
        if (!response.ok) throw new Error(`Musikdatenbank antwortet mit ${response.status}`);
        const data = await response.json();
        const match = data.artists?.find(entry => entry.name?.toLocaleLowerCase() === key) || data.artists?.[0];
        const tags = (match?.tags || [])
          .filter(tag => tag?.name && tag.count >= 1)
          .sort((a, b) => (b.count || 0) - (a.count || 0))
          .map(tag => cleanArtist(tag.name).toLowerCase())
          .filter((tag, index, all) => tag && !["seen live", "favorites", "american"].includes(tag) && all.indexOf(tag) === index)
          .slice(0, 5);
        genreCache[key] = { tags, savedAt: Date.now() };
        localStorage.setItem(GENRE_CACHE_KEY, JSON.stringify(genreCache));
        return tags;
      } catch (error) {
        genreCache[key] = { tags: [], savedAt: Date.now() };
        localStorage.setItem(GENRE_CACHE_KEY, JSON.stringify(genreCache));
        throw error;
      } finally {
        window.clearTimeout(timer);
      }
    }

    async function mixQueries(item, fallback = "", offset = mixRound) {
      const artist = seedArtist(item, fallback);
      let tags = [];
      if (artist) {
        try { tags = await findGenres(artist); } catch { /* local fallback below */ }
      }
      if (!tags.length) {
        const hint = `${fallback} ${decode(item?.title || "")}`.toLowerCase();
        if (/(metal|metalcore|falling in reverse)/.test(hint)) tags = ["metalcore", "post-hardcore", "alternative metal"];
        else if (/(rock|punk|emo)/.test(hint)) tags = ["alternative rock", "pop punk"];
      }
      const chosen = (mixStyle === "wide" ? broadGenre(tags) : tags).filter(Boolean);
      const primary = chosen[0] || "alternative music";
      const secondary = chosen[1] || primary;
      let queries;
      if (mixStyle === "related") {
        queries = [
          `${artist || fallback} ähnliche Künstler official music video`,
          `${primary} Bands wie ${artist || fallback} official audio`,
          `${primary} neue Bands official music video`,
          `${secondary} underrated bands official audio`,
          `${primary} rising artists song`,
          `${primary} essential songs official video`,
          `${secondary} new release official audio`,
          `${primary} alternative bands song`
        ];
      } else if (mixStyle === "surprise") {
        queries = [
          `${primary} Geheimtipp official audio`,
          `${secondary} neue Band Song`,
          `${primary} underrated official music video`,
          `${secondary} rising artists official audio`,
          `${primary} hidden gems song`,
          `${secondary} new release official video`,
          `${primary} independent bands music video`,
          `${secondary} discovery song official audio`
        ];
      } else {
        queries = [
          `${primary} official music video`,
          `${secondary} Bands official audio`,
          `${primary} neue Bands official video`,
          `${secondary} underrated song`,
          `${primary} rising artists official audio`,
          `${primary} ${secondary} new release`,
          `${secondary} essential songs official video`,
          `${primary} alternative bands official audio`,
          `${secondary} hidden gems music video`,
          `${primary} modern bands song`
        ];
      }
      const generation = offset;
      const discoveries = ["new release", "hidden gems", "deep cuts", "underground", "rising artists", "fan favorite", "essential songs", "fresh bands"];
      const moods = ["energetic", "melodic", "heavy", "emotional", "anthemic", "dark", "powerful", "modern"];
      const year = new Date().getFullYear() - (generation % 6);
      const letter = "ABCDEFGHIJKLMNOPQRSTUVWXYZ"[generation % 26];
      const changing = [
        `${primary} ${discoveries[generation % discoveries.length]} ${year} official audio`,
        `${secondary} ${moods[generation % moods.length]} bands official music video`,
        `${primary} bands ${letter} official audio`,
        `${secondary} ${discoveries[(generation + 3) % discoveries.length]} song`
      ];
      const stable = [...new Set(queries.map(query => query.replace(/\s+/g, " ").trim()).filter(Boolean))];
      const start = stable.length ? offset % stable.length : 0;
      const rotated = stable.slice(start).concat(stable.slice(0, start));
      const interleaved = [];
      for (let index = 0; index < Math.max(changing.length, rotated.length); index += 1) {
        if (changing[index]) interleaved.push(changing[index]);
        if (rotated[index]) interleaved.push(rotated[index]);
      }
      return [...new Set(interleaved.map(query => query.replace(/\s+/g, " ").trim()).filter(Boolean))];
    }

    function songKey(item) {
      return decode(item?.title || "")
        .toLocaleLowerCase()
        .replace(/\([^)]*(?:official|video|audio|lyrics?|visuali[sz]er|live)[^)]*\)/gi, " ")
        .replace(/\[[^\]]*(?:official|video|audio|lyrics?|visuali[sz]er|live)[^\]]*\]/gi, " ")
        .replace(/\b(?:official|music|video|audio|lyrics?|hd|4k)\b/gi, " ")
        .replace(/[^\p{L}\p{N}]+/gu, " ")
        .trim();
    }

    function mergeIntoPlaylist(items, limit = 8, maxPerArtist = 2, list = activePlaylist()) {
      const known = new Set(list.items.map(item => item.id));
      const knownSongs = new Set(list.items.map(songKey).filter(Boolean));
      const artistCounts = new Map();
      list.items.slice(-10).forEach(item => {
        const key = artistKey(item);
        if (key) artistCounts.set(key, (artistCounts.get(key) || 0) + 1);
      });
      const additions = [];
      for (const item of items) {
        if (!item?.id || known.has(item.id) || failedVideoIds.has(item.id) || isLongForm(item)) continue;
        const titleKey = songKey(item);
        if (titleKey && knownSongs.has(titleKey)) continue;
        const key = artistKey(item);
        if (key && (artistCounts.get(key) || 0) >= maxPerArtist) continue;
        const addition = { ...item, mediaHubAutoAdded: true };
        additions.push(addition);
        known.add(item.id);
        if (titleKey) knownSongs.add(titleKey);
        if (key) artistCounts.set(key, (artistCounts.get(key) || 0) + 1);
        if (additions.length >= limit) break;
      }
      if (!additions.length) return [];
      list.items.push(...additions);
      save();
      if (list.id === playlistId) renderQueue();
      return additions;
    }

    async function fillGenreMix(seed, firstResults = []) {
      const additions = mergeIntoPlaylist(firstResults, 4, 2);
      if (!seed || additions.length >= MIX_BUFFER_TARGET) return additions;
      additions.push(...await ensureMixBuffer({ force: true, seedItem: firstResults[0] }));
      return additions;
    }

    function isPlayable(item) {
      return Boolean(item?.id) && !item.mediaHubUnavailable && !failedVideoIds.has(item.id) && !isLongForm(item);
    }

    function playableQueue() {
      return activePlaylist().items.filter(isPlayable);
    }

    function upcomingQueue() {
      const pool = playableQueue();
      const index = pool.findIndex(item => item.id === selected?.id);
      const upcoming = index >= 0 ? pool.slice(index + 1) : pool.filter(item => item.id !== selected?.id);
      return playMode === "shuffle"
        ? upcoming.filter(item => !playedVideoIds.has(item.id))
        : upcoming;
    }

    function refreshMixStatus(text = "") {
      if (text) {
        playerStatus.textContent = text;
      } else if (autoMix) {
        playerStatus.textContent = `${mixSource} · ${upcomingQueue().length} voraus`;
      } else {
        playerStatus.textContent = "MediaHub Player";
      }
    }

    async function searchSongs(query) {
      const enhanced = await ytMusicSearch(query, 20);
      if (enhanced?.length) return enhanced;
      return auth.search(query);
    }

    function searchWithTimeout(query) {
      return new Promise((resolve, reject) => {
        const timer = window.setTimeout(() => reject(new Error("YouTube-Suche hat zu lange gebraucht.")), MIX_SEARCH_TIMEOUT);
        Promise.resolve()
          .then(() => searchSongs(query))
          .then(resolve, reject)
          .finally(() => window.clearTimeout(timer));
      });
    }

    function clearMixRetry() {
      if (mixRetryTimer) window.clearTimeout(mixRetryTimer);
      mixRetryTimer = null;
    }

    function scheduleMixRetry() {
      if (!autoMix || disposed || mixRetryTimer) return;
      const delays = [5000, 15000, 30000, 60000, 180000, 300000];
      const delay = delays[Math.min(mixRetryAttempt, delays.length - 1)];
      const retryGeneration = mixGeneration;
      mixRetryAttempt += 1;
      refreshMixStatus(`Mix wartet · neuer Versuch in ${Math.ceil(delay / 1000)} s`);
      mixRetryTimer = window.setTimeout(() => {
        mixRetryTimer = null;
        if (retryGeneration !== mixGeneration || !autoMix || disposed) return;
        ensureMixBuffer({ force: true }).then(additions => {
          const resume = mixResumePending;
          if (resume
            && resume.token === playbackToken
            && resume.videoId === selected?.id
            && resume.playlistId === playlistId
            && (additions.length || upcomingQueue().length)) {
            advancePlayback(resume.token);
          }
        }).catch(() => scheduleMixRetry());
      }, delay);
    }

    async function ensureMixBuffer({ force = false, seedItem = null } = {}) {
      if (!autoMix || !auth?.search || disposed) return [];
      if (!force && mixRetryTimer) return [];
      const remaining = upcomingQueue().length;
      if (!force && remaining > MIX_BUFFER_LOW_WATER) {
        refreshMixStatus();
        return [];
      }
      if (mixRefillPromise) {
        if (mixRefillGeneration !== mixGeneration) {
          return mixRefillPromise.then(() => ensureMixBuffer({ force, seedItem }));
        }
        return mixRefillPromise;
      }
      const wanted = Math.max(1, MIX_BUFFER_TARGET - remaining);
      const refillGeneration = mixGeneration;
      const targetPlaylist = activePlaylist();
      const targetPlaylistId = playlistId;
      mixRefillGeneration = refillGeneration;
      refreshMixStatus("Magischer Mix lädt …");
      mixRefillPromise = (async () => {
        const additions = [];
        const refillStarted = Date.now();
        const manualSeed = targetPlaylist.items.find(item => !item.mediaHubAutoAdded);
        const seed = seedItem || mixAnchor || currentResults[0] || manualSeed || selected || targetPlaylist.items.at(-1);
        if (!mixAnchor && seed?.id) mixAnchor = seed;
        const recentIds = new Set(playHistory.slice(-MIX_HISTORY_KEEP));
        const radioSeeds = (mixStyle === "genre"
          ? [mixAnchor || seed]
          : [seed, ...targetPlaylist.items.filter(item => recentIds.has(item.id)).reverse()])
          .filter((item, index, all) => item?.id && all.findIndex(candidate => candidate?.id === item.id) === index);
        const radioSeed = radioSeeds.length ? radioSeeds[mixRound % radioSeeds.length] : null;
        const radioWanted = mixStyle === "genre" ? Math.min(wanted, 4) : wanted;
        mixRound = (mixRound + 1) % 100000;
        try {
          const radioTracks = await ytMusicRadio(radioSeed?.id, Math.max(25, wanted * 2));
          if (refillGeneration !== mixGeneration || targetPlaylistId !== playlistId) return [];
          if (radioTracks?.length) {
            additions.push(...mergeIntoPlaylist(radioTracks, radioWanted, 2, targetPlaylist));
            if (additions.length) mixSource = mixStyle === "genre" ? "Fester Genre-Mix" : "YouTube Music Radio";
          }
        } catch { /* use the classic genre search below */ }
        if (additions.length >= wanted) return additions;
        const queries = await mixQueries(mixStyle === "genre" ? (mixAnchor || seed) : seed, lastSearchQuery || input.value.trim(), mixRound);
        for (let attempt = 0; attempt < Math.min(queries.length, MIX_MAX_QUERIES_PER_REFILL) && additions.length < wanted; attempt += 1) {
          if (refillGeneration !== mixGeneration || targetPlaylistId !== playlistId) break;
          if (attempt >= 2 && Date.now() - refillStarted > 25000) break;
          const query = queries[attempt];
          mixRound = (mixRound + 1) % 100000;
          try {
            const suggestions = await searchWithTimeout(query);
            if (refillGeneration !== mixGeneration || targetPlaylistId !== playlistId) break;
            additions.push(...mergeIntoPlaylist(suggestions || [], wanted - additions.length, 2, targetPlaylist));
            if (additions.length && !["YouTube Music Radio", "Fester Genre-Mix"].includes(mixSource)) {
              mixSource = "Magischer Mix";
            }
          } catch { /* rotate to the next independent query */ }
        }
        if (refillGeneration !== mixGeneration || targetPlaylistId !== playlistId) return [];
        if (additions.length) {
          mixRetryAttempt = 0;
          clearMixRetry();
        } else if (upcomingQueue().length <= MIX_BUFFER_LOW_WATER) {
          scheduleMixRetry();
        }
        return additions;
      })().finally(() => {
        mixRefillPromise = null;
        if (!mixRetryTimer) refreshMixStatus();
      });
      return mixRefillPromise;
    }

    function renderResults(items) {
      currentResults = items;
      results.replaceChildren();
      resultsEmpty.hidden = items.length > 0;
      count.textContent = items.length ? `${items.length} Treffer` : "";
      items.forEach(item => {
        const row = el("li", `mh-result${selected?.id === item.id ? " active" : ""}`);
        const image = document.createElement("img");
        image.src = item.thumbnail || "";
        image.alt = "";
        const copy = el("span", "mh-copy");
        copy.append(el("strong", "", decode(item.title)), el("span", "", decode(item.channel)));
        const plus = el("button", "mh-plus");
        plus.type = "button";
        plus.title = "Zur Playlist hinzufügen";
        plus.setAttribute("aria-label", "Zur Playlist hinzufügen");
        plus.append(icon("plus"));
        plus.addEventListener("click", event => {
          event.stopPropagation();
          addToPlaylist(item);
        });
        row.append(image, copy, plus);
        row.addEventListener("click", () => {
          mixAnchor = item;
          play(item);
        });
        results.append(row);
      });
    }

    function clearPlaybackWatchdog() {
      if (playbackWatchdogTimer) window.clearTimeout(playbackWatchdogTimer);
      playbackWatchdogTimer = null;
    }

    function armPlaybackWatchdog(token, videoId) {
      clearPlaybackWatchdog();
      playbackWatchdogTimer = window.setTimeout(() => {
        playbackWatchdogTimer = null;
        if (disposed || token !== playbackToken || selected?.id !== videoId || transitionedToken === token) return;
        if (!playerReady) {
          showError("Der YouTube-Player konnte nicht gestartet werden. Bitte versuche den Titel erneut.");
          frame?.remove();
          frame = null;
          frameOrigin = null;
          playerHost.className = "mh-player-placeholder";
          playerHost.replaceChildren(playerEmpty);
          api?.reportProviderState?.(ID, { state: "stopped" });
          return;
        }
        failedVideoIds.add(videoId);
        showError("Dieser Titel startet nicht – MediaHub wechselt automatisch …");
        transitionedToken = token;
        advancePlayback(token);
      }, 25000);
    }

    async function ensurePlayer() {
      if (frameLoadPromise) return frameLoadPromise;
      if (frame) return;
      frameLoadPromise = (async () => {
        const url = await window.pluginHttpAPI?.getAssetUrl(ID, "player.html");
        if (!url) throw new Error("Der lokale MediaHub-Player konnte nicht geladen werden.");
        frameOrigin = new URL(url).origin;
        playerReady = false;
        const wrap = el("div", "mh-frame");
        frame = document.createElement("iframe");
        frame.title = "MediaHub YouTube-Player";
        frame.allow = "autoplay; encrypted-media; picture-in-picture";
        frame.src = url;
        wrap.append(frame);
        playerHost.className = "";
        playerHost.replaceChildren(wrap);
        await new Promise((resolve, reject) => {
          const timer = window.setTimeout(() => reject(new Error("Der Player antwortet nicht.")), 10000);
          frame.addEventListener("load", () => {
            window.clearTimeout(timer);
            resolve();
          }, { once: true });
          frame.addEventListener("error", () => {
            window.clearTimeout(timer);
            reject(new Error("Der Player konnte nicht geöffnet werden."));
          }, { once: true });
        });
      })();
      try {
        await frameLoadPromise;
      } catch (error) {
        frame?.remove();
        frame = null;
        frameOrigin = null;
        playerReady = false;
        playerHost.className = "mh-player-placeholder";
        playerHost.replaceChildren(playerEmpty);
        throw error;
      } finally {
        frameLoadPromise = null;
      }
    }

    async function play(item) {
      if (!item?.id) return false;
      const playGeneration = ++transitionGeneration;
      const token = ++playbackToken;
      selected = item;
      player.classList.remove("mh-player-idle");
      stoppedByUser = false;
      mixResumePending = null;
      clearPlaybackWatchdog();
      playedVideoIds.add(item.id);
      playHistory.push(item.id);
      while (playedVideoIds.size > 40) playedVideoIds.delete(playedVideoIds.values().next().value);
      if (playHistory.length > 80) playHistory.splice(0, playHistory.length - 80);
      compactAutoMixQueue();
      showError("");
      try {
        const activation = await api?.setActiveProvider?.(ID);
        if (token !== playbackToken || playGeneration !== transitionGeneration || disposed) return false;
        if (activation?.ok === false) throw new Error(activation.error?.message || "MediaHub konnte nicht aktiviert werden.");
        await ensurePlayer();
        if (token !== playbackToken || playGeneration !== transitionGeneration || disposed) return false;
        const title = decode(item.title);
        const artist = decode(item.channel);
        playerTitle.textContent = title || "Jetzt läuft";
        post({ command: "load", videoId: item.id, token });
        armPlaybackWatchdog(token, item.id);
        try {
          Promise.resolve(api?.reportProviderState?.(ID, { state: "loading", title, artist, artwork: item.thumbnail || null, videoId: item.id })).catch(() => {});
        } catch { /* playback remains usable when status reporting fails */ }
        renderResults(currentResults);
        renderQueue();
        ensureMixBuffer().catch(() => scheduleMixRetry());
        return true;
      } catch (err) {
        if (token === playbackToken && !disposed) showError(err.message || "Die Wiedergabe konnte nicht gestartet werden.");
        return false;
      }
    }

    function nextQueueItem(pool) {
      if (playMode === "shuffle") {
        const choices = pool.filter(item => item.id !== selected?.id && !playedVideoIds.has(item.id));
        return choices.length ? choices[Math.floor(Math.random() * choices.length)] : null;
      }
      const items = activePlaylist().items;
      const index = items.findIndex(item => item.id === selected?.id);
      if (index < 0) return pool.find(item => item.id !== selected?.id) || null;
      return items.slice(index + 1).find(isPlayable) || null;
    }

    async function advancePlayback(expectedToken = playbackToken) {
      if (disposed || expectedToken !== playbackToken) return;
      if (advancing) {
        if (expectedToken !== activeAdvanceToken) advanceQueuedToken = expectedToken;
        return;
      }
      advancing = true;
      activeAdvanceToken = expectedToken;
      const advanceGeneration = transitionGeneration;
      clearPlaybackWatchdog();
      try {
        let pool = playableQueue();
        let next = nextQueueItem(pool);

        if (!next && autoMix && auth?.search) {
          mixResumePending = { token: expectedToken, videoId: selected?.id, playlistId };
          if (!mixRetryTimer) await ensureMixBuffer({ force: true });
          if (expectedToken !== playbackToken || advanceGeneration !== transitionGeneration || disposed) return;
          pool = playableQueue();
          next = nextQueueItem(pool);
        }

        if (!next && autoMix && pool.length) next = leastRecentlyPlayed(pool);
        if (!next && autoMix) {
          const resultPool = currentResults.filter(isPlayable);
          if (resultPool.length) next = leastRecentlyPlayed(resultPool);
        }
        if (!next && playMode === "repeat" && pool.length) next = pool[0];
        if (!next && playMode === "shuffle" && pool.length) {
          playedVideoIds.clear();
          next = pool.find(item => item.id !== selected?.id) || pool[0];
        }
        if (next) {
          if (expectedToken !== playbackToken || advanceGeneration !== transitionGeneration || disposed) return;
          mixResumePending = null;
          const started = await play(next);
          if (!started && selected?.id === next.id && !disposed) {
            mixResumePending = null;
            api?.reportProviderState?.(ID, { state: "stopped" });
          }
        } else if (autoMix) {
          scheduleMixRetry();
          refreshMixStatus("Magischer Mix sucht weiter …");
        } else {
          mixResumePending = null;
          api?.reportProviderState?.(ID, { state: "stopped" });
        }
      } finally {
        advancing = false;
        activeAdvanceToken = 0;
        const queuedToken = advanceQueuedToken;
        advanceQueuedToken = 0;
        if (queuedToken && queuedToken === playbackToken) {
          window.setTimeout(() => advancePlayback(queuedToken), 0);
        }
      }
    }

    function receivePlayerMessage(event) {
      if (event.source !== frame?.contentWindow || event.data?.source !== "mediahub-player") return;
      const eventToken = Number(event.data.token || 0);
      if (event.data.type === "ready") {
        playerReady = true;
        return;
      }
      if (event.data.type !== "ready"
        && (eventToken !== playbackToken || event.data.videoId !== selected?.id)) return;
      if (event.data.type === "error") {
        clearPlaybackWatchdog();
        const code = Number(event.data.code);
        if ([2, 5, 100, 101, 150].includes(code)) {
          const blockedId = selected?.id;
          if (blockedId) {
            failedVideoIds.add(blockedId);
            forgetBlockedItem(blockedId);
          }
          blockedRecoveries += 1;
          const canContinue = autoMix || playableQueue().length || currentResults.length;
          showError(canContinue
            ? "Diese Version ist gesperrt – MediaHub sucht automatisch die nächste passende Version …"
            : "Mehrere YouTube-Versionen sind für externe Player gesperrt. Bitte starte eine neue Suche.");
          if (canContinue && blockedRecoveries >= 8 && autoMix) {
            mixRound += MIX_MAX_QUERIES_PER_REFILL;
            mixResumePending = { token: playbackToken, videoId: selected?.id, playlistId };
            transitionedToken = playbackToken;
            blockedRecoveries = 0;
            showError("Viele Versionen sind gesperrt – MediaHub wechselt die Suche und versucht es gleich erneut …");
            scheduleMixRetry();
          } else if (canContinue && transitionedToken !== playbackToken) {
            transitionedToken = playbackToken;
            advancePlayback(eventToken);
          }
        } else if (code === 153) {
          showError("YouTube-Player-Fehler 153: WebRadio übermittelt keine gültige Player-Identität.");
        } else {
          showError(`YouTube-Player-Fehler: ${code}`);
        }
      }
      if (event.data.type === "autoplay-blocked") {
        clearPlaybackWatchdog();
        showError("YouTube hat den automatischen Start blockiert. Bitte drücke unten auf Start.");
      }
      if (event.data.type === "stalled") {
        clearPlaybackWatchdog();
        if (selected?.id) {
          failedVideoIds.add(selected.id);
          forgetBlockedItem(selected.id);
        }
        showError("Dieser Titel lädt nicht weiter – MediaHub wechselt automatisch …");
        if (transitionedToken !== playbackToken) {
          transitionedToken = playbackToken;
          advancePlayback(eventToken);
        }
        return;
      }
      if (event.data.type === "ended") {
        clearPlaybackWatchdog();
        if (transitionedToken !== playbackToken) {
          transitionedToken = playbackToken;
          advancePlayback(eventToken);
        }
        return;
      }
      if (event.data.type === "state" && selected) {
        if (["playing", "paused", "stopped"].includes(event.data.state)) clearPlaybackWatchdog();
        if (event.data.state === "loading") armPlaybackWatchdog(playbackToken, selected.id);
        if (event.data.state === "playing") {
          playerReady = true;
          blockedRecoveries = 0;
          showError("");
          ensureMixBuffer().catch(() => scheduleMixRetry());
        }
        api?.reportProviderState?.(ID, {
          state: event.data.state,
          title: decode(selected.title),
          artist: decode(selected.channel),
          artwork: selected.thumbnail || null,
          videoId: selected.id
        });
      }
    }

    window.addEventListener("message", receivePlayerMessage);
    const unsubscribe = api?.onCommand?.(message => {
      if (message?.providerId !== ID) return;
      if (message.command === "stop") {
        stoppedByUser = true;
        transitionGeneration += 1;
        advanceQueuedToken = 0;
        mixResumePending = null;
        mixGeneration += 1;
        mixRetryAttempt = 0;
        clearMixRetry();
        clearPlaybackWatchdog();
        transitionedToken = playbackToken;
      } else if (message.command === "pause") {
        clearPlaybackWatchdog();
      } else if (message.command === "play" && selected?.id) {
        if (stoppedByUser) {
          transitionGeneration += 1;
          advanceQueuedToken = 0;
          transitionedToken = 0;
          stoppedByUser = false;
          post({ command: "load", videoId: selected.id, token: playbackToken });
          armPlaybackWatchdog(playbackToken, selected.id);
          return;
        }
        stoppedByUser = false;
        armPlaybackWatchdog(playbackToken, selected.id);
      }
      post(message);
    });

    login.addEventListener("click", async () => {
      login.disabled = true;
      try {
        await auth.signIn();
        showLoggedIn(true);
      } catch (err) {
        login.disabled = false;
        welcomeInner.querySelector("p:not(.mh-eyebrow)").textContent = err.message || "Die Anmeldung ist fehlgeschlagen.";
      }
    });
    logout.addEventListener("click", async () => {
      await auth.signOut();
      showLoggedIn(false);
    });
    form.addEventListener("submit", async event => {
      event.preventDefault();
      const query = input.value.trim();
      if (!query) return;
      lastSearchQuery = query;
      if (autoMix) {
        mixGeneration += 1;
        mixRound = 0;
        mixRetryAttempt = 0;
        clearMixRetry();
      }
      search.disabled = true;
      search.replaceChildren();
      search.append(icon("search"));
      showError("");
      try {
        const found = await searchSongs(query);
        mixAnchor = found[0] || null;
        renderResults(found);
        if (autoMix) {
          const additions = await fillGenreMix(query, found);
          if (!selected && (additions[0] || found[0])) play(additions[0] || found[0]);
        }
        setTab("results", "discover");
      } catch (err) {
        showError(err.message || "Die Suche ist fehlgeschlagen.");
      } finally {
        search.disabled = false;
        search.replaceChildren();
        search.append(icon("search"));
      }
    });
    homeNav.addEventListener("click", () => {
      showError("");
      setTab("results", "home");
      loadCatalogue("home").catch(() => renderCatalogue([], "Für dich", "Der Katalog ist gerade nicht erreichbar – nutze einfach die Suche."));
    });
    discoverNav.addEventListener("click", () => {
      showError("");
      setTab("results", "explore");
      loadCatalogue("explore").catch(() => renderCatalogue([], "Entdecken", "Der Katalog ist gerade nicht erreichbar – nutze einfach die Suche."));
    });
    libraryNav.addEventListener("click", () => setTab("playlist", "library"));
    resultTab.addEventListener("click", () => setTab("results", "discover"));
    playlistTab.addEventListener("click", () => setTab("playlist", "library"));
    picker.addEventListener("change", () => {
      mixGeneration += 1;
      mixResumePending = null;
      clearMixRetry();
      playlistId = picker.value;
      mixAnchor = activePlaylist().items.find(item => !item.mediaHubAutoAdded) || null;
      renderQueue();
      menu.open = false;
      setTab("playlist", "library");
    });
    mixStylePicker.addEventListener("change", () => {
      mixStyle = mixStylePicker.value;
      localStorage.setItem(MIX_STYLE_KEY, mixStyle);
      mixGeneration += 1;
      mixRound = 0;
      mixRetryAttempt = 0;
      clearMixRetry();
      if (!mixAnchor) mixAnchor = selected || currentResults[0] || activePlaylist().items.find(item => !item.mediaHubAutoAdded) || null;
      if (autoMix) ensureMixBuffer({ force: true }).catch(() => scheduleMixRetry());
    });
    modeButton.addEventListener("click", () => {
      playMode = playMode === "once" ? "repeat" : playMode === "repeat" ? "shuffle" : "once";
      localStorage.setItem(MODE_KEY, playMode);
      renderPlayMode();
    });
    mixButton.addEventListener("click", () => {
      autoMix = !autoMix;
      localStorage.setItem(AUTO_MIX_KEY, String(autoMix));
      renderAutoMix();
      if (!autoMix) {
        mixResumePending = null;
        mixGeneration += 1;
        mixRetryAttempt = 0;
        clearMixRetry();
        refreshMixStatus();
      } else {
        mixGeneration += 1;
        mixRetryAttempt = 0;
        mixAnchor = selected || currentResults[0] || activePlaylist().items.find(item => !item.mediaHubAutoAdded) || null;
        fillGenreMix(lastSearchQuery || input.value.trim(), currentResults).then(additions => {
          if (!selected && (additions[0] || currentResults[0])) play(additions[0] || currentResults[0]);
          ensureMixBuffer({ force: true }).catch(() => scheduleMixRetry());
        }).catch(err => {
          showError(err.message || "Auto-Mix konnte nicht ergänzt werden.");
          scheduleMixRetry();
        });
      }
    });
    newList.addEventListener("click", () => {
      const name = window.prompt("Name der neuen Playlist:", "Neue Playlist");
      if (!name?.trim()) return;
      const list = { id: `playlist-${Date.now()}`, name: name.trim(), items: [] };
      playlists.push(list);
      mixGeneration += 1;
      mixResumePending = null;
      clearMixRetry();
      playlistId = list.id;
      save();
      renderPicker();
      renderQueue();
      menu.open = false;
      setTab("playlist", "library");
      if (autoMix) ensureMixBuffer({ force: true }).catch(() => scheduleMixRetry());
    });
    deleteList.addEventListener("click", () => {
      if (playlists.length === 1 || !window.confirm(`Playlist „${activePlaylist().name}“ löschen?`)) return;
      playlists = playlists.filter(list => list.id !== playlistId);
      mixGeneration += 1;
      mixResumePending = null;
      clearMixRetry();
      playlistId = playlists[0].id;
      save();
      renderPicker();
      renderQueue();
      menu.open = false;
      setTab("playlist", "library");
      if (autoMix) ensureMixBuffer({ force: true }).catch(() => scheduleMixRetry());
    });

    renderPicker();
    renderPlayMode();
    renderAutoMix();
    renderQueue();
    if (!auth) {
      login.disabled = true;
      welcomeInner.querySelector("p:not(.mh-eyebrow)").textContent = "Die Google-Anmeldung ist in dieser WebRadio-Version nicht verfügbar.";
    } else {
      auth.status().then(status => showLoggedIn(Boolean(status.connected))).catch(() => showLoggedIn(false));
    }

    disposeView = () => {
      disposed = true;
      mixGeneration += 1;
      clearMixRetry();
      clearPlaybackWatchdog();
      window.removeEventListener("message", receivePlayerMessage);
      if (typeof unsubscribe === "function") unsubscribe();
      disposeView = null;
    };
    return root;
  }

  window.registerPlugin({
    id: ID,
    activate() {
      injectStyle();
      window.uiRegistry.registerView(ID, "MediaHub", render);
    },
    deactivate() {
      disposeView?.();
      disposeYtMusicClient();
      document.getElementById(STYLE_ID)?.remove();
    }
  });
})();
