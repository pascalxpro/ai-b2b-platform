const query1 = '站在日本具有貿易商與當地經銷商的公司，批發食品容器';
const query2 = '日本 食品容器 貿易商 經銷商';

async function test() {
  const r1 = await fetch('https://html.duckduckgo.com/html/', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)',
    },
    body: 'q=' + encodeURIComponent(query1) + '&b=',
  }).then(r => r.text());

  const count1 = (r1.match(/class="result__a"/g) || []).length;
  console.log(`Query 1 ("${query1}") results count:`, count1);

  const r2 = await fetch('https://html.duckduckgo.com/html/', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)',
    },
    body: 'q=' + encodeURIComponent(query2) + '&b=',
  }).then(r => r.text());

  const count2 = (r2.match(/class="result__a"/g) || []).length;
  console.log(`Query 2 ("${query2}") results count:`, count2);
}

test();
