

async function main() {
  const url = 'http://localhost:5000/api/rooms';
  console.log('Fetching from', url);
  const res = await fetch(url);
  const rooms = await res.json();
  console.log('Total rooms from API:', rooms.length);
  rooms.forEach(r => {
    console.log(`Room: "${r.name}" | maxAdults: ${r.maxAdults} (type: ${typeof r.maxAdults}) | maxChildren: ${r.maxChildren} (type: ${typeof r.maxChildren}) | guests: ${r.guests}`);
  });
}

main().catch(err => console.error(err));
