import { kv } from '@vercel/kv';
import fs from 'fs';
import path from 'path';

export default async function handler(req, res) {
  // Vercel 환경에서 안전한 파일 경로 설정을 위해 process.cwd()를 사용합니다.
  const rootDir = process.cwd();
  const bikePath = path.join(rootDir, 'api', 'bike.png');

  try {
    // 1. 강제 우회 모드 진단 (v-final-victory 주소인 경우)
    if (req.url && req.url.includes('v-final-victory')) {
      if (fs.existsSync(bikePath)) {
        res.setHeader('Content-Type', 'image/png');
        res.setHeader('X-OG-Source', 'FORCED_FALLBACK_BIKE_SUCCESS');
        return res.end(fs.readFileSync(bikePath));
      }
    }

    // 2. 관리자 설정 이미지(KV) 시도
    const config = await kv.get('h2ju_config');
    if (config && config.metaImage) {
      const base64Data = config.metaImage.includes('base64,') 
        ? config.metaImage.split('base64,')[1] 
        : config.metaImage;
        
      const imgBuffer = Buffer.from(base64Data, 'base64');
      
      if (imgBuffer.length > 500) {
        res.setHeader('Content-Type', 'image/jpeg');
        res.setHeader('Content-Length', imgBuffer.length);
        res.setHeader('X-OG-Source', 'KV_SUCCESS_REAL');
        res.setHeader('Cache-Control', 'public, max-age=86400');
        return res.end(imgBuffer);
      }
    }
  } catch (e) {
    res.setHeader('X-OG-Debug', `KV_ERR_${e.message.substring(0, 15)}`);
  }
  
  // 3. 기본 자전거 이미지 반환
  try {
    if (fs.existsSync(bikePath)) {
      res.setHeader('Content-Type', 'image/png');
      res.setHeader('X-OG-Source', 'FALLBACK_BIKE');
      return res.end(fs.readFileSync(bikePath));
    } else {
      res.setHeader('X-OG-Debug', 'BIKE_NOT_FOUND_AT_API_FOLDER');
    }
  } catch (err) {
    res.setHeader('X-OG-Debug', 'FALLBACK_READ_ERROR');
  }

  // 4. 최후의 수단 (1x1 도트)
  const dot = Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII=', 'base64');
  res.setHeader('Content-Type', 'image/png');
  res.setHeader('X-OG-Source', 'LAST_DOT_FAILSAFE');
  return res.end(dot);
}
