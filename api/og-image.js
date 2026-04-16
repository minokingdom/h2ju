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
        // 파일명 자체가 유니크하므로 긴 캐시 시간을 가져도 안전합니다 (1일).
        res.setHeader('Cache-Control', 'public, max-age=86400, must-revalidate');
        return res.end(imgBuffer);
      } else {
        console.warn('OG Image exceeds 3MB, falling back to default');
      }
    }
  } catch (e) {
    console.error('OG Image Fetch Error:', e);
  }
  
  // 최종 방어선: 그 어떠한 경우에도 404(하얀 박스)를 내보내지 않고 기본 이미지를 반환합니다.
  try {
    const defaultImgPath = path.join(__dirname, 'bike.png');
    if (fs.existsSync(defaultImgPath)) {
      const defaultImg = fs.readFileSync(defaultImgPath);
      res.setHeader('Content-Type', 'image/png');
      res.setHeader('Content-Length', defaultImg.length);
      res.setHeader('Cache-Control', 'public, s-maxage=60');
      return res.end(defaultImg);
    }
  } catch (err) {
    console.error('Final Image Error:', err);
  }

  // 진짜 최후의 수단: 1x1 도트라도 내보내서 하얀 박스를 방지합니다.
  const dot = Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII=', 'base64');
  res.setHeader('Content-Type', 'image/png');
  return res.end(dot);
};
