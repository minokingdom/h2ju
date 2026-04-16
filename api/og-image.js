import { kv } from '@vercel/kv';
import fs from 'fs';
import path from 'path';

export default async function handler(req, res) {
  try {
    // [최종 진단] 강제 우회 모드: 주소에 v-final-victory가 포함되면 KV를 생략하고 즉시 bike.png 반환
    if (req.url && req.url.includes('v-final-victory')) {
      const bikePath = path.join(__dirname, 'bike.png');
      if (fs.existsSync(bikePath)) {
        const bikeImg = fs.readFileSync(bikePath);
        res.setHeader('Content-Type', 'image/png');
        res.setHeader('X-OG-Source', 'FORCED_FALLBACK_BIKE_SUCCESS');
        return res.end(bikeImg);
      }
    }

    const config = await kv.get('h2ju_config');
    
    if (config && config.metaImage) {
      const base64Data = config.metaImage.includes('base64,') 
        ? config.metaImage.split('base64,')[1] 
        : config.metaImage;
        
      const imgBuffer = Buffer.from(base64Data, 'base64');
      
      if (imgBuffer.length > 500) {
        res.setHeader('Content-Type', 'image/jpeg');
        res.setHeader('Content-Length', imgBuffer.length);
        res.setHeader('X-OG-Source', 'KV_SUCCESS');
        res.setHeader('Cache-Control', 'public, max-age=86400');
        return res.end(imgBuffer);
      }
    }
  } catch (e) {
    res.setHeader('X-OG-Debug', `ERROR_${e.message.substring(0, 20)}`);
  }
  
  // 기본 방어선
  try {
    const defaultImgPath = path.join(__dirname, 'bike.png');
    if (fs.existsSync(defaultImgPath)) {
      const defaultImg = fs.readFileSync(defaultImgPath);
      res.setHeader('Content-Type', 'image/png');
      res.setHeader('X-OG-Source', 'FALLBACK_BIKE');
      return res.end(defaultImg);
    }
  } catch (err) {}

  // 최후의 도트
  const dot = Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII=', 'base64');
  res.setHeader('Content-Type', 'image/png');
  res.setHeader('X-OG-Source', 'LAST_DOT');
  return res.end(dot);
}
