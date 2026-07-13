const ENGINES = [
  { id: "google", name: "Google", url: "https://www.google.com/search?q=%s", logo: "icons/search-engines/google.svg" },
  { id: "bing", name: "Bing", url: "https://www.bing.com/search?q=%s", logo: "icons/search-engines/bing.svg" },
  { id: "duckduckgo", name: "DuckDuckGo", url: "https://duckduckgo.com/?q=%s", logo: "icons/search-engines/duckduckgo.svg" },
  { id: "baidu", name: "百度", url: "https://www.baidu.com/s?wd=%s", logo: "icons/search-engines/baidu.svg" },
  { id: "sogou", name: "搜狗", url: "https://www.sogou.com/web?query=%s", logo: "icons/search-engines/sogou.svg" }
];

const DEFAULT_SETTINGS = {
  engine: "google",
  logoMode: "text",
  logoText: "PureTab",
  logoImage: "",
  backgroundImage: "",
  theme: "system",
  showBookmarks: false,
  history: []
};

function createStorageAdapter() {
  const browserStorage = globalThis.browser?.storage?.local;
  const chromeStorage = globalThis.chrome?.storage?.local;

  if (browserStorage) {
    return {
      get(key) {
        return browserStorage.get(key);
      },
      set(values) {
        return browserStorage.set(values);
      }
    };
  }

  if (chromeStorage) {
    return {
      get(key) {
        return new Promise((resolve) => {
          chromeStorage.get(key, resolve);
        });
      },
      set(values) {
        return new Promise((resolve, reject) => {
          chromeStorage.set(values, () => {
            const error = globalThis.chrome?.runtime?.lastError;
            if (error) {
              reject(new Error(error.message));
              return;
            }
            resolve();
          });
        });
      }
    };
  }

  return {
    async get(key) {
      const raw = localStorage.getItem(key);
      return { [key]: raw ? JSON.parse(raw) : undefined };
    },
    async set(values) {
      for (const [key, value] of Object.entries(values)) {
        localStorage.setItem(key, JSON.stringify(value));
      }
    }
  };
}

const storage = createStorageAdapter();
const browserBookmarks = globalThis.browser?.bookmarks;
const chromeBookmarks = globalThis.chrome?.bookmarks;
const $ = (selector) => document.querySelector(selector);

const elements = {
  brand: $("#brand"),
  form: $("#searchForm"),
  input: $("#searchInput"),
  enginePicker: $("#enginePicker"),
  engineMenuButton: $("#engineMenuButton"),
  engineMenu: $("#engineMenu"),
  defaultEngine: $("#defaultEngine"),
  themeSelect: $("#themeSelect"),
  showBookmarks: $("#showBookmarks"),
  settingsToggle: $("#settingsToggle"),
  settingsPanel: $("#settingsPanel"),
  closeSettings: $("#closeSettings"),
  backgroundFile: $("#backgroundFile"),
  backgroundPreview: $("#backgroundPreview"),
  backgroundStatus: $("#backgroundStatus"),
  removeBackground: $("#removeBackground"),
  logoText: $("#logoText"),
  logoTextField: $("#logoTextField"),
  logoImageFile: $("#logoImageFile"),
  logoImageField: $("#logoImageField"),
  logoImageStatus: $("#logoImageStatus"),
  removeLogoImage: $("#removeLogoImage"),
  historyPanel: $("#historyPanel"),
  historyList: $("#historyList"),
  clearHistory: $("#clearHistory")
};

let settings = { ...DEFAULT_SETTINGS };
let timeTimer = 0;
let historyOpen = false;
let bookmarks = [];

function getEngine(id) {
  return ENGINES.find((engine) => engine.id === id) || ENGINES[0];
}

function populateEngines() {
  const options = ENGINES.map((engine) => `<option value="${engine.id}">${engine.name}</option>`).join("");
  elements.defaultEngine.innerHTML = options;
  elements.engineMenu.innerHTML = "";

  for (const engine of ENGINES) {
    const button = document.createElement("button");
    button.type = "button";
    button.className = "engine-option";
    button.dataset.engine = engine.id;
    button.setAttribute("role", "menuitem");
    button.setAttribute("aria-label", engine.name);
    button.innerHTML = `<img src="${engine.logo}" alt="" aria-hidden="true" /><span>${engine.name}</span>`;
    elements.engineMenu.append(button);
  }
}

function saveSettings(nextSettings = settings) {
  settings = { ...settings, ...nextSettings };
  return storage.set({ settings });
}

function setBackground() {
  if (settings.backgroundImage) {
    document.body.style.setProperty("--custom-bg", `url("${settings.backgroundImage}")`);
    document.body.style.setProperty("--bg-overlay", "0.2");
    document.body.style.setProperty("--bg-blur", "0px");
    return;
  }

  document.body.style.removeProperty("--custom-bg");
  document.body.style.setProperty("--bg-overlay", "0.3");
  document.body.style.setProperty("--bg-blur", "0px");
}

function applyTheme() {
  if (settings.theme === "light" || settings.theme === "dark") {
    document.body.dataset.theme = settings.theme;
    return;
  }

  document.body.removeAttribute("data-theme");
}

function renderBackgroundControls() {
  const hasBackground = Boolean(settings.backgroundImage);
  elements.backgroundPreview.hidden = !hasBackground;
  elements.removeBackground.hidden = !hasBackground;

  if (hasBackground) {
    elements.backgroundPreview.style.backgroundImage = `url("${settings.backgroundImage}")`;
    elements.backgroundStatus.textContent = "已设置";
  } else {
    elements.backgroundPreview.style.removeProperty("background-image");
    elements.backgroundStatus.textContent = "未设置";
  }
}

function renderBrand() {
  clearInterval(timeTimer);
  elements.brand.className = "brand";
  elements.brand.innerHTML = "";

  if (settings.logoMode === "image" && settings.logoImage) {
    const image = document.createElement("img");
    image.src = settings.logoImage;
    image.alt = "Logo";
    elements.brand.append(image);
    return;
  }

  if (settings.logoMode === "time") {
    elements.brand.classList.add("time");
    const updateTime = () => {
      elements.brand.textContent = new Intl.DateTimeFormat("zh-CN", {
        hour: "2-digit",
        minute: "2-digit",
        hour12: false
      }).format(new Date());
    };
    updateTime();
    timeTimer = setInterval(updateTime, 1000);
    return;
  }

  elements.brand.textContent = settings.logoText || "PureTab";
}

function renderLogoFields() {
  elements.logoTextField.hidden = settings.logoMode !== "text";
  elements.logoImageField.hidden = settings.logoMode !== "image";
  elements.removeLogoImage.hidden = settings.logoMode !== "image" || !settings.logoImage;
  elements.logoImageStatus.textContent = settings.logoImage ? "已设置" : "未设置";
}

function getBookmarkTree() {
  if (browserBookmarks?.getTree) {
    return browserBookmarks.getTree();
  }

  if (chromeBookmarks?.getTree) {
    return new Promise((resolve) => {
      chromeBookmarks.getTree(resolve);
    });
  }

  return Promise.resolve([]);
}

function flattenBookmarks(nodes, list = []) {
  for (const node of nodes || []) {
    if (node.url) {
      list.push({
        title: node.title || node.url,
        url: node.url
      });
    }
    if (node.children) flattenBookmarks(node.children, list);
  }

  return list;
}

async function loadBookmarks() {
  if (!settings.showBookmarks) {
    bookmarks = [];
    renderHistory();
    return;
  }

  try {
    bookmarks = flattenBookmarks(await getBookmarkTree());
  } catch (error) {
    console.error("Failed to load bookmarks", error);
    bookmarks = [];
  }

  renderHistory();
}

function renderHistory() {
  const query = elements.input.value.trim().toLowerCase();
  const visibleHistory = settings.history
    .filter((item) => !query || item.query.toLowerCase().includes(query))
    .slice(0, 8);
  const visibleBookmarks = settings.showBookmarks
    ? bookmarks
      .filter((item) => {
        const title = item.title.toLowerCase();
        const url = item.url.toLowerCase();
        return query ? title.includes(query) || url.includes(query) : true;
      })
      .slice(0, 8)
    : [];

  const shouldShow = historyOpen && (visibleHistory.length > 0 || visibleBookmarks.length > 0);
  elements.historyPanel.hidden = !shouldShow;
  elements.form.classList.toggle("history-open", shouldShow);
  elements.historyList.innerHTML = "";

  for (const item of visibleHistory) {
    const button = document.createElement("button");
    button.type = "button";
    button.className = "suggestion-item";
    button.dataset.type = "history";
    button.dataset.query = item.query;
    button.dataset.engine = item.engine;
    button.innerHTML = `
      <span class="history-query">
        <span class="suggestion-icon" aria-hidden="true">
          <svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="8" /><path d="M12 8v5l3 2" /></svg>
        </span>
        <span>${escapeHtml(item.query)}</span>
      </span>
      <span class="history-engine">${escapeHtml(getEngine(item.engine).name)}</span>
    `;
    elements.historyList.append(button);
  }

  for (const item of visibleBookmarks) {
    const button = document.createElement("button");
    button.type = "button";
    button.className = "suggestion-item";
    button.dataset.type = "bookmark";
    button.dataset.url = item.url;
    button.innerHTML = `
      <span class="history-query">
        <span class="suggestion-icon" aria-hidden="true">
          <svg viewBox="0 0 24 24"><path d="M7 5.5A2.5 2.5 0 0 1 9.5 3h5A2.5 2.5 0 0 1 17 5.5V20l-5-3-5 3V5.5Z" /></svg>
        </span>
        <span>${escapeHtml(item.title)}</span>
      </span>
      <span class="history-engine">${escapeHtml(getHostname(item.url))}</span>
    `;
    elements.historyList.append(button);
  }
}

function openHistory() {
  historyOpen = true;
  renderHistory();
}

function closeHistory() {
  historyOpen = false;
  renderHistory();
}

function render() {
  const currentEngine = getEngine(settings.engine);
  elements.defaultEngine.value = settings.engine;
  elements.themeSelect.value = settings.theme;
  elements.showBookmarks.checked = settings.showBookmarks;
  elements.logoText.value = settings.logoText;
  elements.engineMenuButton.innerHTML = `<img src="${currentEngine.logo}" alt="" aria-hidden="true" />`;
  elements.engineMenuButton.title = currentEngine.name;
  elements.engineMenu.querySelectorAll(".engine-option").forEach((button) => {
    const isActive = button.dataset.engine === settings.engine;
    button.classList.toggle("active", isActive);
    button.setAttribute("aria-current", isActive ? "true" : "false");
  });
  document.querySelectorAll('input[name="logoMode"]').forEach((input) => {
    input.checked = input.value === settings.logoMode;
  });
  applyTheme();
  setBackground();
  renderBackgroundControls();
  renderBrand();
  renderLogoFields();
  renderHistory();
}

function escapeHtml(value) {
  return value.replace(/[&<>"']/g, (char) => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#39;"
  }[char]));
}

function isProbablyUrl(value) {
  if (/\s/.test(value)) return false;
  if (/^https?:\/\//i.test(value)) return true;
  return /^[a-z0-9-]+(\.[a-z0-9-]+)+(:\d+)?(\/.*)?$/i.test(value);
}

function normalizeUrl(value) {
  return /^https?:\/\//i.test(value) ? value : `https://${value}`;
}

function getHostname(url) {
  try {
    return new URL(url).hostname;
  } catch {
    return "书签";
  }
}

async function search(query, engineId = settings.engine) {
  const trimmed = query.trim();
  if (!trimmed) return;

  await addHistory(trimmed, engineId);

  if (isProbablyUrl(trimmed)) {
    window.location.href = normalizeUrl(trimmed);
    return;
  }

  const engine = getEngine(engineId);
  window.location.href = engine.url.replace("%s", encodeURIComponent(trimmed));
}

async function addHistory(query, engineId) {
  const nextHistory = [
    { query, engine: engineId, at: Date.now() },
    ...settings.history.filter((item) => item.query !== query || item.engine !== engineId)
  ].slice(0, 20);

  await saveSettings({ history: nextHistory });
  renderHistory();
}

function resizeImageFile(file, maxSize, quality = 0.86, type = "image/jpeg") {
  return new Promise((resolve, reject) => {
    const image = new Image();
    const reader = new FileReader();

    reader.onload = () => {
      image.onload = () => {
        const scale = Math.min(1, maxSize / Math.max(image.width, image.height));
        const width = Math.max(1, Math.round(image.width * scale));
        const height = Math.max(1, Math.round(image.height * scale));
        const canvas = document.createElement("canvas");
        canvas.width = width;
        canvas.height = height;
        canvas.getContext("2d").drawImage(image, 0, 0, width, height);
        resolve(canvas.toDataURL(type, quality));
      };
      image.onerror = reject;
      image.src = reader.result;
    };

    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

function bindEvents() {
  elements.form.addEventListener("submit", (event) => {
    event.preventDefault();
    closeHistory();
    search(elements.input.value, settings.engine);
  });

  elements.input.addEventListener("focus", openHistory);
  elements.input.addEventListener("input", openHistory);

  elements.engineMenuButton.addEventListener("click", () => {
    const willOpen = elements.engineMenu.hidden;
    elements.engineMenu.hidden = !willOpen;
    elements.engineMenuButton.setAttribute("aria-expanded", String(willOpen));
  });

  elements.engineMenu.addEventListener("click", async (event) => {
    const button = event.target.closest(".engine-option");
    if (!button) return;
    await saveSettings({ engine: button.dataset.engine });
    elements.engineMenu.hidden = true;
    elements.engineMenuButton.setAttribute("aria-expanded", "false");
    render();
    elements.input.focus();
  });

  elements.defaultEngine.addEventListener("change", async () => {
    await saveSettings({ engine: elements.defaultEngine.value });
    elements.engineMenu.hidden = true;
    elements.engineMenuButton.setAttribute("aria-expanded", "false");
    render();
  });

  elements.themeSelect.addEventListener("change", async () => {
    await saveSettings({ theme: elements.themeSelect.value });
    render();
  });

  elements.showBookmarks.addEventListener("change", async () => {
    await saveSettings({ showBookmarks: elements.showBookmarks.checked });
    render();
    loadBookmarks();
  });

  elements.settingsToggle.addEventListener("click", () => {
    elements.settingsPanel.hidden = false;
  });

  elements.closeSettings.addEventListener("click", () => {
    elements.settingsPanel.hidden = true;
  });

  elements.backgroundFile.addEventListener("change", async () => {
    const [file] = elements.backgroundFile.files;
    if (!file) return;
    try {
      await saveSettings({ backgroundImage: await resizeImageFile(file, 1920, 0.84, "image/jpeg") });
      render();
    } catch (error) {
      console.error("Failed to save background image", error);
    } finally {
      elements.backgroundFile.value = "";
    }
  });

  elements.removeBackground.addEventListener("click", async () => {
    await saveSettings({ backgroundImage: "" });
    elements.backgroundFile.value = "";
    render();
  });

  document.querySelectorAll('input[name="logoMode"]').forEach((input) => {
    input.addEventListener("change", async () => {
      await saveSettings({ logoMode: input.value });
      render();
    });
  });

  elements.logoText.addEventListener("input", async () => {
    await saveSettings({ logoText: elements.logoText.value.trim() || "PureTab" });
    renderBrand();
  });

  elements.logoImageFile.addEventListener("change", async () => {
    const [file] = elements.logoImageFile.files;
    if (!file) return;
    try {
      await saveSettings({
        logoMode: "image",
        logoImage: await resizeImageFile(file, 720, 0.92, "image/png")
      });
      render();
    } catch (error) {
      console.error("Failed to save logo image", error);
    } finally {
      elements.logoImageFile.value = "";
    }
  });

  elements.removeLogoImage.addEventListener("click", async () => {
    await saveSettings({ logoImage: "", logoMode: "text" });
    render();
  });

  elements.historyList.addEventListener("click", (event) => {
    const item = event.target.closest(".suggestion-item");
    if (!item) return;
    closeHistory();
    if (item.dataset.type === "bookmark") {
      window.location.href = item.dataset.url;
      return;
    }
    search(item.dataset.query, item.dataset.engine);
  });

  elements.clearHistory.addEventListener("click", async () => {
    await saveSettings({ history: [] });
    closeHistory();
  });

  window.addEventListener("keydown", (event) => {
    if (event.key === "Escape") {
      elements.settingsPanel.hidden = true;
      elements.engineMenu.hidden = true;
      elements.engineMenuButton.setAttribute("aria-expanded", "false");
      closeHistory();
    }
    if (event.key === "/" && document.activeElement !== elements.input) {
      event.preventDefault();
      elements.input.focus();
    }
  });

  document.addEventListener("click", (event) => {
    if (elements.enginePicker.contains(event.target)) return;
    elements.engineMenu.hidden = true;
    elements.engineMenuButton.setAttribute("aria-expanded", "false");

    if (!elements.form.contains(event.target)) {
      closeHistory();
    }
  });
}

async function init() {
  populateEngines();
  const stored = await storage.get("settings");
  settings = { ...DEFAULT_SETTINGS, ...(stored.settings || {}) };
  if (settings.logoText === "Google") {
    settings.logoText = "PureTab";
    await saveSettings({ logoText: "PureTab" });
  }
  bindEvents();
  render();
  loadBookmarks();
  elements.input.focus();
}

init();
