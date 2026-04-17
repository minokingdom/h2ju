import { kv } from '@vercel/kv';
import fs from 'fs';
import path from 'path';

export default async function handler(req, res) {
  const rootDir = process.cwd();
  const htmlPath = path.join(rootDir, 'index.html');
  
  try {
    let html = fs.readFileSync(htmlPath, 'utf8');
    
    // 1. KV에서 설정을 가져오되, 카톡 스크래퍼를 위해 1초 타임아웃 적용 (속도 최우선)
    let configDate = Date.now();
    try {
      const kvPromise = kv.get('h2ju_config');
      const timeoutPromise = new Promise((_, reject) => 
        setTimeout(() => reject(new Error('KV Timeout')), 1000)
      );
      
      const config = await Promise.race([kvPromise, timeoutPromise]);
      if (config && config.configDate) {
        configDate = config.configDate;
      }
    } catch (kvErr) {
      console.error('KV Interaction Error (Falling back to current timestamp):', kvErr.message);
    }

    // 2. 도메인 설정: 한글 도메인 '남동구하현주.kr'을 기본으로 사용
    const host = '남동구하현주.kr'; 
    const protocol = 'https';

    // 3. 사진 주소에 v파라미터를 붙여 카카오톡 캐시를 강제로 새로고침함
    const versionedOgImage = `${protocol}://${host}/og-banner-final.jpg?v=${configDate}`;

    // 4. 아주 유연한 정규식으로 og:image 및 twitter:image 교체 (사용자 수동 편집 대응)
    html = html.replace(
      /<meta property="og:image" content="[^"]*">/gi,
      `<meta property="og:image" content="${versionedOgImage}">`
    );
    html = html.replace(
      /<meta name="twitter:image" content="[^"]*">/gi,
      `<meta name="twitter:image" content="${versionedOgImage}">`
    );
    html = html.replace(
      /<meta property="og:url" content="[^"]*">/gi,
      `<meta property="og:url" content="${protocol}://${host}/">`
    );

    res.setHeader('Content-Type', 'text/html; charset=utf-8');
    res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate');
    return res.end(html);
  } catch (e) {
    // 오류 시 원본 index.html을 그대로 내보내어 사이트가 깨지는 것을 방지
    if (fs.existsSync(htmlPath)) {
      return res.end(fs.readFileSync(htmlPath));
    }
    return res.status(500).send('Server Error');
  }
}
