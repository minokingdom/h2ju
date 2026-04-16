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
    
    const adminPass = process.env.ADMIN_PASSWORD;
    if (!adminPass) {
      return res.status(500).json({ error: 'Vercel 환경 변수가 없습니다.' });
    }
    
    // 원본 비번과 입력 비번 모두 trim 처리 및 강제 문자열 변환
    const inputPassword = String(password || '').trim();
    const targetPassword = String(adminPass || '').trim();
    
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
