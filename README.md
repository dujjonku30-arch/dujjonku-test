# 두쫀쿠 테스트 MVP

## 실행 방법 (로컬)
- 브라우저에서 `/app/index.html` 파일을 직접 열면 됩니다.

## Cloudflare Pages 배포 (권장)
### 1) 최초 프로젝트 생성
1. Cloudflare Dashboard > `Workers & Pages` > `Create` > `Pages` 선택
2. Git 저장소 연결
3. 설정
- Framework preset: `None`
- Build command: (비움)
- Build output directory: `app`
4. Deploy

### 2) Functions 라우팅
- 이 저장소는 `functions/share/[id].js`를 사용합니다.
- 공유 링크 `/share/:id` 요청 시 결과별 OG 메타를 동적으로 내려주고 `result.html?id=...&src=share`로 리다이렉트됩니다.

### 3) 배포 후 필수 확인
1. `https://도메인/share/chewy-gum` 접속 시 결과 페이지로 이동되는지
2. 카카오/메신저 미리보기에서 썸네일이 해당 캐릭터 이미지로 뜨는지
3. 공유 링크 유입으로는 진열대 수집이 되지 않는지(`src=share`)

## wrangler CLI 배포 (선택)
로컬 Node/wrangler가 설치된 경우:
1. `wrangler whoami`
2. `wrangler pages project create duzzonku-test` (최초 1회)
3. `wrangler pages deploy app --project-name duzzonku-test --branch main`

배포된 주소가 곧 서비스 URL입니다.
