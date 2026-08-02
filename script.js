const dataUrl = "./data/policy_sites_data.json";

const state = {
  activeSection: "all",
  query: "",
  allSites: [],
};

const root = document.querySelector("#cards-root");
const filterRoot = document.querySelector("#section-filters");
const searchInput = document.querySelector("#search-input");
const resultSummary = document.querySelector("#result-summary");
const cardTemplate = document.querySelector("#site-card-template");

function normalizeSiteData(rawData) {
  return Object.entries(rawData).flatMap(([sectionKey, sectionValue]) => {
    const sectionName = sectionValue.name || sectionKey;
    const sites = Array.isArray(sectionValue.sites) ? sectionValue.sites : [];

    return sites.map((site) => ({
      sectionKey,
      sectionName,
      name: site.name || "未命名站点",
      url: site.url || "",
      policyUrl: site.policy_url || "",
      description: site.desc || "暂无说明",
      region: site.region || "",
    }));
  });
}

function renderStats(sites) {
  const sectionCount = new Set(sites.map((site) => site.sectionKey)).size;
  const regionCount = new Set(sites.map((site) => site.region).filter(Boolean)).size;

  document.querySelector("#total-sites").textContent = String(sites.length);
  document.querySelector("#total-sections").textContent = String(sectionCount);
  document.querySelector("#total-regions").textContent = String(regionCount);
}

function buildFilters(sites) {
  const sections = [
    { key: "all", label: "全部" },
    ...Array.from(new Map(sites.map((site) => [site.sectionKey, site.sectionName])).entries()).map(
      ([key, label]) => ({ key, label })
    ),
  ];

  filterRoot.innerHTML = "";

  sections.forEach((section) => {
    const button = document.createElement("button");
    button.type = "button";
    button.className = `chip${section.key === state.activeSection ? " active" : ""}`;
    button.textContent = section.label;
    button.addEventListener("click", () => {
      state.activeSection = section.key;
      buildFilters(state.allSites);
      renderCards();
    });
    filterRoot.appendChild(button);
  });
}

function filterSites() {
  const search = state.query.trim().toLowerCase();

  return state.allSites.filter((site) => {
    const matchesSection = state.activeSection === "all" || site.sectionKey === state.activeSection;
    const haystack = [site.name, site.description, site.region, site.sectionName].join(" ").toLowerCase();
    const matchesSearch = !search || haystack.includes(search);

    return matchesSection && matchesSearch;
  });
}

function renderCards() {
  const sites = filterSites();
  root.innerHTML = "";

  resultSummary.textContent = `当前显示 ${sites.length} 个站点，共收录 ${state.allSites.length} 个。`;

  if (!sites.length) {
    const empty = document.createElement("div");
    empty.className = "empty-state";
    empty.textContent = "没有找到匹配结果，试试更短的关键词或切换分类。";
    root.appendChild(empty);
    return;
  }

  sites.forEach((site) => {
    const node = cardTemplate.content.cloneNode(true);
    node.querySelector(".section-pill").textContent = site.sectionName;
    node.querySelector(".meta-pill").textContent = site.region || "全国";
    node.querySelector("h2").textContent = site.name;
    node.querySelector(".site-desc").textContent = site.description;

    const siteLink = node.querySelector(".site-link");
    siteLink.href = site.url;

    const policyLink = node.querySelector(".policy-link");
    if (site.policyUrl) {
      policyLink.href = site.policyUrl;
    } else {
      policyLink.href = site.url;
      policyLink.textContent = "相关入口";
    }

    root.appendChild(node);
  });
}

async function loadData() {
  try {
    const response = await fetch(dataUrl);
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }

    const rawData = await response.json();
    state.allSites = normalizeSiteData(rawData);
    renderStats(state.allSites);
    buildFilters(state.allSites);
    renderCards();
  } catch (error) {
    resultSummary.textContent = "数据加载失败，请稍后刷新重试。";
    root.innerHTML = `<div class="empty-state">加载 JSON 失败：${error.message}</div>`;
  }
}

searchInput.addEventListener("input", (event) => {
  state.query = event.target.value;
  renderCards();
});

loadData();
