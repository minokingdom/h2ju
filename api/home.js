import { kv } from '@vercel/kv';
import fs from 'fs';
import path from 'path';

export default async function handler(req, res) {
  const rootDir = process.cwd();
  const htmlPath = path.join(rootDir, 'index.html');
  
  try {
    let html = fs.readFileSync(htmlPath, 'utf8');
    
    // 사용자의 통찰대로 '고정 주소'를 사용하여 카카오톡의 신뢰도를 높입니다.
    const fixedOgImage = `https://xn--2e0b94dbtdp35a89nr3a.kr/thumb.jpg`;

    html = html.replace(
      /<meta property="og:image" content="[^"]*">/g,
      `<meta property="og:image" content="${fixedOgImage}">`
    );
    html = html.replace(
      /<meta name="twitter:image" content="[^"]*">/g,
      `<meta name="twitter:image" content="${fixedOgImage}">`
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
