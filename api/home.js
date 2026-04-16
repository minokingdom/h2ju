import { kv } from '@vercel/kv';
import fs from 'fs';
import path from 'path';

export default async function handler(req, res) {
  try {
    // 1. index.html 파일 읽기
    const filePath = path.join(process.cwd(), 'index.html');
    let html = fs.readFileSync(filePath, 'utf8');

    // 2. KV에서 최신 설정 가져오기 (버전 확인용)
    const config = await kv.get('h2ju_config');
    
    // 3. 사진 버전 번호 생성 (config에 저장된 metaUpdate 또는 현재 시간의 시간/분 단위 사용)
    const version = config && config.configDate ? config.configDate : Math.floor(Date.now() / 600000);

    // 4. 메타태그 도메인 및 주소를 현재 접속한 도메인(Host)에 맞춰 동적으로 치환
    const host = req.headers.host || 'xn--2e0b94dbtdp35a89nr3a.kr';
    const protocol = req.headers['x-forwarded-proto'] || 'https';
    const baseUrl = `${protocol}://${host}`;
    const versionedUrl = `${baseUrl}/thumb.jpg?v=${version}`;
    
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

    // 5. 브라우저 캐시는 짧게(1분), 하지만 서빙은 빠르게
    res.setHeader('Content-Type', 'text/html; charset=utf-8');
    res.setHeader('Cache-Control', 'public, s-maxage=60, stale-while-revalidate=300');
    
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
