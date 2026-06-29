const apiId = '55291034042589806124';
const apiToken = 'cgFoafx9JGTR75eAL0jzqiwrMu8WvU4lkmbBNYQhPK16XISZVHCnODy2psE3dt';

console.log('Testing Yalidine fees with from_wilaya_id=16 and to_wilaya_id=31...');

fetch('https://api.yalidine.app/v1/fees?from_wilaya_id=16&to_wilaya_id=31', {
  headers: {
    'X-API-ID': apiId,
    'X-API-TOKEN': apiToken
  }
})
.then(async (res) => {
  console.log('Status:', res.status);
  const data = await res.json();
  console.log('Response body:', JSON.stringify(data, null, 2));
})
.catch(err => {
  console.error('Yalidine fees test failed:', err.message);
});
