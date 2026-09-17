const PLUGIN_ID = "mediahub";

const STYLE = `
.mediahub { min-height: 100%; box-sizing: border-box; padding: 42px 48px; color: var(--text-main, #f5f7ff); font-family: Inter, system-ui, sans-serif; background: radial-gradient(circle at top right, rgba(104, 92, 255, .14), transparent 30%); }
.mh-header { display: flex; align-items: flex-start; justify-content: space-between; gap: 24px; max-width: 1040px; margin: 0 auto 30px; }
.mh-kicker { margin: 0 0 8px; color: var(--accent-color, #786cff); font-size: 12px; font-weight: 800; letter-spacing: .14em; }
.mh-header h1 { margin: 0; font-size: 38px; line-height: 1.1; }
.mh-copy { margin: 12px 0 0; max-width: 520px; color: var(--text-muted, #aab3c2); font-size: 16px; line-height: 1.5; }
.mh-button, .mh-input { font: inherit; border-radius: 10px; }
.mh-button { min-height: 44px; border: 0; padding: 0 17px; color: #fff; background: var(--accent-color, #695cf6); font-weight: 700; cursor: pointer; transition: transform .15s, opacity .15s; }
.mh-button:hover:not(:disabled) { transform: translateY(-1px); }
.mh-button:disabled { cursor: wait; opacity: .62; }
.mh-search { display: flex; gap: 10px; max-width: 1040px; margin: 0 auto 14px; }
.mh-input { min-width: 0; flex: 1; border: 1px solid rgba(255,255,255,.14); padding: 12px 14px; color: var(--text-main, #fff); background: rgba(0,0,0,.2); outline: none; }
.mh-input:focus { border-color: var(--accent-color, #786cff); }
.mh-input:disabled { opacity: .55; }
.mh-message { max-width: 1040px; min-height: 22px; margin: 0 auto 14px; color: var(--text-muted, #aab3c2); }
.mh-message.error { color: #ff9ea6; }
.mh-layout { display: grid; grid-template-columns: minmax(0, 1fr) minmax(320px, .92fr); gap: 18px; max-width: 1040px; margin: 0 auto; }
.mh-panel { overflow: hidden; border: 1px solid rgba(255,255,255,.12); border-radius: 13px; background: rgba(18,20,28,.76); }
.mh-panel h2 { margin: 0; padding: 16px 18px; border-bottom: 1px solid rgba(255,255,255,.10); font-size: 16px; }
.mh-results { display: grid; gap: 1px; min-height: 200px; background: rgba(255,255,255,.06); }
.mh-empty { padding: 30px 18px; color: var(--text-muted, #aab3c2); line-height: 1.45; background: rgba(18,20,28,.76); }
.mh-result { display: grid; grid-template-columns: 116px 1fr; gap: 12px; width: 100%; padding: 11px; border: 0; color: inherit; text-align: left; background: rgba(18,20,28,.94); cursor: pointer; }
.mh-result:hover { background: rgba(105,92,246,.18); }
.mh-thumbnail { width: 116px; height: 65px; border-radius: 7px; object-fit: cover; background: #08090d; }
.mh-title { overflow: hidden; display: -webkit-box; -webkit-box-orient: vertical; -webkit-line-clamp: 2; font-weight: 750; line-height: 1.3; }
.mh-channel { margin-top: 6px; color: var(--text-muted, #aab3c2); font-size: 13px; }
.mh-player { display: grid; min-height: 300px; place-items: center; background: #050609; }
.mh-player iframe { width: 100%; aspect-ratio: 16 / 9; border: 0; }
.mh-player-note { padding: 24px; color: var(--text-muted, #aab3c2); text-align: center; line-height: 1.5; }
@media (max-width: 760px) { .mediahub { padding: 28px 20px; } .mh-header, .mh-layout { display: block; } .mh-header > .mh-button { margin-top: 20px; } .mh-panel + .mh-panel { margin-top: 18px; } }
`;

function make(tag, className, text) {
  const element = document.createElement(tag);
  if (className) element.className = className;
  if (text !== undefined) element.textContent = text;
  return element;
}

function renderMediaHub() {
  const root = make("section", "mediahub");
  const auth = window.mediaHubAuth;
  root.innerHTML = `
    <header class="mh-header">
      <div><p class="mh-kicker">YOUTUBE MUSIC</p><h1>MediaHub</h1><p class="mh-copy">Melde dich mit deinem Google-Konto an und entdecke Musik über YouTube.</p></div>
      <button class="mh-button" type="button" data-action="auth">Mit Google anmelden</button>
    </header>
    <form class="mh-search"><input class="mh-input" type="search" placeholder="Titel, Künstler oder Album" aria-label="Musik suchen" disabled><button class="mh-button" type="submit" disabled>Suchen</button></form>
    <p class="mh-message" role="status"></p>
    <div class="mh-layout"><section class="mh-panel"><h2>Treffer</h2><div class="mh-results"><p class="mh-empty">Melde dich mit Google an, um Musik auf YouTube zu suchen.</p></div></section><section class="mh-panel"><h2>Wiedergabe</h2><div class="mh-player"><p class="mh-player-note">Wähle einen Treffer aus, um ihn abzuspielen.</p></div></section></div>`;

  const login = root.querySelector("[data-action=auth]");
  const form = root.querySelector("form");
  const input = root.querySelector("input");
  const searchButton = form.querySelector("button");
  const message = root.querySelector(".mh-message");
  const results = root.querySelector(".mh-results");
  const player = root.querySelector(".mh-player");
  let connected = false;

  function showMessage(text = "", error = false) { message.textContent = text; message.classList.toggle("error", error); }
  function setConnected(value) { connected = Boolean(value); login.textContent = connected ? "Abmelden" : "Mit Google anmelden"; input.disabled = !connected; searchButton.disabled = !connected; }
  function setBusy(busy) { login.disabled = busy; searchButton.disabled = busy || !connected; input.disabled = busy || !connected; }
  function showEmpty(text) { results.replaceChildren(make("p", "mh-empty", text)); }
  function play(item) { player.replaceChildren(); const frame = make("iframe"); frame.title = item.title || "YouTube-Wiedergabe"; frame.allow = "autoplay; encrypted-media; picture-in-picture"; frame.allowFullscreen = true; frame.src = "https://www.youtube-nocookie.com/embed/" + encodeURIComponent(item.id) + "?autoplay=1&rel=0"; player.append(frame); }
  function showResults(items) {
    if (!items.length) return showEmpty("Keine passenden Musiktitel gefunden.");
    results.replaceChildren(...items.map((item) => {
      const button = make("button", "mh-result"); button.type = "button";
      const image = make("img", "mh-thumbnail"); image.alt = ""; image.src = item.thumbnail || "";
      const info = make("span"); const title = make("span", "mh-title", item.title || "Unbenannter Titel"); const channel = make("span", "mh-channel", item.channel || "YouTube");
      info.append(title, channel); button.append(image, info); button.addEventListener("click", () => play(item)); return button;
    }));
  }

  if (!auth) { showMessage("Diese WebRadio-Version enthält die MediaHub-Anmeldung noch nicht.", true); return root; }
  auth.status().then((state) => setConnected(state?.connected)).catch(() => showMessage("Anmeldestatus konnte nicht geladen werden.", true));
  login.addEventListener("click", async () => {
    setBusy(true); showMessage();
    try { if (connected) { await auth.signOut(); setConnected(false); showEmpty("Du bist abgemeldet."); } else { await auth.signIn(); setConnected(true); showMessage("Google-Konto verbunden. Du kannst jetzt suchen."); } }
    catch (error) { showMessage(error?.message || "Die Google-Anmeldung ist fehlgeschlagen.", true); }
    finally { setBusy(false); }
  });
  form.addEventListener("submit", async (event) => {
    event.preventDefault(); const query = input.value.trim();
    if (query.length < 2) return showMessage("Bitte gib mindestens zwei Zeichen ein.", true);
    setBusy(true); showMessage("Suche läuft …");
    try { const items = await auth.search(query); showResults(Array.isArray(items) ? items : []); showMessage(items.length ? `${items.length} Treffer gefunden.` : "Keine Treffer gefunden."); }
    catch (error) { showMessage(error?.message || "Die YouTube-Suche ist fehlgeschlagen.", true); }
    finally { setBusy(false); }
  });
  return root;
}

window.registerPlugin({
  id: PLUGIN_ID,
  activate() {
    if (!document.getElementById("mediahub-style")) { const style = make("style"); style.id = "mediahub-style"; style.textContent = STYLE; document.head.append(style); }
    window.uiRegistry.registerView(PLUGIN_ID, "MediaHub", renderMediaHub);
  },
  deactivate() { document.getElementById("mediahub-style")?.remove(); }
});
