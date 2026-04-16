import { kv } from '@vercel/kv';
import fs from 'fs';
import path from 'path';

export default async function handler(req, res) {
  const rootDir = process.cwd();
  const htmlPath = path.join(rootDir, 'index.html');
  
  try {
    let html = fs.readFileSync(htmlPath, 'utf8');
    
    // 사용자의 통찰대로 '고정 주소'를 사용하여 카카오톡의 신뢰도를 높입니다.
    // 1. KV에서 최신 설정 날짜를 가져와 캐시 무력화(Version) 주소 생성
    let configDate = Date.now();
    try {
      const config = await kv.get('h2ju_config');
      if (config && config.configDate) {
        configDate = config.configDate;
      }
    } catch (kvErr) {
      console.error('KV Read Error in home:', kvErr.message);
    }

    // 현재 요청의 호스트(도메인)와 프로토콜을 동적으로 가져옵니다.
    const host = req.headers.host || 'xn--2e0b94dbtdp35a89nr3a.kr';
    const protocol = req.headers['x-forwarded-proto'] || 'https';

    // 최종 승리 전략: 사진 이름을 'og-banner-final.jpg'로 변경하여 카톡 캐시 무력화
    const versionedOgImage = `${protocol}://${host}/og-banner-final.jpg?v=${configDate}`;

    html = html.replace(
      /<meta property="og:image" content="[^"]*">/g,
      `<meta property="og:image" content="${versionedOgImage}">`
    );
    html = html.replace(
      /<meta name="twitter:image" content="[^"]*">/g,
      `<meta name="twitter:image" content="${versionedOgImage}">`
    );
    // og:url 도 접속 도메인에 맞춰 동적 변경
    html = html.replace(
      /<meta property="og:url" content="[^"]*">/g,
      `<meta property="og:url" content="${protocol}://${host}/">`
    );

    res.setHeader('Content-Type', 'text/html; charset=utf-8');
    // 페이지 자체는 캐시를 하지 않도록 설정
    res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate');
    return res.end(html);
  } catch (e) {
    if (fs.existsSync(htmlPath)) {
      return res.end(fs.readFileSync(htmlPath));
    }
    return res.status(500).send('Server Error');
  }
}
