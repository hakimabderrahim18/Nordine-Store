const apiId = '55291034042589806124';
const apiToken = 'cgFoafx9JGTR75eAL0jzqiwrMu8WvU4lkmbBNYQhPK16XISZVHCnODy2psE3dt';

console.log('Testing Yalidine communes for wilaya_id=31...');

fetch('https://api.yalidine.app/v1/communes?wilaya_id=31', {
  headers: {
    'X-API-ID': apiId,
    'X-API-TOKEN': apiToken
  }
})
.then(async (res) => {
  console.log('Status:', res.status);
  const data = await res.json();
  console.log('Total communes received:', data.data ? data.data.length : 'N/A');
  if (data.data && data.data.length > 0) {
    console.log('First commune:', data.data[0]);
  }
})
.catch(err => {
  console.error('Yalidine communes test failed:', err.message);
});
