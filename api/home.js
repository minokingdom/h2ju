import { kv } from '@vercel/kv';
import fs from 'fs';
import path from 'path';

export default async function handler(req, res) {
  try {
    // 1. 템플릿 파일 읽기 (api/template.html 위치에서 읽습니다)
    const filePath = path.join(__dirname, 'template.html');
    let html = fs.readFileSync(filePath, 'utf8');

    // 3. 사이트 설정 가져오기 및 버전 계산 (강제 업데이트 포함)
    const config = await kv.get('h2ju_config');
    // 배포 시점마다 강제로 버전을 올리기 위해 하드코딩된 타임스탬프 추가
    const deployTag = '20260417-0140';
    const version = config && config.configDate ? `${config.configDate}-${deployTag}` : deployTag;

    // 4. 모든 자산 주소에 버전 번호(?v=...)를 전역적으로 강제 주입
    // 특정 태그를 찾는 정규식 대신, 파일 전체에서 해당 파일명을 찾아 치환하는 가장 확실한 방법을 사용합니다.
    const host = req.headers.host || 'xn--2e0b94dbtdp35a89nr3a.kr';
    const protocol = req.headers['x-forwarded-proto'] || 'https';
    const versionedThumb = `og-banner-final.jpg?v=${version}`;
    const versionedJS = `main.js?v=${version}`;
    const versionedCSS = `style.css?v=${version}`;

    html = html.split('thumb.jpg').join(versionedThumb);
    html = html.split('main.js').join(versionedJS);
    html = html.split('style.css').join(versionedCSS);

    // og:url 도 접속한 도메인에 맞춰 강제 치환
    const baseUrl = `${protocol}://${host}`;
    html = html.replace(
      /property="og:url" content="[^"]+"/g,
      `property="og:url" content="${baseUrl}/"`
    );

    // 5. 서버 캐시 무력화 (진단 기간 동안 항상 최신 HTML을 내보냅니다)
    res.setHeader('Content-Type', 'text/html; charset=utf-8');
    res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
    res.setHeader('Surrogate-Control', 'no-store'); // Vercel Edge 캐시도 전면 차단
    res.setHeader('Pragma', 'no-cache');
    res.setHeader('Expires', '0');
    
    return res.end(html);
  } catch (e) {
    console.error('Home Renderer Error:', e);
    // 에러 시 최소한의 화면이라도 서빙 (경로 재확인)
    try {
      const fallbackPath = path.join(__dirname, 'template.html');
      const html = fs.readFileSync(fallbackPath, 'utf8');
      return res.status(200).send(html);
    } catch (err) {
      console.error('Home API Error:', e);
      res.status(500).send(`
        <div style="padding:20px; font-family:sans-serif;">
          <h2 style="color:#f87171;">❌ 서버 내부 오류 발생</h2>
          <p>에러 내용: <strong>${e.message}</strong></p>
          <hr>
          <p>진단 정보:</p>
          <ul>
            <li>__dirname: ${__dirname}</li>
            <li>process.cwd(): ${process.cwd()}</li>
            <li>Node.js: ${process.version}</li>
          </ul>
          <p>이 화면이 보인다면, 위 정보를 복사해서 알려주세요!</p>
        </div>
      `);
    }
  }
}
