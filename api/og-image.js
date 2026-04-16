import { kv } from '@vercel/kv';

export default async function handler(req, res) {
  try {
    const config = await kv.get('h2ju_config');
    
    // 만약 관리자가 메타이미지를 등록했다면
    if (config && config.metaImage && config.metaImage.startsWith('data:image')) {
      // Base64 문자열에서 헤더(data:image/jpeg;base64,) 부분을 제거
      const base64Data = config.metaImage.replace(/^data:image\/\w+;base64,/, '');
      const imgBuffer = Buffer.from(base64Data, 'base64');
      
      // JPEG 바이너리 응답을 위한 명시적 헤더 설정 (카카오 크롤러 호환성)
      res.setHeader('Content-Type', 'image/jpeg');
      res.setHeader('Content-Length', imgBuffer.length);
      // 카카오톡 모바일 앱이 기기 로컬 캐싱을 거부하고 렌더링을 포기(하얀 네모)하는 버그를 막기 위해
      // 브라우저용 로컬 캐시(max-age)를 무조건 길게 주어 앱 내부 이미지 렌더러가 정상 로딩되도록 강제
      res.setHeader('Cache-Control', 'public, max-age=31536000, s-maxage=60, stale-while-revalidate=86400');
      
      // res.send 대신 원시 스트림 전송(res.end)으로 Vercel 내부 변조(octet-stream 등) 방지
      return res.end(imgBuffer);
    }
  } catch (e) {
    console.error('OG Image Fetch Error:', e);
  }
  
  // KV에 데이터가 없을 경우 기본 이미지 반환
  res.setHeader('Cache-Control', 's-maxage=60');
  return res.redirect(302, '/bike.png');
};
