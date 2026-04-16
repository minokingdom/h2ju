import { kv } from '@vercel/kv';
import fs from 'fs';
import path from 'path';

export default async function handler(req, res) {
  try {
    const config = await kv.get('h2ju_config');
    
    // 관리자가 메타이미지를 등록했다면 이를 먼저 시도
    if (config && config.metaImage) {
      // data:image/...;base64, 머릿말 유무에 상관없이 처리
      const base64Data = config.metaImage.includes('base64,') 
        ? config.metaImage.split('base64,')[1] 
        : config.metaImage;
        
      const imgBuffer = Buffer.from(base64Data, 'base64');
      
      if (imgBuffer.length > 500) { // 최소한의 사진 크기 체크
        res.setHeader('Content-Type', 'image/jpeg');
        res.setHeader('Content-Length', imgBuffer.length);
        res.setHeader('X-OG-Source', 'KV_SUCCESS'); // 진단용 헤더
        res.setHeader('Cache-Control', 'public, max-age=86400, must-revalidate');
        return res.end(imgBuffer);
      } else {
        res.setHeader('X-OG-Debug', 'KV_IMAGE_TOO_SMALL');
      }
    } else {
      res.setHeader('X-OG-Debug', 'KV_CONFIG_OR_IMAGE_EMPTY');
    }
  } catch (e) {
    res.setHeader('X-OG-Debug', `KV_ERROR_${e.message.substring(0, 20)}`);
  }
  
  // 최종 방어선: 기본 이미지 반환
  try {
    const defaultImgPath = path.join(__dirname, 'bike.png');
    if (fs.existsSync(defaultImgPath)) {
      const defaultImg = fs.readFileSync(defaultImgPath);
      res.setHeader('Content-Type', 'image/png');
      res.setHeader('Content-Length', defaultImg.length);
      res.setHeader('X-OG-Source', 'FALLBACK_BIKE'); // 진단용 헤더
      return res.end(defaultImg);
    }
  } catch (err) {
    res.setHeader('X-OG-Debug-Final', 'FALLBACK_FAILED');
  }

  // 진짜 최후의 수단: 1x1 도트
  const dot = Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII=', 'base64');
  res.setHeader('Content-Type', 'image/png');
  res.setHeader('X-OG-Source', 'LAST_RESORT_DOT'); // 진단용 헤더
  return res.end(dot);
};
