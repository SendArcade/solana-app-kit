// This script is used to verify that environment variables are loaded correctly
require('dotenv').config({ path: process.env.ENVFILE || '.env.local' });

console.log('Checking environment variables:');
console.log('----------------------------');
[
  'PRIVY_APP_ID',
  'PRIVY_CLIENT_ID',
  'TURNKEY_BASE_URL',
  'TURNKEY_RP_ID',
  'TURNKEY_RP_NAME',
  'DYNAMIC_ENVIRONMENT_ID',
  'HELIUS_RPC_URL', 
  'HELIUS_API_KEY',
  'SERVER_URL',
  'TENSOR_API_KEY',
  'CLUSTER',
  'COINGECKO_API_KEY',
  'PARA_API_KEY'
].forEach(key => {
  const value = process.env[key];
  console.log(`${key}: ${value ? '✅ Set' : '❌ Not set'}`);
});
console.log('----------------------------');
console.log('ENVFILE:', process.env.ENVFILE || '.env.local (default)'); 