# Release Checklist

## A. 출시 전 필수
- `app/config.js` 값 확정
  - `siteUrl`: 배포 도메인
  - `kakaoJsKey`: 카카오 SDK 키
  - `enableAds`: 광고 온오프
  - `metricsEndpoint`: 분석 API 사용 시 엔드포인트
- `privacy.html`, `terms.html` 운영자 정보 실값 반영
- 모바일 실기기 점검(iOS Safari / Android Chrome)
  - 테스트 > 결과 > 진열대 > 히든엔딩 > 공유/이미지저장

## B. 공유/OG 점검
- `/share/:id` 진입 시 `result.html?id=:id&src=share`로 이동 확인
- 각 캐릭터 링크에서 OG 썸네일이 캐릭터별로 노출되는지 확인
- 공유 링크 유입자는 진열대 수집이 되지 않는지 확인

## C. 배포 점검
- Cloudflare Pages 빌드 출력 경로: `app`
- Functions 경로: `functions/`
- 첫 배포 후 강제 새로고침으로 캐시 확인
- 깨진 경로/이미지 없는지 확인(특히 `assets/characters/*`)

## D. 광고 점검
- 광고 슬롯 노출 위치 최종 확인
- 결과/모달 CTA와 충돌 없는지 확인
- 모바일에서 클릭 영역 겹침 여부 확인

## E. 런칭 직후 모니터링(24시간)
- 오류율(콘솔/네트워크)
- 테스트 시작 대비 완료율
- 결과 공유율/이미지저장률
- 언어별 이탈률

