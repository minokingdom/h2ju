const { kv } = require('@vercel/kv');

module.exports = async function handler(req, res) {
  if (req.method === 'GET') {
    try {
      const config = await kv.get('h2ju_config');
      return res.status(200).json(config || null);
    } catch (e) {
      console.error(e);
      return res.status(500).json({ error: '설정 데이터를 서버에서 불러오지 못했습니다.' });
    }
  } 
  
  if (req.method === 'POST') {
    const { password, config } = req.body;
    
    const adminPass = process.env.ADMIN_PASSWORD;
    if (!adminPass) {
      return res.status(500).json({ error: 'Vercel 서버 환경 변수에 ADMIN_PASSWORD가 단 한 번도 등록되지 않았습니다.\nVercel 대시보드 - Environment Variables 에서 추가해주세요.' });
    }
    
    if (password !== adminPass) {
      return res.status(401).json({ error: '비밀번호가 일치하지 않습니다.' });
    }
    
    try {
      // Vercel KV 데이터 업데이트
      await kv.set('h2ju_config', config);
      return res.status(200).json({ success: true });
    } catch (e) {
      console.error(e);
      return res.status(500).json({ error: '데이터 저장에 실패했습니다. (KV 연결 확인 필요)' });
    }
  }

  return res.status(405).json({ error: '허용되지 않은 메서드입니다.' });
};
