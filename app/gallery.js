const GALLERY_ITEMS = [
  { id: "malang-baksak", label: "말랑말랑 바삭한" },
  { id: "duzzon-vicky", label: "완전 두쫀비키" },
  { id: "duzzon-hero", label: "날아라 두쫀쿠맨" },
  { id: "no-kadaif", label: "카다이프 없는 두" },
  { id: "pure-choco", label: "순정 두바이 초코" },
  { id: "zero-duzzon", label: "ZERO 두쫀쿠" },
  { id: "too-much", label: "투머치쫀쿠" },
  { id: "melon-fry", label: "수상한 멜론튀김" },
  { id: "mega-duzzon", label: "대왕 두쫀쿠" },
  { id: "chewy-gum", label: "질겅질겅 두쫀껌" },
  { id: "pistachio-ice", label: "피스타치오 여신상" },
  { id: "durian-fact", label: "두(리안)쫀쿠" },
  { id: "k-arabian", label: "두바이로 떠난 K-" },
  { id: "duzzon-magpie", label: "두쫀마귀" },
  { id: "dubai-fire", label: "두바이불닭" },
  { id: "hard-crunch", label: "개딱딱 두바이 펙" },
  { id: "burst-duzzon", label: "터져버린 두쫀쿠" },
  { id: "empty-jar", label: "비어버린 용기" },
  { id: "unfinished-mix", label: "미완성 두쫀쿠" }
];

let activeResultId = null;
const HIDDEN_ENDING_VIEWED_KEY = "duzzonHiddenEndingViewed";

function hasViewedHiddenEnding() {
  return localStorage.getItem(HIDDEN_ENDING_VIEWED_KEY) === "true";
}

function markHiddenEndingViewed() {
  localStorage.setItem(HIDDEN_ENDING_VIEWED_KEY, "true");
}

function getLocalizedCharacterName(id, fallback) {
  const lang = window.getDuzzonLang ? window.getDuzzonLang() : document.documentElement.lang || "ko";
  const localized = window.getCharacterI18n ? window.getCharacterI18n(id, lang) : null;
  return localized?.name || RESULTS?.[id]?.name || fallback || "";
}

function parseMetricNumber(value) {
  const n = Number(value);
  return Number.isFinite(n) && n >= 0 ? n : 0;
}

function formatDiscoveryRate(dict, rate) {
  const safeRate = Math.max(0, Math.min(100, rate));
  const rateText = `${safeRate.toFixed(2)}%`;
  const template = dict?.galleryRate || "두쫀쿠 발견 확률:00%";
  return template.replace("00%", rateText);
}

async function fetchDiscoveryMetrics(characterId) {
  if (!CONFIG?.metricsEndpoint) return null;
  try {
    const base = new URL(CONFIG.metricsEndpoint, window.location.href);
    base.searchParams.set("type", "discovery-rate");
    base.searchParams.set("characterId", characterId);
    const response = await fetch(base.toString(), { cache: "no-store" });
    if (!response.ok) return null;
    const data = await response.json();
    if (!data || typeof data !== "object") return null;
    return {
      totalParticipants: parseMetricNumber(data.totalParticipants),
      characterOpens: parseMetricNumber(data.characterOpens)
    };
  } catch (_error) {
    return null;
  }
}

async function updateLockedRateText(itemId) {
  const rateEl = document.getElementById("gallery-locked-rate");
  if (!rateEl) return;
  const dict = window.getDuzzonDict ? window.getDuzzonDict(document.documentElement.lang || "ko") : null;
  const threshold = Math.max(1, Number(CONFIG?.discoveryTrafficThreshold) || 1000);
  const metrics = await fetchDiscoveryMetrics(itemId);

  if (!metrics || metrics.totalParticipants < threshold) {
    rateEl.style.display = "none";
    rateEl.textContent = "";
    return;
  }

  const rate = metrics.totalParticipants > 0 ? (metrics.characterOpens / metrics.totalParticipants) * 100 : 0;
  rateEl.style.display = "";
  rateEl.textContent = formatDiscoveryRate(dict, rate);
}

function getResultUrl(characterId) {
  return `result.html?id=${encodeURIComponent(characterId)}&src=gallery`;
}

function getResultEmbedUrl(characterId) {
  return `${getResultUrl(characterId)}&embed=1`;
}

function openResultModal(characterId) {
  const modal = document.getElementById("gallery-result-modal");
  const frame = document.getElementById("gallery-result-frame");
  if (!modal || !frame) {
    window.location.href = getResultUrl(characterId);
    return;
  }
  activeResultId = characterId;
  if (characterId === "secret-recipe") {
    markHiddenEndingViewed();
  }
  frame.src = getResultEmbedUrl(characterId);
  if (typeof openModal === "function") {
    openModal("gallery-result-modal");
  } else {
    modal.classList.add("open");
  }
}

function updateGalleryCompletionBanner(dict, collectedCount, hiddenViewed) {
  const page = document.querySelector(".page.full");
  const sub = document.querySelector(".banner [data-i18n='gallerySub']");
  const completeBanner = document.getElementById("gallery-complete-banner");
  const isComplete = collectedCount >= 19;
  const showComplete = isComplete && hiddenViewed;

  if (sub) {
    sub.textContent = showComplete ? dict?.gallerySubComplete || "100% 수집 완료" : dict?.gallerySub || "";
  }
  if (completeBanner) {
    completeBanner.setAttribute("aria-hidden", showComplete ? "false" : "true");
  }
  if (page) {
    page.classList.toggle("is-hidden-complete", showComplete);
  }
}

function cleanupResultModalFrame() {
  const frame = document.getElementById("gallery-result-frame");
  if (frame) frame.src = "about:blank";
  activeResultId = null;
}

async function fallbackShareResult(characterId) {
  const dict = window.getDuzzonDict ? window.getDuzzonDict(document.documentElement.lang || "ko") : null;
  const origin = window.location.origin === "null" ? "" : window.location.origin;
  const baseUrl = CONFIG.siteUrl || origin || window.location.href.split("/gallery.html")[0];
  const shareUrl = `${baseUrl}/share/${encodeURIComponent(characterId)}?ref=${getUserId()}`;

  try {
    if (typeof navigator.share === "function") {
      const localized = window.getCharacterI18n
        ? window.getCharacterI18n(characterId, document.documentElement.lang || "ko")
        : null;
      await navigator.share({
        title: dict?.shareTitle || "두쫀쿠 성격 테스트",
        text: localized?.name || dict?.shareDesc || "나랑 두쫀쿠 성향 테스트 해볼래?",
        url: shareUrl
      });
      return;
    }
    if (navigator.clipboard && window.isSecureContext) {
      await navigator.clipboard.writeText(shareUrl);
      alert(dict?.linkCopied || "링크가 복사됐어요.");
      return;
    }
    window.prompt(dict?.copyLinkPrompt || "링크를 복사해 주세요:", shareUrl);
  } catch (_error) {
    window.prompt(dict?.copyLinkPrompt || "링크를 복사해 주세요:", shareUrl);
  }
}

function setupResultModalActions() {
  const modal = document.getElementById("gallery-result-modal");
  const frame = document.getElementById("gallery-result-frame");
  const shareBtn = document.getElementById("gallery-result-share");
  const saveBtn = document.getElementById("gallery-result-save");
  const closeBtn = document.querySelector("[data-modal-close='gallery-result-modal']");

  shareBtn?.addEventListener("click", async () => {
    const fn = frame?.contentWindow?.duzzonResultShareNow;
    if (typeof fn === "function") {
      await fn();
      return;
    }
    if (activeResultId) await fallbackShareResult(activeResultId);
  });

  saveBtn?.addEventListener("click", async () => {
    const fn = frame?.contentWindow?.duzzonResultSaveImage;
    if (typeof fn === "function") {
      await fn();
      return;
    }
    const dict = window.getDuzzonDict ? window.getDuzzonDict(document.documentElement.lang || "ko") : null;
    alert(dict?.saveImageFailed || "이미지 저장에 실패했어요. 다시 시도해 주세요.");
  });

  closeBtn?.addEventListener("click", () => {
    setTimeout(cleanupResultModalFrame, 0);
  });

  modal?.addEventListener("click", (event) => {
    if (event.target === modal) {
      setTimeout(cleanupResultModalFrame, 0);
    }
  });

  document.addEventListener("keydown", (event) => {
    if (event.key !== "Escape") return;
    if (modal?.classList.contains("open")) {
      setTimeout(cleanupResultModalFrame, 0);
    }
  });
}

function renderGallery() {
  const grid = document.getElementById("gallery-grid");
  if (!grid) return;

  const collected = new Set(getCollected());
  const hiddenViewed = hasViewedHiddenEnding();
  grid.innerHTML = "";
  const dict = window.getDuzzonDict ? window.getDuzzonDict(document.documentElement.lang || "ko") : null;
  updateGalleryCompletionBanner(dict, collected.size, hiddenViewed);

  GALLERY_ITEMS.forEach((item) => {
    const tile = document.createElement("div");
    tile.className = "tile";
    const thumb = document.createElement("div");
    thumb.className = "tile-thumb";
    const img = document.createElement("img");
    img.alt = "";
    img.src = `assets/characters/char-${item.id}.png`;
    img.addEventListener("error", () => {
      img.src = "assets/characters/char-locked.png";
    });
    thumb.appendChild(img);

    const label = document.createElement("div");
    label.className = "tile-label";
    label.textContent = getLocalizedCharacterName(item.id, item.label);

    if (collected.has(item.id)) {
      tile.classList.add("unlocked");
      tile.appendChild(thumb);
      tile.appendChild(label);
      tile.addEventListener("click", () => {
        openResultModal(item.id);
      });
    } else {
      tile.classList.add("locked");
      img.src = "assets/characters/char-locked.png";
      tile.appendChild(thumb);
      tile.appendChild(label);
      tile.addEventListener("click", () => {
        openLockedModal(item);
      });
    }
    grid.appendChild(tile);
  });

  const hidden = document.createElement("div");
  hidden.className = "tile hidden";
  const hiddenLabel = dict?.hiddenEnding || "히든엔딩";
  if (collected.size >= 19) {
    hidden.classList.add("unlocked");
    const thumb = document.createElement("div");
    thumb.className = "tile-thumb";
    const img = document.createElement("img");
    img.alt = "";
    img.src = hiddenViewed ? "assets/characters/char-secret-recipe.png" : "assets/characters/char-secret-thumb.png";
    thumb.appendChild(img);
    const label = document.createElement("div");
    label.className = "tile-label";
    label.textContent = hiddenViewed ? getLocalizedCharacterName("secret-recipe", hiddenLabel) : hiddenLabel;
    hidden.appendChild(thumb);
    hidden.appendChild(label);
    if (hiddenViewed) {
      hidden.classList.add("viewed");
    } else {
      const action = document.createElement("button");
      action.className = "tile-action";
      action.textContent = dict?.galleryOpenAction || "열람하기";
      action.addEventListener("click", (event) => {
        event.stopPropagation();
        openResultModal("secret-recipe");
      });
      hidden.appendChild(action);
    }
    hidden.addEventListener("click", () => {
      openResultModal("secret-recipe");
    });
  } else {
    hidden.classList.add("locked");
    const thumb = document.createElement("div");
    thumb.className = "tile-thumb";
    const img = document.createElement("img");
    img.alt = "";
    img.src = "assets/characters/char-secret-thumb.png";
    thumb.appendChild(img);
    const label = document.createElement("div");
    label.className = "tile-label";
    label.textContent = hiddenLabel;
    hidden.appendChild(thumb);
    hidden.appendChild(label);
    hidden.addEventListener("click", () => {
      openLockedModal({ id: "secret-recipe", label: hiddenLabel });
    });
  }
  grid.appendChild(hidden);

  // 마지막 행은 그리드 외곽선이 이미 있으므로 타일 하단선 제거(두꺼워 보이는 현상 방지)
  const tiles = Array.from(grid.querySelectorAll(".tile"));
  const cols = 3;
  const lastRowCount = tiles.length % cols || cols;
  const lastRowStart = tiles.length - lastRowCount;
  tiles.forEach((tile, idx) => {
    tile.classList.toggle("tile-last-row", idx >= lastRowStart);
  });
}

function openLockedModal(item) {
  const modal = document.getElementById("gallery-locked-modal");
  const nameEl = document.getElementById("gallery-locked-name");
  const descEl = document.getElementById("gallery-locked-desc");
  const imgEl = document.getElementById("gallery-locked-image");
  const rateEl = document.getElementById("gallery-locked-rate");
  const goEl = document.getElementById("gallery-locked-go");
  const laterEl = modal?.querySelector("[data-modal-close='gallery-locked-modal']");
  const actionsEl = modal?.querySelector(".gallery-modal-actions");
  const dict = window.getDuzzonDict ? window.getDuzzonDict(document.documentElement.lang || "ko") : null;
  const isSecret = item.id === "secret-recipe";

  if (goEl) {
    goEl.onclick = null;
  }

  if (isSecret) {
    if (nameEl) nameEl.textContent = dict?.hiddenEnding || "히든엔딩";
    if (descEl) {
      descEl.textContent =
        dict?.galleryHiddenLockedDesc ||
        "아직 베일에 싸여있어요.\n모든 두쫀쿠를 모으면 열린다는 소문이..?";
    }
    if (imgEl) {
      imgEl.src = "assets/characters/char-secret-thumb.png";
    }
    if (rateEl) {
      rateEl.style.display = "none";
      rateEl.textContent = "";
    }
    if (goEl) {
      goEl.textContent = dict?.galleryConfirmAction || "확인";
      goEl.href = "#";
      goEl.onclick = (event) => {
        event.preventDefault();
        if (typeof closeModal === "function") {
          closeModal("gallery-locked-modal");
        }
      };
    }
    if (actionsEl) actionsEl.classList.add("is-single-confirm");
    if (laterEl) laterEl.style.display = "none";
  } else {
    if (nameEl) {
      nameEl.textContent = getLocalizedCharacterName(item.id, item.label);
    }
    if (descEl) descEl.textContent = dict?.galleryLockedDesc || "테스트를 통해 발견해보세요!";
    if (imgEl) {
      imgEl.src = "assets/characters/char-locked.png";
    }
    if (goEl) {
      goEl.textContent = dict?.galleryFindAction || "테스트 통해 찾으러가기";
      goEl.href = "test.html";
    }
    if (actionsEl) actionsEl.classList.remove("is-single-confirm");
    if (laterEl) laterEl.style.display = "";
    updateLockedRateText(item.id);
  }

  if (modal) modal.classList.add("open");
}

function openSecretModal() {
  const modal = document.getElementById("gallery-secret-modal");
  if (modal) modal.classList.add("open");
}

function maybeShowSecretModal() {
  const collected = new Set(getCollected());
  if (collected.size >= 19) {
    const seen = localStorage.getItem("duzzonSecretSeen");
    if (!seen) {
      openSecretModal();
    }
  }
}

document.addEventListener("click", (event) => {
  const target = event.target;
  if (target && target.matches("[data-modal-close='gallery-secret-modal']")) {
    localStorage.setItem("duzzonSecretSeen", "true");
  }
  if (target && target.id === "gallery-secret-open") {
    event.preventDefault();
    localStorage.setItem("duzzonSecretSeen", "true");
    markHiddenEndingViewed();
    if (typeof closeModal === "function") {
      closeModal("gallery-secret-modal");
    }
    openResultModal("secret-recipe");
  }
});

document.addEventListener("DOMContentLoaded", setupResultModalActions);
document.addEventListener("DOMContentLoaded", renderGallery);
document.addEventListener("DOMContentLoaded", maybeShowSecretModal);
document.addEventListener("duzzon:lang", renderGallery);
