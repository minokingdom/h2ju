import { kv } from '@vercel/kv';
import fs from 'fs';
import path from 'path';

export default async function handler(req, res) {
  const rootDir = process.cwd();
  const htmlPath = path.join(rootDir, 'index.html');
  
  try {
    let html = fs.readFileSync(htmlPath, 'utf8');
    
    // 캐시를 무력화하기 위해 매번 새로운 버전(타임스탬프) 생성
    const version = Math.floor(Date.now() / 1000);
    // 가장 신뢰도 높은 영문 주소와 유니크한 경로 조합
    const dynamicOgImage = `https://h2ju.vercel.app/share-img/${version}.jpg`;

    // index.html 내의 og:image와 twitter:image를 실시간으로 교체
    html = html.replace(
      /<meta property="og:image" content="[^"]*">/g,
      `<meta property="og:image" content="${dynamicOgImage}">`
    );
    html = html.replace(
      /<meta name="twitter:image" content="[^"]*">/g,
      `<meta name="twitter:image" content="${dynamicOgImage}">`
    );

    res.setHeader('Content-Type', 'text/html; charset=utf-8');
    res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
    return res.end(html);
  } catch (e) {
    // 에러 발생 시 정적 파일이라도 내보내기
    if (fs.existsSync(htmlPath)) {
      return res.end(fs.readFileSync(htmlPath));
    }
    return res.status(500).send('Server Error');
  }
}
