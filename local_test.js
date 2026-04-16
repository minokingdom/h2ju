const http = require('http');
const fs = require('fs');
const path = require('path');

// 로컬 테스트용 메모리 데이터베이스 (재시작하면 초기화됨)
let mockConfig = null;

const server = http.createServer((req, res) => {
  // API 요청 가로채기 (Vercel Serverless Function 모방)
  if (req.url === '/api/config') {
    if (req.method === 'GET') {
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify(mockConfig || {}));
      return;
    }
    
    if (req.method === 'POST') {
      let body = '';
      req.on('data', chunk => {
        body += chunk.toString();
      });
      req.on('end', () => {
        try {
          const data = JSON.parse(body);
          // 로컬 테스트용 고정 비밀번호 확인
          if (data.password !== 'h2ju2026') {
            res.writeHead(401, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ error: '비밀번호가 일치하지 않습니다.' }));
            return;
          }
          // 데이터 저장
          mockConfig = data.config;
          res.writeHead(200, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ success: true }));
        } catch (e) {
          res.writeHead(500, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ error: '서버 에러가 발생했습니다.' }));
        }
      });
      return;
    }
  }

  // 일반 정적 파일 제공 (index.html, JS, CSS 등)
  let filePath = path.join(__dirname, req.url === '/' ? 'index.html' : req.url);
  // URL에서 쿼리 파라미터 제외 (?v=123 등)
  filePath = filePath.split('?')[0];

  const extname = path.extname(filePath);
  let contentType = 'text/html';
  switch (extname) {
    case '.js': contentType = 'text/javascript'; break;
    case '.css': contentType = 'text/css'; break;
    case '.png': contentType = 'image/png'; break;
    case '.jpg': contentType = 'image/jpg'; break;
    case '.svg': contentType = 'image/svg+xml'; break;
    case '.ico': contentType = 'image/x-icon'; break;
  }

  fs.readFile(filePath, (err, content) => {
    if (err) {
      if (err.code === 'ENOENT') {
        // 파일을 찾을 수 없는 경우 그냥 통과 (404)
        res.writeHead(404);
        res.end('Not Found');
      } else {
        res.writeHead(500);
        res.end(`Server Error: ${err.code}`);
      }
    } else {
      res.writeHead(200, { 'Content-Type': contentType });
      res.end(content, 'utf-8');
    }
  });
});

const PORT = 3000;
server.listen(PORT, '0.0.0.0', () => {
  console.log(`\n==============================================`);
  console.log(`🚀 로컬 테스트용 가짜(Mock) API 서버가 켜졌습니다!`);
  console.log(`==============================================`);
  console.log(`👉 브라우저에서 아래 주소로 접속하세요:`);
  console.log(`🔗 http://localhost:${PORT}`);
  console.log(`\n(관리자 테스트용 비밀번호: h2ju2026)`);
  console.log(`서버를 종료하려면 VSC 터미널에서 Ctrl+C를 누르세요.\n`);
});
