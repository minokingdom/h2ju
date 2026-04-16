import { kv } from '@vercel/kv';
import fs from 'fs';
import path from 'path';

export default async function handler(req, res) {
  try {
    const config = await kv.get('h2ju_config');
    
    // 관리자가 메타이미지를 등록했다면 이를 먼저 시도
    if (config && config.metaImage && config.metaImage.startsWith('data:image')) {
      const isPng = config.metaImage.includes('image/png');
      const base64Data = config.metaImage.replace(/^data:image\/\w+;base64,/, '');
      const imgBuffer = Buffer.from(base64Data, 'base64');
      
      // 카카오톡 3MB 제한 체크
      if (imgBuffer.length <= 3000000) {
        res.setHeader('Content-Type', isPng ? 'image/png' : 'image/jpeg');
        res.setHeader('Content-Length', imgBuffer.length);
        // 진단 기간 동안 서버 캐시 시간을 매우 짧게 가져갑니다.
        res.setHeader('Cache-Control', 'public, max-age=0, s-maxage=1, stale-while-revalidate=5');
        return res.end(imgBuffer);
      } else {
        console.warn('OG Image exceeds 3MB, falling back to default');
      }
    }
  } catch (e) {
    console.error('OG Image Fetch Error:', e);
  }
  
  // 기본 이미지(bike.png) 반환
  try {
    const defaultImgPath = path.join(__dirname, 'bike.png');
    const defaultImg = fs.readFileSync(defaultImgPath);
    
    res.setHeader('Content-Type', 'image/png');
    res.setHeader('Content-Length', defaultImg.length);
    res.setHeader('Cache-Control', 'public, s-maxage=60, stale-while-revalidate=300');
    return res.end(defaultImg);
  } catch (err) {
    console.error('Final Image Error:', err);
    return res.status(404).end();
  }
};
