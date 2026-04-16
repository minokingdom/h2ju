import { kv } from '@vercel/kv';
import fs from 'fs';
import path from 'path';

import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export default async function handler(req, res) {
  // 현재 파일(api/og-image.js)과 같은 위치에 있는 bike.png를 찾습니다.
  const bikePath = path.join(__dirname, 'bike.png');

  try {
    // 1. 관리자 설정 이미지(KV) 시도
    const config = await kv.get('h2ju_config');
    
    if (config && config.metaImage) {
      // Base64 데이터에서 헤더 제거 및 디코딩
      const base64Data = config.metaImage.includes('base64,') 
        ? config.metaImage.split('base64,')[1] 
        : config.metaImage;
        
      const imgBuffer = Buffer.from(base64Data, 'base64');
      
      if (imgBuffer.length > 500) {
        res.setHeader('Content-Type', 'image/jpeg');
        res.setHeader('Content-Length', imgBuffer.length);
        // 카카오톡이 선호하는 표준 캐시 설정 (1시간)
        res.setHeader('Cache-Control', 'public, max-age=3600');
        return res.end(imgBuffer);
      }
    }
  } catch (e) {
    console.error('KV Read Error:', e.message);
  }
  
  // 2. 관리자 설정이 없거나 실패하면 즉시 '자전거 사진'으로 대체 (성공의 상징)
  try {
    if (fs.existsSync(bikePath)) {
      const bikeImg = fs.readFileSync(bikePath);
      res.setHeader('Content-Type', 'image/png');
      res.setHeader('Content-Length', bikeImg.length);
      res.setHeader('Cache-Control', 'public, max-age=3600');
      return res.end(bikeImg);
    }
  } catch (err) {
    console.error('Bike Fallback Error:', err.message);
  }

  // 3. 진짜 최후의 수단
  const dot = Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII=', 'base64');
  res.setHeader('Content-Type', 'image/png');
  return res.end(dot);
}
