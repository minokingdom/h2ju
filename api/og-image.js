import { kv } from '@vercel/kv';

export default async function handler(req, res) {
  try {
    const config = await kv.get('h2ju_config');
    
    // 만약 관리자가 메타이미지를 등록했다면
    if (config && config.metaImage && config.metaImage.startsWith('data:image')) {
      // Base64 문자열에서 헤더(data:image/jpeg;base64,) 부분을 제거
      const base64Data = config.metaImage.replace(/^data:image\/\w+;base64,/, '');
      const imgBuffer = Buffer.from(base64Data, 'base64');
      
      // JPEG 바이너리 응답
      res.setHeader('Content-Type', 'image/jpeg');
      // 캐시 처리 (Edge에서 빠르게 서빙하도록 설정, 최대 60초 캐싱)
      res.setHeader('Cache-Control', 's-maxage=60, stale-while-revalidate');
      
      // 순수 이미지 파일 띄우기
      return res.send(imgBuffer);
    }
  } catch (e) {
    console.error('OG Image Fetch Error:', e);
  }
  
  // KV에 설정이 없거나 아직 한 번도 저장하지 않았다면 기존 기본 이미지로 임시 렌더링(리다이렉트)
  res.setHeader('Cache-Control', 's-maxage=60');
  return res.redirect(302, '/bike.png');
};
