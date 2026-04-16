import fs from 'fs';
import path from 'path';

export default async function handler(req, res) {
  try {
    // [진단용 실험] KV 데이터를 무시하고 무조건 bike.png를 반환합니다.
    const defaultImgPath = path.join(process.cwd(), 'bike.png');
    const defaultImg = fs.readFileSync(defaultImgPath);
    
    res.setHeader('Content-Type', 'image/png');
    res.setHeader('Content-Length', defaultImg.length);
    // 캐시 확인을 위해 캐시 기간을 짧게 설정
    res.setHeader('Cache-Control', 'public, s-maxage=0, max-age=0, must-revalidate');
    
    console.log('Diagnostic mode: Serving bike.png directly');
    return res.end(defaultImg);
  } catch (err) {
    console.error('Diagnostic Image Error:', err);
    return res.status(500).end();
  }
};
