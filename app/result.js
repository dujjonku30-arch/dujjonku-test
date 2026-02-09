const params = new URLSearchParams(window.location.search);
const id = params.get("id") || "duzzon-vicky";
const source = params.get("src") || "";
const isEmbed = params.get("embed") === "1";
const baseResult = RESULTS[id] || RESULTS["duzzon-vicky"];
const currentLang = window.getDuzzonLang ? window.getDuzzonLang() : document.documentElement.lang || "ko";
const lang = (currentLang || "ko").split("-")[0];
const isKorean = lang === "ko";
const localizedPrimary = window.getCharacterI18n ? window.getCharacterI18n(id, lang) : null;

const localizedMeta = localizedPrimary
  ? {
      ...(localizedPrimary.name ? { name: localizedPrimary.name } : {}),
      ...(localizedPrimary.tagline ? { tagline: localizedPrimary.tagline } : {}),
      ...(Array.isArray(localizedPrimary.tags) ? { tags: localizedPrimary.tags } : {})
    }
  : {};

const result = {
  ...baseResult,
  ...localizedMeta,
  detail: {
    ...(baseResult.detail || {}),
    ...(!isKorean && localizedPrimary?.detail ? localizedPrimary.detail : {})
  }
};

const name = document.getElementById("result-name");
const tagline = document.getElementById("result-tagline");
const tags = document.getElementById("result-tags");
const summaryTitle = document.getElementById("result-summary-title");
const summaryBody = document.getElementById("result-summary-body");
const deepContainer = document.getElementById("result-deep");
const nutritionTitle = document.getElementById("result-nutrition-title");
const nutritionList = document.getElementById("result-nutrition-list");
const matchContainer = document.getElementById("result-match");
const resultImage = document.getElementById("result-image");
const detail = result.detail || {};
const dict = window.getDuzzonDict ? window.getDuzzonDict(currentLang) : null;

if (isEmbed) {
  document.body.classList.add("result-embed");
}

if (id === "secret-recipe") {
  localStorage.setItem("duzzonHiddenEndingViewed", "true");
}

const fallbackDetail = {
  summaryTitleText: "",
  summaryTitle: Array.isArray(baseResult?.detail?.summaryTitle) ? baseResult.detail.summaryTitle : [],
  summaryBody: Array.isArray(baseResult?.detail?.summaryBody) ? baseResult.detail.summaryBody : [],
  nutritionTitle: baseResult?.detail?.nutritionTitle || "",
  nutrition: Array.isArray(baseResult?.detail?.nutrition) ? baseResult.detail.nutrition : [],
  deep: Array.isArray(baseResult?.detail?.deep) ? baseResult.detail.deep : [],
  match: Array.isArray(baseResult?.detail?.match) ? baseResult.detail.match : []
};
const allowCustomDetail = true;
const baseMergedDetail = {
  ...fallbackDetail,
  ...(allowCustomDetail ? detail : {}),
  deep:
    allowCustomDetail && Array.isArray(detail.deep) && detail.deep.length ? detail.deep : fallbackDetail.deep,
  match:
    allowCustomDetail && Array.isArray(detail.match) && detail.match.length ? detail.match : fallbackDetail.match,
  nutrition:
    allowCustomDetail && Array.isArray(detail.nutrition) && detail.nutrition.length
      ? detail.nutrition
      : fallbackDetail.nutrition,
  summaryBody:
    allowCustomDetail && Array.isArray(detail.summaryBody) && detail.summaryBody.length
      ? detail.summaryBody
      : fallbackDetail.summaryBody
};

function escapeRegExp(value) {
  return String(value || "").replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function cleanupName(value) {
  return String(value || "")
    .replace(/[^\w가-힣\u3040-\u30ff\u4e00-\u9fff\u0600-\u06ff\s-]/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

function buildCharacterAliasPairs(locale) {
  const LEGACY_NAME_ALIASES = {
    "hard-crunch": ["Hard Crunch Brick Bar", "Hard-Crunch Dubai Jerky Bar"],
    "pistachio-ice": ["Pistachio Ice Goddess"],
    "mega-duzzon": ["Mega Dujjonku"],
    "zero-duzzon": ["ZERO Dujjonku"],
    "duzzon-magpie": ["Dujjon Magpie"],
    "melon-fry": ["Suspicious Melon Fry"],
    "pure-choco": ["Classic Dubai Choco"],
    "dubai-fire": ["Dubai Fire"],
    "chewy-gum": ["Chewy Dujjon Gum", "Chewy-Chewy Dujjon Gum"],
    "no-kadaif": ["Empty Wrapper"],
    "duzzon-vicky": ["Lucky Vicky Dujjonku"],
    "too-much": ["Too-Much Dujjonku"]
  };

  const pairs = [];
  Object.keys(RESULTS || {}).forEach((charId) => {
    const koName = RESULTS[charId]?.name || "";
    const localized = window.getCharacterI18n ? window.getCharacterI18n(charId, locale) : null;
    const localizedName = localized?.name || koName;
    const candidates = new Set([koName, cleanupName(koName)]);
    // 다른 언어 문자열이 섞여 들어온 경우도 모두 현재 locale 공식명으로 치환
    ["ko", "en", "ja", "zh", "ar"].forEach((langCode) => {
      const ref = window.getCharacterI18n ? window.getCharacterI18n(charId, langCode) : null;
      const refName = ref?.name || "";
      if (refName) {
        candidates.add(refName);
        candidates.add(cleanupName(refName));
      }
    });
    // 실사용에서 자주 섞여 쓰는 별칭 보정
    if (charId === "duzzon-vicky") {
      candidates.add("완전 두쫀키비키");
      candidates.add("완전 두쫀비키");
      candidates.add("두쫀키비키");
      candidates.add("두쫀비키");
    }
    if (charId === "k-arabian") {
      candidates.add("두바이로 떠난 K-아랍인");
      candidates.add("두바이로 떠난 k-아랍인");
      candidates.add("K-아랍인");
      candidates.add("k-아랍인");
    }
    if (charId === "no-kadaif") {
      candidates.add("카다이프 없는 두쫀껍데기");
      candidates.add("카다이프 없는 두껍데기");
    }
    const legacyAliases = LEGACY_NAME_ALIASES[charId] || [];
    legacyAliases.forEach((alias) => candidates.add(alias));
    candidates.forEach((source) => {
      if (!source || source === localizedName) return;
      pairs.push([source, localizedName]);
    });
  });
  // 긴 문자열부터 치환해 짧은 별칭이 먼저 먹히는 문제 방지
  return pairs.sort((a, b) => b[0].length - a[0].length);
}

function localizeCharacterNamesInText(text, aliasPairs) {
  let out = String(text || "");
  aliasPairs.forEach(([source, target]) => {
    const regex = new RegExp(escapeRegExp(source), "g");
    out = out.replace(regex, target);
  });
  return out;
}

function localizeCharacterRefsInDetail(detailInput, locale) {
  if (locale === "ko") return detailInput;
  const aliasPairs = buildCharacterAliasPairs(locale);
  const walk = (value) => {
    if (Array.isArray(value)) return value.map(walk);
    if (value && typeof value === "object") {
      const out = {};
      Object.keys(value).forEach((key) => {
        out[key] = walk(value[key]);
      });
      return out;
    }
    if (typeof value === "string") {
      return localizeCharacterNamesInText(value, aliasPairs);
    }
    return value;
  };
  return walk(detailInput);
}

const mergedDetail = localizeCharacterRefsInDetail(baseMergedDetail, lang);

function renderResultAfterTagsAd() {
  const adHost = document.getElementById("ad-result-after-tags");
  if (!adHost) return;
  const slotId = String(CONFIG?.adsenseSlots?.resultAfterTags || "").trim();
  if (!slotId) {
    adHost.innerHTML = "";
    return;
  }
  if (typeof window.DujjonkuAds?.renderSlot === "function") {
    window.DujjonkuAds.renderSlot(adHost, slotId, {
      adFormat: "auto",
      fullWidthResponsive: true
    });
  }
}

function normalizeDetailShape(input, fallback) {
  const out = input && typeof input === "object" ? { ...input } : {};
  const inputSummaryTitle = Array.isArray(out.summaryTitle) ? out.summaryTitle.filter(Boolean) : [];
  const fallbackSummaryTitle = Array.isArray(fallback.summaryTitle) ? fallback.summaryTitle.filter(Boolean) : [];
  const resolvedSummaryTitle = inputSummaryTitle.length ? inputSummaryTitle : fallbackSummaryTitle;
  const hasInputSummaryTitleText = typeof out.summaryTitleText === "string" && out.summaryTitleText.trim();
  const normalized = {
    summaryTitleText:
      hasInputSummaryTitleText
        ? out.summaryTitleText.trim()
        : resolvedSummaryTitle.length
          ? ""
          : fallback.summaryTitleText || "",
    summaryTitle: resolvedSummaryTitle,
    summaryBody: Array.isArray(out.summaryBody) && out.summaryBody.length ? out.summaryBody : fallback.summaryBody || [],
    nutritionTitle:
      typeof out.nutritionTitle === "string" && out.nutritionTitle.trim()
        ? out.nutritionTitle.trim()
        : fallback.nutritionTitle || "",
    nutrition: Array.isArray(out.nutrition) && out.nutrition.length ? out.nutrition : fallback.nutrition || [],
    deep: Array.isArray(out.deep) ? out.deep : fallback.deep || [],
    match: Array.isArray(out.match) ? out.match : fallback.match || []
  };
  return normalized;
}

async function fetchTranslatedDetail(targetLang, sourceDetail) {
  if (!CONFIG?.enableAI) return null;
  const cacheKey = `duzzon:detail:${targetLang}:${id}:v1`;
  try {
    const cached = localStorage.getItem(cacheKey);
    if (cached) {
      return JSON.parse(cached);
    }
  } catch (_error) {}

  try {
    let response = null;
    if (CONFIG.aiEndpoint) {
      response = await fetch(CONFIG.aiEndpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          task: "translate_detail",
          sourceLang: "ko",
          targetLang,
          preserveStructure: true,
          characterId: id,
          characterNameKo: baseResult?.name || "",
          payload: sourceDetail
        })
      });
    } else if (CONFIG.aiGeminiKey) {
      const model = CONFIG.aiGeminiModel || "gemini-1.5-flash";
      const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${CONFIG.aiGeminiKey}`;
      const prompt = [
        "Translate the following Korean JSON to target language.",
        "Rules:",
        "- Keep exact JSON structure and keys.",
        "- Preserve meme vibe and tone.",
        "- Do not add or remove fields.",
        "- Output ONLY valid JSON.",
        `Target language: ${targetLang}`,
        "",
        JSON.stringify(sourceDetail || {})
      ].join("\n");
      response = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }]
        })
      });
    } else {
      return null;
    }

    if (!response.ok) return null;
    const json = await response.json();
    let translated = json?.detail && typeof json.detail === "object" ? json.detail : null;
    if (!translated) {
      const text = json?.candidates?.[0]?.content?.parts?.[0]?.text || "";
      if (text) {
        const cleaned = text.replace(/```json|```/g, "").trim();
        translated = JSON.parse(cleaned);
      }
    }
    if (!translated) return null;
    try {
      localStorage.setItem(cacheKey, JSON.stringify(translated));
    } catch (_error) {}
    return translated;
  } catch (_error) {
    return null;
  }
}

name.textContent = result.name;
// 상단 배너 보조문구는 기본 tagline을 자동 노출하지 않고,
// 캐릭터별 상세 데이터(detail.bannerTagline)가 있을 때만 표시한다.
const bannerTagline = detail?.bannerTagline || "";
tagline.textContent = bannerTagline;
tagline.style.display = bannerTagline ? "block" : "none";

if (resultImage) {
  const localPath = `assets/characters/char-${id}.png`;
  resultImage.src = localPath;
  resultImage.alt = result.name || "";
  resultImage.draggable = false;
  resultImage.addEventListener("dragstart", (event) => event.preventDefault());
  resultImage.addEventListener("contextmenu", (event) => event.preventDefault());
  resultImage.addEventListener("error", () => {
    resultImage.src = "assets/characters/char-malang-baksak.png";
  });
}

function protectResultImages() {
  const protectedImages = Array.from(
    document.querySelectorAll(".result-hero-media img, #share-preview-image, #result-image")
  );
  protectedImages.forEach((img) => {
    if (!(img instanceof HTMLImageElement)) return;
    img.draggable = false;
    img.addEventListener("dragstart", (event) => event.preventDefault());
    img.addEventListener("contextmenu", (event) => event.preventDefault());
  });
}

function fillParagraphs(target, lines) {
  if (!target) return;
  target.innerHTML = "";
  (lines || []).forEach((line) => {
    const p = document.createElement("p");
    p.textContent = line;
    target.appendChild(p);
  });
}

function fillList(target, lines) {
  if (!target) return;
  target.innerHTML = "";
  (lines || []).forEach((line) => {
    const li = document.createElement("li");
    li.textContent = line;
    target.appendChild(li);
  });
}

result.tags.forEach((tag) => {
  const span = document.createElement("span");
  span.className = "result-tag";
  span.textContent = tag;
  if (tags.children.length % 2 === 1) {
    span.classList.add("is-accent");
  }
  tags.appendChild(span);
});

function renderDetailSections(detailData) {
  if (summaryTitle) {
    if (Array.isArray(detailData.summaryTitle) && detailData.summaryTitle.length) {
      summaryTitle.innerHTML = detailData.summaryTitle.join("<br>");
    } else if (detailData.summaryTitleText) {
      summaryTitle.textContent = detailData.summaryTitleText;
    } else {
      summaryTitle.textContent = dict?.summaryFallback || "말랑함 속에 확실한 선이 있는";
    }
  }
  if (summaryBody) {
    fillParagraphs(summaryBody, detailData.summaryBody);
  }

  if (nutritionTitle) {
    nutritionTitle.textContent = detailData.nutritionTitle || dict?.nutritionTitle || "🧪 리얼 성분 함량";
  }
  fillList(nutritionList, detailData.nutrition);

  if (deepContainer) {
    const deepList = detailData.deep;

    deepContainer.innerHTML = "";
    if (deepList.length === 0) {
      deepContainer.closest(".result-section")?.setAttribute("style", "display:none");
    } else {
      deepContainer.closest(".result-section")?.setAttribute("style", "");
    }
    deepList.forEach((item) => {
      const card = document.createElement("div");
      card.className = "result-card result-card-purple";

      const head = document.createElement("div");
      head.className = "result-card-head";

      const label = document.createElement("p");
      label.className = "result-card-label";
      label.textContent = item.label || "";

      const title = document.createElement("p");
      title.className = "result-card-title";
      title.textContent = item.title || "";

      const list = document.createElement("ul");
      list.className = "result-card-list";
      fillList(list, item.bullets);

      head.appendChild(label);
      head.appendChild(title);
      card.appendChild(head);
      card.appendChild(list);
      deepContainer.appendChild(card);
    });
  }

  if (matchContainer) {
    const matchList = detailData.match;

    matchContainer.innerHTML = "";
    if (matchList.length === 0) {
      matchContainer.closest(".result-section")?.setAttribute("style", "display:none");
    } else {
      matchContainer.closest(".result-section")?.setAttribute("style", "");
    }
    matchList.forEach((item, index) => {
      const card = document.createElement("div");
      const colorClass = index === 0 ? "result-card-blue" : "result-card-red";
      card.className = `result-card ${colorClass}`;

      const head = document.createElement("div");
      head.className = "result-card-head";

      const label = document.createElement("p");
      label.className = "result-card-label";
      label.textContent = item.label || "";

      const title = document.createElement("p");
      title.className = "result-card-title";
      title.textContent = item.title || "";

      const body = document.createElement("div");
      body.className = "result-card-body";
      fillParagraphs(body, item.body);

      head.appendChild(label);
      head.appendChild(title);
      card.appendChild(head);
      card.appendChild(body);
      matchContainer.appendChild(card);
    });
  }
}

function applySecretRecipeLayout(detailData) {
  document.body.classList.add("is-secret-recipe");

  const summaryTitleLines =
    Array.isArray(detailData.summaryTitle) && detailData.summaryTitle.length
      ? detailData.summaryTitle.filter(Boolean)
      : [result.tagline || ""];
  const summaryLines = Array.isArray(detailData.summaryBody) ? detailData.summaryBody.filter(Boolean) : [];

  if (summaryTitle) {
    summaryTitle.innerHTML = summaryTitleLines.join("<br>");
  }
  if (summaryBody) {
    fillParagraphs(summaryBody, summaryLines.slice(0, 1));
  }

  const deepSection = deepContainer?.closest(".result-section");
  const deepSectionTitle = deepSection?.querySelector(".result-section-title");
  const secondCardTitle =
    detailData?.deep?.[0]?.title || dict?.secretRecipeSecondTitle || "어떤 환경에서도 최적의 쿠키로 변신이 가능해요.";

  if (deepSectionTitle) deepSectionTitle.style.display = "none";
  if (deepSection) deepSection.style.display = "grid";
  if (deepContainer) {
    deepContainer.innerHTML = "";
    const card = document.createElement("div");
    card.className = "result-card result-card-green";

    const title = document.createElement("p");
    title.className = "result-card-title";
    title.textContent = secondCardTitle;

    const body = document.createElement("div");
    body.className = "result-card-body";
    fillParagraphs(body, summaryLines.slice(1, 2));

    card.appendChild(title);
    card.appendChild(body);
    deepContainer.appendChild(card);
  }

  const nutritionSection = nutritionList?.closest(".result-section");
  const nutritionSectionTitle = nutritionSection?.querySelector(".result-section-title");
  if (nutritionSectionTitle) {
    nutritionSectionTitle.style.display = "";
    nutritionSectionTitle.textContent = dict?.nutritionTitle || "📊 나의 영양 성분";
  }

  const matchSection = matchContainer?.closest(".result-section");
  if (matchSection) matchSection.style.display = "none";
}

const initialDetail = normalizeDetailShape(mergedDetail, fallbackDetail);
renderDetailSections(initialDetail);
if (id === "secret-recipe") {
  applySecretRecipeLayout(initialDetail);
}

// 기본값: 결과 해설은 런타임 AI 번역을 비활성화한다.
// 이유: 언어별 고정 문구/캐릭터명 일관성이 깨지는 문제 방지.
// 필요 시에만 CONFIG.aiTranslateDetailRuntime=true 로 명시적으로 켠다.
if (
  !isKorean &&
  CONFIG?.enableAI &&
  CONFIG?.aiTranslateDetail &&
  CONFIG?.aiTranslateDetailRuntime === true &&
  !localizedPrimary?.detail
) {
  fetchTranslatedDetail(lang, baseResult?.detail || null).then((translatedDetail) => {
    if (!translatedDetail) return;
    const localized = localizeCharacterRefsInDetail(translatedDetail, lang);
    const normalized = normalizeDetailShape(localized, initialDetail);
    renderDetailSections(normalized);
    if (id === "secret-recipe") {
      applySecretRecipeLayout(normalized);
    }
  });
}

if (id !== "secret-recipe") {
  const fromTest = source === "test";
  if (fromTest) {
    addCollected(id);
  }
  localStorage.removeItem("duzzonLastSource");
}
const collectedNow = getCollected();
if (collectedNow.length >= 19 && id !== "secret-recipe") {
  const secret = RESULTS["secret-recipe"];
  const main = document.querySelector("main");
  if (main) {
    const card = document.createElement("section");
    card.className = "card";
    const title = document.createElement("h2");
    title.textContent = secret?.name || "비밀 레시피: 두쫀쿠의 휴일";
    const desc = document.createElement("p");
    desc.textContent = secret?.tagline || "모든 캐릭터를 모았어요. 히든 엔딩이 열렸습니다.";
    card.appendChild(title);
    card.appendChild(desc);
    main.appendChild(card);
  }
}

const shareBtn = document.getElementById("share-btn");
const shareModal = document.getElementById("share-modal");
const shareNowBtn = document.getElementById("share-now");
const shareSaveBtn = document.getElementById("share-save");
const primaryBottomAction = document.querySelector(".result-actions .result-action");
const sharePreviewImage = document.getElementById("share-preview-image");
const sharePreviewName = document.getElementById("share-preview-name");
const sharePreviewTags = document.getElementById("share-preview-tags");
const copyBtn = document.getElementById("copy-btn");
const userId = getUserId();
const origin = window.location.origin === "null" ? "" : window.location.origin;
const baseUrl = CONFIG.siteUrl || origin || window.location.href.split("/result.html")[0];
const shareUrl = `${baseUrl}/share/${encodeURIComponent(id)}?ref=${userId}`;
function buildSharePreview() {
  if (sharePreviewImage) {
    sharePreviewImage.src = resultImage?.src || `assets/characters/char-${id}.png`;
    sharePreviewImage.alt = result.name || "";
  }
  if (sharePreviewName) {
    sharePreviewName.textContent = result.name || "";
  }
  if (sharePreviewTags) {
    sharePreviewTags.innerHTML = "";
    (result.tags || []).forEach((tag, idx) => {
      const span = document.createElement("span");
      span.className = "share-preview-tag";
      if (idx % 2 === 1) span.classList.add("is-accent");
      span.textContent = tag;
      sharePreviewTags.appendChild(span);
    });
  }
}

async function shareNow() {
  try {
    if (typeof navigator.share === "function") {
      await navigator.share({
        title: dict?.shareTitle || "두쫀쿠 성격 테스트",
        text: result.name || dict?.shareDesc || "나랑 두쫀쿠 성향 테스트 해볼래?",
        url: shareUrl
      });
      return;
    }

    if (navigator.clipboard && window.isSecureContext) {
      await navigator.clipboard.writeText(shareUrl);
      alert(dict?.linkCopied || "링크가 복사됐어요.");
      return;
    }

    const textarea = document.createElement("textarea");
    textarea.value = shareUrl;
    textarea.setAttribute("readonly", "true");
    textarea.style.position = "fixed";
    textarea.style.opacity = "0";
    document.body.appendChild(textarea);
    textarea.focus();
    textarea.select();
    const ok = document.execCommand("copy");
    textarea.remove();
    if (ok) {
      alert(dict?.linkCopied || "링크가 복사됐어요.");
      return;
    }

    window.prompt(dict?.copyLinkPrompt || "링크를 복사해 주세요:", shareUrl);
  } catch (_error) {
    try {
      window.prompt(dict?.copyLinkPrompt || "링크를 복사해 주세요:", shareUrl);
    } catch (_ignored) {}
  }
}

function wrapText(ctx, text, maxWidth) {
  const words = text.split(" ");
  const lines = [];
  let current = "";
  words.forEach((word) => {
    const next = current ? `${current} ${word}` : word;
    if (ctx.measureText(next).width > maxWidth) {
      if (current) lines.push(current);
      current = word;
    } else {
      current = next;
    }
  });
  if (current) lines.push(current);
  return lines;
}

function drawRoundedRect(ctx, x, y, w, h, r) {
  const radius = Math.min(r, w / 2, h / 2);
  ctx.beginPath();
  ctx.moveTo(x + radius, y);
  ctx.arcTo(x + w, y, x + w, y + h, radius);
  ctx.arcTo(x + w, y + h, x, y + h, radius);
  ctx.arcTo(x, y + h, x, y, radius);
  ctx.arcTo(x, y, x + w, y, radius);
  ctx.closePath();
}

function blobFromCanvas(canvas) {
  return new Promise((resolve) => {
    canvas.toBlob((blob) => resolve(blob || null), "image/png");
  });
}

function loadImageFromSrc(src) {
  return new Promise((resolve) => {
    if (!src) {
      resolve(null);
      return;
    }
    const img = new Image();
    // same-origin local assets are priority; CORS hint only.
    img.crossOrigin = "anonymous";
    img.onload = () => resolve(img);
    img.onerror = () => resolve(null);
    img.src = src;
    if (img.complete && img.naturalWidth > 0) {
      resolve(img);
    }
  });
}

async function loadShareImage() {
  const candidates = [
    `assets/characters/char-${id}.png`,
    "assets/characters/char-malang-baksak.png",
    sharePreviewImage?.currentSrc,
    sharePreviewImage?.src,
    resultImage?.currentSrc,
    resultImage?.src,
    "assets/characters/char-locked.png"
  ].filter(Boolean);

  for (const src of candidates) {
    // eslint-disable-next-line no-await-in-loop
    const img = await loadImageFromSrc(src);
    if (img && img.naturalWidth > 0 && img.naturalHeight > 0) {
      return img;
    }
  }
  return null;
}

function waitForImageReady(img, timeoutMs = 1800) {
  return new Promise((resolve) => {
    if (!img) {
      resolve(false);
      return;
    }
    if (img.complete && img.naturalWidth > 0) {
      resolve(true);
      return;
    }
    let done = false;
    const finish = (ok) => {
      if (done) return;
      done = true;
      img.removeEventListener("load", onLoad);
      img.removeEventListener("error", onError);
      resolve(ok);
    };
    const onLoad = () => finish(true);
    const onError = () => finish(false);
    img.addEventListener("load", onLoad);
    img.addEventListener("error", onError);
    setTimeout(() => finish(img.complete && img.naturalWidth > 0), timeoutMs);
  });
}

function downloadDataUrl(dataUrl, filename) {
  const link = document.createElement("a");
  link.href = dataUrl;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  link.remove();
}

async function saveShareImage() {
  if (!sharePreviewImage?.src && !resultImage?.src) return;
  await waitForImageReady(sharePreviewImage);
  await waitForImageReady(resultImage);
  try {
    if (document.fonts && document.fonts.ready) {
      await document.fonts.ready;
    }
  } catch (_error) {}

  const canvas = document.createElement("canvas");
  const width = 1080;
  const height = 1920;
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext("2d");

  const bannerTop = 1020;
  ctx.fillStyle = "#ffffff";
  ctx.fillRect(0, 0, width, bannerTop);
  ctx.fillStyle = "#e7df8a";
  ctx.fillRect(0, bannerTop, width, height - bannerTop);

  // 항상 로컬 캐릭터 원본을 우선 로드해서 빈 화면 저장을 방지한다.
  let img = null;
  img = await loadShareImage();
  if (!img && sharePreviewImage && sharePreviewImage.complete && sharePreviewImage.naturalWidth > 0) {
    img = sharePreviewImage;
  }
  if (!img && resultImage && resultImage.complete && resultImage.naturalWidth > 0) {
    img = resultImage;
  }

  if (img && img.naturalWidth > 0 && img.naturalHeight > 0) {
    const maxImgW = 760;
    const maxImgH = 760;
    const scale = Math.min(maxImgW / img.naturalWidth, maxImgH / img.naturalHeight, 1);
    const imgW = img.naturalWidth * scale;
    const imgH = img.naturalHeight * scale;
    const imgX = (width - imgW) / 2;
    const imgY = (bannerTop - imgH) / 2 - 10;
    ctx.drawImage(img, imgX, Math.max(60, imgY), imgW, imgH);
  } else {
    alert(dict?.saveImageNoGraphic || "이미지를 불러오지 못했어요. 잠시 후 다시 시도해 주세요.");
    return;
  }

  ctx.fillStyle = "#66371b";
  ctx.textAlign = "center";

  ctx.font = '56px "Ownglyph_Dailyokja", "KCC-Murukmuruk", sans-serif';
  ctx.fillText(dict?.resultLead || "나는......", width / 2, bannerTop + 92);

  ctx.font = '44px "KCC-Murukmuruk", "CookieRunOTF", sans-serif';
  const nameLines = wrapText(ctx, result.name || "", 980);
  let nameY = bannerTop + 190;
  nameLines.forEach((line) => {
    ctx.fillText(line, width / 2, nameY);
    nameY += 58;
  });

  const boxWidth = 860;
  const boxX = (width - boxWidth) / 2;
  const tagFont = '48px "KCC-Murukmuruk", "CookieRunOTF", sans-serif';
  ctx.font = tagFont;
  const tags = result.tags || [];
  const tagPadding = 24;
  const lineHeight = 68;
  const lines = [];
  let current = [];
  let currentWidth = 0;
  tags.forEach((tag) => {
    const tagWidth = ctx.measureText(tag).width + 32;
    if (currentWidth + tagWidth > boxWidth - tagPadding * 2 && current.length) {
      lines.push(current);
      current = [tag];
      currentWidth = tagWidth;
    } else {
      current.push(tag);
      currentWidth += tagWidth;
    }
  });
  if (current.length) lines.push(current);

  const boxHeight = tagPadding * 2 + lines.length * lineHeight;
  const boxY = nameY + 12;
  ctx.fillStyle = "#66371b";
  drawRoundedRect(ctx, boxX, boxY, boxWidth, boxHeight, 36);
  ctx.fill();
  ctx.lineWidth = 4;
  ctx.strokeStyle = "#1f1f1f";
  ctx.stroke();

  let tagY = boxY + tagPadding + 8;
  lines.forEach((line, lineIdx) => {
    let tagX = boxX + tagPadding;
    line.forEach((tag, idx) => {
      const accent = (lineIdx + idx) % 2 === 1;
      ctx.fillStyle = accent ? "#e3d200" : "#e8d2b8";
      ctx.textAlign = "left";
      ctx.font = tagFont;
      ctx.fillText(tag, tagX, tagY);
      tagX += ctx.measureText(tag).width + 32;
    });
    tagY += lineHeight;
  });

  const filename = `${id}-duzzonku.png`;
  try {
    const blob = await blobFromCanvas(canvas);
    if (blob) {
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = filename;
      link.rel = "noopener";
      document.body.appendChild(link);
      link.click();
      link.remove();
      URL.revokeObjectURL(url);
      return;
    }
  } catch (_error) {}

  try {
    const dataUrl = canvas.toDataURL("image/png");
    downloadDataUrl(dataUrl, filename);
    return;
  } catch (_error) {
    alert(dict?.saveImageFailed || "이미지 저장에 실패했어요. 다시 시도해 주세요.");
  }
}

if (id !== "secret-recipe") {
  shareBtn?.addEventListener("click", () => {
    buildSharePreview();
    protectResultImages();
    if (typeof openModal === "function") {
      openModal("share-modal");
    } else if (shareModal) {
      shareModal.classList.add("open");
    }
  });
}

if (id === "secret-recipe") {
  if (primaryBottomAction) {
    primaryBottomAction.textContent = dict?.shareNow || "공유";
    primaryBottomAction.setAttribute("href", "#");
    primaryBottomAction.onclick = async (event) => {
      event.preventDefault();
      await shareNow();
    };
  }
  if (shareBtn) {
    shareBtn.textContent = dict?.shareSave || "이미지 저장";
    shareBtn.onclick = async () => {
      buildSharePreview();
      await saveShareImage();
    };
  }
}

shareModal?.addEventListener("click", (event) => {
  if (event.target === shareModal) {
    if (typeof closeModal === "function") {
      closeModal("share-modal");
    } else {
      shareModal.classList.remove("open");
    }
  }
});

shareNowBtn?.addEventListener("click", async () => {
  try {
    await shareNow();
  } catch (_error) {
    alert(dict?.shareOpenFailed || "공유를 열 수 없어 링크 복사 방식으로 전환합니다.");
    try {
      await navigator.clipboard.writeText(shareUrl);
      alert(dict?.linkCopied || "링크가 복사됐어요.");
    } catch (_ignored) {
      window.prompt(dict?.copyLinkPrompt || "링크를 복사해 주세요:", shareUrl);
    }
  }
});

shareSaveBtn?.addEventListener("click", async () => {
  buildSharePreview();
  protectResultImages();
  await saveShareImage();
});

copyBtn?.addEventListener("click", async () => {
  await navigator.clipboard.writeText(shareUrl);
  alert(dict?.linkCopied || "링크가 복사됐어요.");
});

document.addEventListener("duzzon:lang", (event) => {
  const nextLang = event?.detail?.lang || (window.getDuzzonLang ? window.getDuzzonLang() : document.documentElement.lang);
  if (nextLang && nextLang !== currentLang) {
    window.location.reload();
  }
});

window.duzzonResultShareNow = async function duzzonResultShareNow() {
  await shareNow();
};

window.duzzonResultSaveImage = async function duzzonResultSaveImage() {
  buildSharePreview();
  protectResultImages();
  await saveShareImage();
};

protectResultImages();
renderResultAfterTagsAd();
