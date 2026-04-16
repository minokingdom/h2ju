import { kv } from '@vercel/kv';
import fs from 'fs';
import path from 'path';

export default async function handler(req, res) {
  try {
    // 1. index.html 파일 읽기
    const filePath = path.join(process.cwd(), 'index.html');
    let html = fs.readFileSync(filePath, 'utf8');

    // 3. 사이트 설정 가져오기 및 버전 계산 (강제 업데이트 포함)
    const config = await kv.get('h2ju_config');
    // 배포 시점마다 강제로 버전을 올리기 위해 하드코딩된 타임스탬프 추가
    const deployTag = '20260417-0140';
    const version = config && config.configDate ? `${config.configDate}-${deployTag}` : deployTag;

    // 4. 메타태그 도메인 및 주소를 현재 접속한 도메인(Host)에 맞춰 동적으로 치환
    const host = req.headers.host || 'xn--2e0b94dbtdp35a89nr3a.kr';
    const protocol = req.headers['x-forwarded-proto'] || 'https';
    const baseUrl = `${protocol}://${host}`;
    const versionedUrl = `${baseUrl}/thumb.jpg?v=${version}`;
    
    // index.html 내의 주요 자산(js, css)에도 캐시 버스터(?v=...) 적용
    html = html.replace(/src="main\.js"/g, `src="main.js?v=${version}"`);
    html = html.replace(/href="style\.css"/g, `href="style.css?v=${version}"`);

    // og:url 치환
    html = html.replace(
      /<meta property="og:url" content="[^"]+">/g,
      `<meta property="og:url" content="${baseUrl}/">`
    );

    // og:image / twitter:image 치환
    html = html.replace(
      /<meta property="og:image" content="[^"]+">/g, 
      `<meta property="og:image" content="${versionedUrl}">`
    );
    html = html.replace(
      /<meta name="twitter:image" content="[^"]+">/g, 
      `<meta name="twitter:image" content="${versionedUrl}">`
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
    // 에러 시 원본 index.html이라도 서빙
    try {
      const html = fs.readFileSync(path.join(process.cwd(), 'index.html'), 'utf8');
      return res.status(200).send(html);
    } catch(err) {
      return res.status(500).send('Internal Server Error');
    }
  }
}
