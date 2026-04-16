fetch('https://남동구하현주.kr/thumb.jpg').then(async res => {
  console.log('Status:', res.status);
  console.log('Headers:', Object.fromEntries(res.headers.entries()));
  const buffer = await res.arrayBuffer();
  console.log('Body length:', buffer.byteLength);
}).catch(console.error);
