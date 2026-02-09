const RESULT_META = {
  "malang-baksak": { name: "말랑말랑 바삭한 두쫀쿠", desc: "나의 두쫀쿠 결과를 확인해보세요." },
  "duzzon-vicky": { name: "완전 두쫀비키자냐?🍀", desc: "나의 두쫀쿠 결과를 확인해보세요." },
  "duzzon-hero": { name: "날아라 두쫀쿠맨", desc: "나의 두쫀쿠 결과를 확인해보세요." },
  "no-kadaif": { name: "카다이프 없는 두쫀껍데기", desc: "나의 두쫀쿠 결과를 확인해보세요." },
  "pure-choco": { name: "순정 두바이 초코🍫", desc: "나의 두쫀쿠 결과를 확인해보세요." },
  "zero-duzzon": { name: "ZERO 두쫀쿠", desc: "나의 두쫀쿠 결과를 확인해보세요." },
  "too-much": { name: "투머치쫀쿠 (나때는 말이야)", desc: "나의 두쫀쿠 결과를 확인해보세요." },
  "melon-fry": { name: "수상한 멜론튀김", desc: "나의 두쫀쿠 결과를 확인해보세요." },
  "mega-duzzon": { name: "대왕 두쫀쿠", desc: "나의 두쫀쿠 결과를 확인해보세요." },
  "chewy-gum": { name: "질겅질겅 두쫀껌", desc: "나의 두쫀쿠 결과를 확인해보세요." },
  "pistachio-ice": { name: "피스타치오 여신상", desc: "나의 두쫀쿠 결과를 확인해보세요." },
  "durian-fact": { name: "두(리안)쫀쿠", desc: "나의 두쫀쿠 결과를 확인해보세요." },
  "k-arabian": { name: "두바이로 떠난 k-아랍인", desc: "나의 두쫀쿠 결과를 확인해보세요." },
  "duzzon-magpie": { name: "두쫀마귀🖤", desc: "나의 두쫀쿠 결과를 확인해보세요." },
  "dubai-fire": { name: "🔥두바이불닭🔥", desc: "나의 두쫀쿠 결과를 확인해보세요." },
  "hard-crunch": { name: "개딱딱 두바이 퍽퍽 강정", desc: "나의 두쫀쿠 결과를 확인해보세요." },
  "burst-duzzon": { name: "💥터져버린 두쫀쿠", desc: "나의 두쫀쿠 결과를 확인해보세요." },
  "empty-jar": { name: "비어버린 용기", desc: "나의 두쫀쿠 결과를 확인해보세요." },
  "unfinished-mix": { name: "🥣 미완성 두쫀쿠 재료들", desc: "나의 두쫀쿠 결과를 확인해보세요." },
  "secret-recipe": { name: "[비밀 레시피: 두쫀머신]", desc: "히든엔딩이 해금되었습니다." }
};

function escapeHtml(value) {
  return String(value || "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

export async function onRequestGet(context) {
  const { params, request } = context;
  const id = typeof params?.id === "string" ? params.id : "";
  const meta = RESULT_META[id] || { name: "두쫀쿠 성격 테스트", desc: "나의 두쫀쿠 결과를 확인해보세요." };
  const url = new URL(request.url);
  const origin = url.origin;
  const imagePath = id ? `/assets/characters/char-${id}.png` : "/assets/characters/main-thumb.png";
  const imageUrl = `${origin}${imagePath}`;
  const targetUrl = `${origin}/result.html?id=${encodeURIComponent(id)}&src=share`;
  const title = `${meta.name} | 두쫀쿠 성격 테스트`;
  const description = meta.desc || "나의 두쫀쿠 결과를 확인해보세요.";

  const html = `<!doctype html>
<html lang="ko">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width,initial-scale=1" />
    <title>${escapeHtml(title)}</title>
    <meta name="description" content="${escapeHtml(description)}" />
    <meta property="og:type" content="website" />
    <meta property="og:site_name" content="두쫀쿠 성격 테스트" />
    <meta property="og:title" content="${escapeHtml(title)}" />
    <meta property="og:description" content="${escapeHtml(description)}" />
    <meta property="og:image" content="${escapeHtml(imageUrl)}" />
    <meta property="og:url" content="${escapeHtml(targetUrl)}" />
    <meta name="twitter:card" content="summary_large_image" />
    <meta name="twitter:title" content="${escapeHtml(title)}" />
    <meta name="twitter:description" content="${escapeHtml(description)}" />
    <meta name="twitter:image" content="${escapeHtml(imageUrl)}" />
    <meta http-equiv="refresh" content="0; url=${escapeHtml(targetUrl)}" />
    <script>window.location.replace(${JSON.stringify(targetUrl)});</script>
  </head>
  <body>
    <p>결과 페이지로 이동 중입니다. <a href="${escapeHtml(targetUrl)}">이동하기</a></p>
  </body>
</html>`;

  return new Response(html, {
    headers: {
      "content-type": "text/html; charset=UTF-8",
      "cache-control": "public, max-age=300"
    }
  });
}
