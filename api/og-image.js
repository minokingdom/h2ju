import { kv } from '@vercel/kv';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export default async function handler(req, res) {
  const bikePath = path.join(__dirname, 'bike.png');

  try {
    // 1. 관리자 설정 이미지(KV) 시도
    const config = await kv.get('h2ju_config');
    
    if (config && config.metaImage && config.metaImage.length > 500) {
      const isBase64 = config.metaImage.includes('base64,');
      const mimeType = isBase64 
        ? config.metaImage.split(';')[0].split(':')[1] 
        : 'image/jpeg';
      
      const base64Data = isBase64 
        ? config.metaImage.split('base64,')[1] 
        : config.metaImage;
        
      const imgBuffer = Buffer.from(base64Data, 'base64');
      
      if (imgBuffer.length > 0) {
        res.setHeader('Content-Type', mimeType);
        res.setHeader('Content-Length', imgBuffer.length);
        res.setHeader('Cache-Control', 'public, max-age=3600');
        return res.end(imgBuffer);
      }
    }
  } catch (e) {
    console.error('KV Read Error in OG:', e.message);
  }
  
  // 2. 관리자 설정이 없으면 '자전거 사진'으로 대체
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

  // 3. 진짜 최후의 수단 (1x1 transparent dot)
  const dot = Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII=', 'base64');
  res.setHeader('Content-Type', 'image/png');
  return res.end(dot);
}
