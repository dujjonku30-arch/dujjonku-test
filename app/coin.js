const COIN_KEYS = {
  coins: "duzzonCoins",
  day: "duzzonDay",
  earned: "duzzonDailyEarned",
  collected: "duzzonCollected",
  userId: "duzzonUserId",
  referralLedger: "duzzonReferralLedger",
  referralClaims: "duzzonReferralClaims",
  activeRef: "duzzonActiveRef"
};

function getTodayKey() {
  return new Date().toLocaleDateString("en-CA");
}

function ensureCoinState() {
  const day = localStorage.getItem(COIN_KEYS.day);
  const today = getTodayKey();
  if (day !== today) {
    localStorage.setItem(COIN_KEYS.day, today);
    localStorage.setItem(COIN_KEYS.earned, "0");
  }
  if (localStorage.getItem(COIN_KEYS.coins) === null) {
    localStorage.setItem(COIN_KEYS.coins, "1");
  }
  if (!localStorage.getItem(COIN_KEYS.collected)) {
    localStorage.setItem(COIN_KEYS.collected, JSON.stringify([]));
  }
  if (!localStorage.getItem(COIN_KEYS.userId)) {
    const id = Math.random().toString(36).slice(2, 10);
    localStorage.setItem(COIN_KEYS.userId, id);
  }
  claimPendingReferralCredits();
}

function getCoins() {
  ensureCoinState();
  return parseInt(localStorage.getItem(COIN_KEYS.coins), 10) || 0;
}

function setCoins(value) {
  localStorage.setItem(COIN_KEYS.coins, String(Math.max(0, value)));
}

function spendCoin() {
  const coins = getCoins();
  if (coins <= 0) return false;
  setCoins(coins - 1);
  return true;
}

function canEarnCoin() {
  ensureCoinState();
  const earned = parseInt(localStorage.getItem(COIN_KEYS.earned), 10) || 0;
  return earned < 5;
}

function earnCoin() {
  if (!canEarnCoin()) return false;
  const coins = getCoins();
  const earned = parseInt(localStorage.getItem(COIN_KEYS.earned), 10) || 0;
  setCoins(coins + 1);
  localStorage.setItem(COIN_KEYS.earned, String(earned + 1));
  return true;
}

function getCollected() {
  ensureCoinState();
  return JSON.parse(localStorage.getItem(COIN_KEYS.collected) || "[]");
}

function addCollected(id) {
  const list = new Set(getCollected());
  list.add(id);
  localStorage.setItem(COIN_KEYS.collected, JSON.stringify(Array.from(list)));
}

function getUserId() {
  ensureCoinState();
  return localStorage.getItem(COIN_KEYS.userId);
}

function getReferralLedger() {
  return JSON.parse(localStorage.getItem(COIN_KEYS.referralLedger) || "{}");
}

function setReferralLedger(ledger) {
  localStorage.setItem(COIN_KEYS.referralLedger, JSON.stringify(ledger));
}

function getReferralClaims() {
  return JSON.parse(localStorage.getItem(COIN_KEYS.referralClaims) || "{}");
}

function setReferralClaims(claims) {
  localStorage.setItem(COIN_KEYS.referralClaims, JSON.stringify(claims));
}

function captureReferralFromUrl() {
  const params = new URLSearchParams(window.location.search);
  const ref = (params.get("ref") || "").trim();
  if (!ref) return;
  sessionStorage.setItem(COIN_KEYS.activeRef, ref);
}

function getActiveReferral() {
  return sessionStorage.getItem(COIN_KEYS.activeRef) || "";
}

function recordReferralTestCompletion() {
  const inviterId = getActiveReferral();
  if (!inviterId) return;
  const testerId = getUserId();
  if (!testerId || inviterId === testerId) return;

  const claims = getReferralClaims();
  const claimKey = `${inviterId}:${testerId}`;
  if (claims[claimKey]) return;
  claims[claimKey] = 1;
  setReferralClaims(claims);

  const ledger = getReferralLedger();
  ledger[inviterId] = (ledger[inviterId] || 0) + 2;
  setReferralLedger(ledger);
  sessionStorage.removeItem(COIN_KEYS.activeRef);
}

function claimPendingReferralCredits() {
  const userId = localStorage.getItem(COIN_KEYS.userId);
  if (!userId) return 0;
  const ledger = getReferralLedger();
  const pending = ledger[userId] || 0;
  if (!pending) return 0;
  setCoins(getCoins() + pending);
  delete ledger[userId];
  setReferralLedger(ledger);
  return pending;
}
