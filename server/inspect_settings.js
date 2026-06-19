async function main() {
  const url = 'http://localhost:5000/api/settings';
  console.log('Fetching settings from', url);
  const res = await fetch(url);
  const settings = await res.json();
  console.log('Settings:', JSON.stringify(settings, null, 2));
}

main().catch(err => console.error(err));
