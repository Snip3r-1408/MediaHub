(() => {
  "use strict";

  const ID = "mediahub";
  const STYLE_ID = "mediahub-styles";
  const STORE_KEY = "mediahub-playlists-v1";
  const MODE_KEY = "mediahub-play-mode-v1";
  const AUTO_MIX_KEY = "mediahub-auto-mix-v1";
  let disposeView = null;

  const css = `
    .mediahub{min-height:100%;padding:26px 34px;color:var(--text-main,#f5f5f5);font-family:inherit;box-sizing:border-box}.mediahub *{box-sizing:border-box}
    .mh-hidden{display:none!important}.mh-btn{border:0;border-radius:10px;padding:10px 15px;background:var(--accent-color,#7166ff);color:#fff;font:inherit;font-weight:700;cursor:pointer;transition:.16s ease}.mh-btn:hover{filter:brightness(1.1);transform:translateY(-1px)}.mh-btn:disabled{opacity:.55;cursor:wait;transform:none}.mh-btn.ghost{background:#ffffff0d;color:var(--text-muted,#aaa)}.mh-icon-btn{width:40px;height:40px;display:grid;place-items:center;padding:0;border-radius:12px}.mh-icon-btn svg,.mh-mini svg,.mh-plus svg{width:18px;height:18px;fill:none;stroke:currentColor;stroke-width:1.9;stroke-linecap:round;stroke-linejoin:round}.mh-icon-btn.ghost:hover{background:#ffffff16;color:#fff}
    .mh-welcome{min-height:470px;display:grid;place-items:center;text-align:center}.mh-welcome-inner{max-width:480px;padding:32px}.mh-mark{width:54px;height:54px;margin:0 auto 22px;display:grid;place-items:center;border-radius:18px;background:linear-gradient(145deg,var(--accent-color,#7166ff),#a352ff);font-size:24px;box-shadow:0 16px 42px #6c5cff35}.mh-eyebrow{margin:0 0 9px;color:var(--accent-color,#8277ff);font-size:10px;font-weight:800;letter-spacing:.16em}.mh-welcome h1{margin:0 0 12px;font-size:34px}.mh-welcome p{margin:0 auto 25px;color:var(--text-muted,#a6a6a6);font-size:15px;line-height:1.65}
    .mh-top{display:flex;align-items:center;gap:10px;margin-bottom:20px}.mh-brand{min-width:150px}.mh-brand h1{margin:2px 0 0;font-size:24px}.mh-brand p{margin:0;color:var(--accent-color,#8277ff);font-size:9px;font-weight:800;letter-spacing:.15em}.mh-search{display:flex;flex:0 1 430px;gap:4px;margin-left:auto;padding:4px;border-radius:13px;background:#ffffff0b}.mh-input,.mh-select{min-width:0;border:0;border-radius:10px;background:#ffffff0b;color:inherit;font:inherit;outline:0}.mh-search .mh-input{flex:1;padding:7px 10px;background:transparent}.mh-input:focus,.mh-select:focus{box-shadow:0 0 0 2px var(--accent-color,#7166ff)}.mh-select{padding:8px 10px}.mh-error{margin:-8px 0 14px;padding:9px 12px;border-radius:9px;background:#ff5f5f12;color:#ff9d9d;font-size:13px}
    .mh-content{display:grid;grid-template-columns:minmax(260px,.8fr) minmax(390px,1.35fr);gap:28px;align-items:start}.mh-library{min-width:0}.mh-tabs{display:flex;align-items:center;gap:6px;margin-bottom:9px}.mh-tab{border:0;background:transparent;color:var(--text-muted,#999);font:inherit;font-weight:700;padding:7px 9px;border-radius:8px;cursor:pointer}.mh-tab.active{background:#ffffff0e;color:inherit}.mh-count{margin-left:auto;color:var(--text-muted,#888);font-size:12px}.mh-list,.mh-queue{max-height:410px;margin:0;padding:0;list-style:none;overflow:auto}.mh-empty{margin:0;padding:28px 8px;color:var(--text-muted,#999);font-size:13px;line-height:1.5}
    .mh-result{display:grid;grid-template-columns:66px minmax(0,1fr) 30px;gap:10px;align-items:center;padding:7px 8px;border-radius:10px;cursor:pointer}.mh-result:hover,.mh-result.active,.mh-queue-row:hover,.mh-queue-row.active{background:#ffffff0b}.mh-result img{width:66px;height:42px;border-radius:7px;object-fit:cover}.mh-copy{display:grid;min-width:0;gap:2px}.mh-copy>*{overflow:hidden;text-overflow:ellipsis;white-space:nowrap}.mh-copy strong{font-size:13px}.mh-copy span{color:var(--text-muted,#999);font-size:12px}.mh-plus,.mh-remove{border:0;background:#ffffff0c;color:var(--text-muted,#aaa);cursor:pointer}.mh-plus{width:28px;height:28px;border-radius:8px;font-size:17px}.mh-plus:hover{background:var(--accent-color,#7166ff);color:#fff}
    .mh-playlist-bar{display:grid;grid-template-columns:minmax(0,1fr) auto auto auto auto;gap:7px;margin-bottom:9px}.mh-mini{padding:7px 10px;border-radius:8px}.mh-mini.active{background:var(--accent-color,#7166ff);color:#fff}.mh-queue-row{display:grid;grid-template-columns:25px minmax(0,1fr) auto;gap:8px;align-items:center;padding:9px 8px;border-radius:9px;cursor:pointer}.mh-queue-row span{color:var(--text-muted,#999);font-size:12px}.mh-queue-row strong{overflow:hidden;text-overflow:ellipsis;white-space:nowrap;font-size:13px}.mh-remove{font-size:17px;border-radius:6px}
    .mh-player{min-width:0}.mh-player-label{display:flex;justify-content:space-between;align-items:center;margin:2px 0 10px}.mh-player-label h2{margin:0;font-size:15px}.mh-player-label span{color:var(--text-muted,#888);font-size:11px}.mh-player-placeholder{min-height:250px;display:grid;place-items:center;border-radius:14px;background:linear-gradient(145deg,#ffffff08,#ffffff03);color:var(--text-muted,#999);font-size:13px;text-align:center;padding:25px}.mh-frame{height:260px;min-height:200px;border-radius:14px;overflow:hidden;background:#000;box-shadow:0 16px 40px #0004}.mh-frame iframe{width:100%;height:100%;border:0;display:block}.mh-now{display:flex;gap:12px;align-items:center;padding:14px 2px}.mh-now img{width:46px;height:46px;border-radius:9px;object-fit:cover}.mh-now-copy{min-width:0}.mh-now h3{margin:0 0 3px;font-size:15px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}.mh-now p{margin:0;color:var(--text-muted,#999);font-size:12px}.mh-player-note{margin:0 2px;color:var(--text-muted,#777);font-size:11px}
    @media(max-width:780px){.mediahub{padding:20px}.mh-top{flex-wrap:wrap}.mh-search{order:3;flex:1 0 100%;margin-left:0}.mh-content{grid-template-columns:1fr}.mh-list,.mh-queue{max-height:280px}.mh-frame{height:230px}}
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
    let currentTab = "results";
    let playMode = localStorage.getItem(MODE_KEY) || "once";
    let autoMix = localStorage.getItem(AUTO_MIX_KEY) === "true";
    let lastSearchQuery = "";
    const failedVideoIds = new Set();
    const playedVideoIds = new Set();
    let mixRound = 0;
    let advancing = false;
    let blockedRecoveries = 0;

    const welcome = el("div", "mh-welcome");
    const welcomeInner = el("div", "mh-welcome-inner");
    welcomeInner.append(el("div", "mh-mark", "▶"), el("p", "mh-eyebrow", "YOUTUBE MUSIC"), el("h1", "", "Willkommen bei MediaHub"), el("p", "", "Bitte melden Sie sich mit Google an, um diesen Service zu nutzen."));
    const login = el("button", "mh-btn", "Mit Google anmelden");
    login.type = "button";
    welcomeInner.append(login);
    welcome.append(welcomeInner);

    const app = el("div", "mh-hidden");
    const brand = el("div", "mh-brand");
    brand.append(el("p", "", "YOUTUBE MUSIC"), el("h1", "", "MediaHub"));
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
    top.append(brand, form, logout);
    const error = el("p", "mh-error");
    error.hidden = true;

    const resultTab = el("button", "mh-tab active", "Treffer");
    const playlistTab = el("button", "mh-tab", "Playlist");
    resultTab.type = playlistTab.type = "button";
    const count = el("span", "mh-count");
    const tabs = el("div", "mh-tabs");
    tabs.append(resultTab, playlistTab, count);
    const resultsView = el("div");
    const results = el("ol", "mh-list");
    const resultsEmpty = el("p", "mh-empty", "Suche nach einem Titel, Künstler oder Album.");
    resultsView.append(resultsEmpty, results);

    const playlistView = el("div", "mh-hidden");
    const picker = el("select", "mh-select");
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
    newList.append(icon("plus"));
    deleteList.append(icon("trash"));
    const playlistBar = el("div", "mh-playlist-bar");
    playlistBar.append(picker, mixButton, modeButton, newList, deleteList);
    const queue = el("ol", "mh-queue");
    const queueEmpty = el("p", "mh-empty", "Füge Treffer über das Plus zu deiner Playlist hinzu.");
    playlistView.append(playlistBar, queueEmpty, queue);
    const library = el("section", "mh-library");
    library.append(tabs, resultsView, playlistView);

    const playerLabel = el("div", "mh-player-label");
    playerLabel.append(el("h2", "", "Wiedergabe"), el("span", "", "YouTube"));
    const playerHost = el("div", "mh-player-placeholder", "Wähle links einen Titel aus.");
    const player = el("section", "mh-player");
    player.append(playerLabel, playerHost);
    const content = el("div", "mh-content");
    content.append(library, player);
    app.append(top, error, content);
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
    }

    function setTab(tab) {
      currentTab = tab;
      const isResults = tab === "results";
      resultTab.classList.toggle("active", isResults);
      playlistTab.classList.toggle("active", !isResults);
      resultsView.classList.toggle("mh-hidden", !isResults);
      playlistView.classList.toggle("mh-hidden", isResults);
      count.textContent = isResults && currentResults.length ? `${currentResults.length} Treffer` : "";
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
      playlistTab.textContent = `Playlist${activePlaylist().items.length ? ` (${activePlaylist().items.length})` : ""}`;
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
    }

    function renderQueue() {
      const items = activePlaylist().items;
      queue.replaceChildren();
      queueEmpty.hidden = items.length > 0;
      items.forEach((item, index) => {
        const row = el("li", `mh-queue-row${selected?.id === item.id ? " active" : ""}`);
        row.append(el("span", "", String(index + 1)), el("strong", "", decode(item.title)));
        const remove = el("button", "mh-remove", "×");
        remove.type = "button";
        remove.addEventListener("click", event => {
          event.stopPropagation();
          items.splice(index, 1);
          save();
          renderPicker();
          renderQueue();
        });
        row.append(remove);
        row.addEventListener("click", () => play(item));
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
      }
    }

    function forgetBlockedItem(videoId) {
      if (!videoId) return;
      playlists.forEach(list => {
        list.items = list.items.filter(item => item.id !== videoId);
      });
      currentResults = currentResults.filter(item => item.id !== videoId);
      save();
      renderResults(currentResults);
      renderQueue();
    }

    function artistKey(item) {
      return decode(item?.channel || "").trim().toLocaleLowerCase();
    }

    function mergeIntoPlaylist(items, limit = 8, maxPerArtist = 2) {
      const list = activePlaylist();
      const known = new Set(list.items.map(item => item.id));
      const artistCounts = new Map();
      list.items.forEach(item => {
        const key = artistKey(item);
        if (key) artistCounts.set(key, (artistCounts.get(key) || 0) + 1);
      });
      const additions = [];
      for (const item of items) {
        if (!item?.id || known.has(item.id) || failedVideoIds.has(item.id)) continue;
        const key = artistKey(item);
        if (key && (artistCounts.get(key) || 0) >= maxPerArtist) continue;
        additions.push(item);
        known.add(item.id);
        if (key) artistCounts.set(key, (artistCounts.get(key) || 0) + 1);
        if (additions.length >= limit) break;
      }
      if (!additions.length) return [];
      list.items.push(...additions);
      save();
      renderQueue();
      return additions;
    }

    async function fillGenreMix(seed, firstResults = []) {
      const additions = mergeIntoPlaylist(firstResults, 4, 2);
      if (!seed || additions.length >= 8) return additions;
      const related = await auth.search(`${seed} ähnliche Künstler Genre Mix`);
      return additions.concat(mergeIntoPlaylist(related, 8 - additions.length, 2));
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
        row.addEventListener("click", () => play(item));
        results.append(row);
      });
    }

    async function ensurePlayer() {
      if (frame) return;
      const url = await window.pluginHttpAPI?.getAssetUrl(ID, "player.html");
      if (!url) throw new Error("Der lokale MediaHub-Player konnte nicht geladen werden.");
      frameOrigin = new URL(url).origin;
      const wrap = el("div", "mh-frame");
      frame = document.createElement("iframe");
      frame.title = "MediaHub YouTube-Player";
      frame.allow = "autoplay; encrypted-media; picture-in-picture";
      frame.src = url;
      wrap.append(frame);
      playerHost.className = "";
      playerHost.replaceChildren(wrap);
      await new Promise((resolve, reject) => {
        frame.addEventListener("load", resolve, { once: true });
        frame.addEventListener("error", () => reject(new Error("Der Player konnte nicht geöffnet werden.")), { once: true });
      });
    }

    async function play(item) {
      selected = item;
      playedVideoIds.add(item.id);
      showError("");
      try {
        const activation = await api?.setActiveProvider?.(ID);
        if (activation?.ok === false) throw new Error(activation.error?.message || "MediaHub konnte nicht aktiviert werden.");
        await ensurePlayer();
        const title = decode(item.title);
        const artist = decode(item.channel);
        await api?.reportProviderState?.(ID, { state: "loading", title, artist, artwork: item.thumbnail || null, videoId: item.id });
        post({ command: "load", videoId: item.id });
        player.querySelector(".mh-now")?.remove();
        player.querySelector(".mh-player-note")?.remove();
        const now = el("div", "mh-now");
        const image = document.createElement("img");
        image.src = item.thumbnail || "";
        image.alt = "";
        const copy = el("div", "mh-now-copy");
        copy.append(el("h3", "", title), el("p", "", artist));
        now.append(image, copy);
        player.append(now, el("p", "mh-player-note", "Steuerung über die untere WebRadio-Leiste."));
        renderResults(currentResults);
        renderQueue();
      } catch (err) {
        showError(err.message || "Die Wiedergabe konnte nicht gestartet werden.");
      }
    }

    async function advancePlayback() {
      if (advancing) return;
      advancing = true;
      try {
      let pool = activePlaylist().items.filter(item => !failedVideoIds.has(item.id));
      if (!pool.length) pool = currentResults.filter(item => !failedVideoIds.has(item.id));
      const index = pool.findIndex(item => item.id === selected?.id);
      let next = null;
      if (playMode === "shuffle" && pool.length) {
        const choices = pool.filter(item => item.id !== selected?.id && !playedVideoIds.has(item.id));
        if (choices.length) next = choices[Math.floor(Math.random() * choices.length)];
      } else if (pool[index + 1]) {
        next = pool[index + 1];
      }

      if (!next && autoMix && auth?.search) {
        const title = decode(selected?.title || "").replace(/\([^)]*\)|\[[^\]]*\]/g, " ").trim();
        const artist = decode(selected?.channel || "").trim();
        const original = (lastSearchQuery || input.value).trim();
        const searches = [
          `${original || artist} Genre Mix Playlist`,
          `${title || original} ähnliche Songs`,
          `${artist || original} ähnliche Künstler Musik`
        ].filter(Boolean);
        try {
          for (let attempt = 0; attempt < searches.length && !next; attempt += 1) {
            const query = searches[(mixRound + attempt) % searches.length];
            const suggestions = await auth.search(query);
            const additions = mergeIntoPlaylist(suggestions, 8, 2);
            if (additions.length) {
              mixRound = (mixRound + attempt + 1) % searches.length;
              next = playMode === "shuffle"
                ? additions[Math.floor(Math.random() * additions.length)]
                : additions[0];
            }
          }
        } catch (err) {
          showError(err.message || "Auto-Mix konnte keine weitere Musik laden.");
        }
      }

      if (!next && playMode === "repeat" && pool.length) next = pool[0];
      if (!next && playMode === "shuffle" && pool.length) {
        playedVideoIds.clear();
        next = pool[Math.floor(Math.random() * pool.length)];
      }
      if (next) await play(next);
      else api?.reportProviderState?.(ID, { state: "stopped" });
      } finally {
        advancing = false;
      }
    }

    function receivePlayerMessage(event) {
      if (event.source !== frame?.contentWindow || event.data?.source !== "mediahub-player") return;
      if (event.data.type === "error") {
        const code = Number(event.data.code);
        if ([101, 150].includes(code)) {
          const blockedId = selected?.id;
          if (blockedId) {
            failedVideoIds.add(blockedId);
            forgetBlockedItem(blockedId);
          }
          blockedRecoveries += 1;
          const canContinue = blockedRecoveries <= 8 && (autoMix || activePlaylist().items.length || currentResults.length);
          showError(canContinue
            ? "Diese Version ist gesperrt – MediaHub sucht automatisch die nächste passende Version …"
            : "Mehrere YouTube-Versionen sind für externe Player gesperrt. Bitte starte eine neue Suche.");
          if (canContinue) window.setTimeout(() => advancePlayback(), 350);
        } else {
          showError(`YouTube-Player-Fehler: ${code}`);
        }
      }
      if (event.data.type === "autoplay-blocked") showError("YouTube hat den automatischen Start blockiert. Bitte drücke unten auf Start.");
      if (event.data.type === "ended") {
        advancePlayback();
        return;
      }
      if (event.data.type === "state" && selected) {
        if (event.data.state === "playing") {
          blockedRecoveries = 0;
          showError("");
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
      if (message?.providerId === ID) post(message);
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
      search.disabled = true;
      search.replaceChildren();
      search.append(icon("search"));
      showError("");
      try {
        const found = await auth.search(query);
        renderResults(found);
        if (autoMix) {
          const additions = await fillGenreMix(query, found);
          if (!selected && (additions[0] || found[0])) play(additions[0] || found[0]);
        }
        setTab("results");
      } catch (err) {
        showError(err.message || "Die Suche ist fehlgeschlagen.");
      } finally {
        search.disabled = false;
        search.replaceChildren();
        search.append(icon("search"));
      }
    });
    resultTab.addEventListener("click", () => setTab("results"));
    playlistTab.addEventListener("click", () => setTab("playlist"));
    picker.addEventListener("change", () => {
      playlistId = picker.value;
      renderQueue();
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
      if (autoMix && currentResults.length) {
        fillGenreMix(lastSearchQuery || input.value.trim(), currentResults).then(additions => {
          if (!selected && (additions[0] || currentResults[0])) play(additions[0] || currentResults[0]);
        }).catch(err => showError(err.message || "Auto-Mix konnte nicht ergänzt werden."));
      }
    });
    newList.addEventListener("click", () => {
      const name = window.prompt("Name der neuen Playlist:", "Neue Playlist");
      if (!name?.trim()) return;
      const list = { id: `playlist-${Date.now()}`, name: name.trim(), items: [] };
      playlists.push(list);
      playlistId = list.id;
      save();
      renderPicker();
      renderQueue();
    });
    deleteList.addEventListener("click", () => {
      if (playlists.length === 1 || !window.confirm(`Playlist „${activePlaylist().name}“ löschen?`)) return;
      playlists = playlists.filter(list => list.id !== playlistId);
      playlistId = playlists[0].id;
      save();
      renderPicker();
      renderQueue();
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
      document.getElementById(STYLE_ID)?.remove();
    }
  });
})();
