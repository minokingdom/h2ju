import { kv } from '@vercel/kv';

export const config = {
  api: {
    bodyParser: {
      sizeLimit: '10mb',
    },
  },
};

export default async function handler(req, res) {
  if (req.method === 'GET') {
    try {
      const configData = await kv.get('h2ju_config');
      return res.status(200).json(configData || null);
    } catch (e) {
      console.error(e);
      return res.status(500).json({ error: '설정 데이터를 서버에서 불러오지 못했습니다.' });
    }
  } 
  
  if (req.method === 'POST') {
    const { password, config: incomingConfig } = req.body || {};

    // 1. 데이터 자체가 누락된 경우 (보통 용량 초과 시 발생)
    if (req.method === 'POST' && (!req.body || (!password && !incomingConfig))) {
      return res.status(413).json({ error: '데이터 용량이 너무 큽니다. 사진 크기를 줄여서 다시 시도해 주세요.' });
    }
    
    const adminPass = process.env.ADMIN_PASSWORD;
    if (!adminPass) {
      return res.status(500).json({ error: 'Vercel 환경 변수가 없습니다.' });
    }
    
    // 2. 비번 정규화 및 비교
    const inputPassword = String(password || '').trim();
    const targetPassword = String(adminPass || '').trim().replace(/^["']|["']$/g, '');
    
    if (!inputPassword || inputPassword !== targetPassword) {
      return res.status(401).json({ error: '비밀번호가 일치하지 않습니다.' });
    }
    
    try {
      await kv.set('h2ju_config', incomingConfig);
      return res.status(200).json({ success: true });
    } catch (e) {
      console.error(e);
      return res.status(500).json({ error: '데이터 저장에 실패했습니다.' });
    }
  }

  return res.status(405).json({ error: '허용되지 않은 메서드입니다.' });
}
