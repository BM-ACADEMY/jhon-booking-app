

async function main() {
  const url = 'http://localhost:5000/api/rooms';
  console.log('Fetching from', url);
  const res = await fetch(url);
  const rooms = await res.json();
  console.log('Total rooms from API:', rooms.length);
  rooms.forEach(r => {
    console.log(`Room: "${r.name}" | maxOccupancy: ${r.maxOccupancy} (type: ${typeof r.maxOccupancy})`);
  });
}

main().catch(err => console.error(err));
