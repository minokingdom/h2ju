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

    // 1. 가장 호환성이 높은 퓨니코드 도메인으로 베이스 주소 설정
    const basePunyDomain = 'https://xn--2e0b94dbtdp35a89nr3a.kr';
    const versionedOgImage = `${basePunyDomain}/thumb.jpg?v=${configDate}`;

    // 2. 메타 태그 일괄 교체
    html = html.replace(
      /<meta property="og:image" content="[^"]*">/g,
      `<meta property="og:image" content="${versionedOgImage}">`
    );
    html = html.replace(
      /<meta name="twitter:image" content="[^"]*">/g,
      `<meta name="twitter:image" content="${versionedOgImage}">`
    );
    html = html.replace(
      /<meta property="og:url" content="[^"]*">/g,
      `<meta property="og:url" content="${basePunyDomain}/">`
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
