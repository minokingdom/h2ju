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
    // 매번 업데이트 시 main.js에서 configDate 같은 값이 저장되도록 할 예정이지만, 
    // 안전하게 현재 시간의 10분 단위 값을 캐시 버스터로 사용 (너무 자주 바뀌면 SNS 로딩 느려짐)
    const version = config && config.configDate ? config.configDate : Math.floor(Date.now() / 600000);

    // 4. 메타태그 주소를 버전이 붙은 주소로 치환
    // https://남동구하현주.kr/thumb.jpg -> https://남동구하현주.kr/thumb.jpg?v=VERSION
    const versionedUrl = `https://남동구하현주.kr/thumb.jpg?v=${version}`;
    
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
