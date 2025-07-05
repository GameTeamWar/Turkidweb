// scripts/debug-env.js
const fs = require('fs');
const path = require('path');

console.log('🔍 Environment Debug Script\n');

// 1. Check current directory
console.log('📁 Current working directory:', process.cwd());

// 2. Check if .env.local exists
const envPath = path.join(process.cwd(), '.env.local');
console.log('📄 .env.local path:', envPath);
console.log('📄 .env.local exists:', fs.existsSync(envPath) ? '✅ YES' : '❌ NO');

if (fs.existsSync(envPath)) {
  try {
    const envContent = fs.readFileSync(envPath, 'utf8');
    console.log('📝 .env.local content preview:');
    
    // Show first few lines (hide sensitive data)
    const lines = envContent.split('\n').slice(0, 10);
    lines.forEach((line, index) => {
      if (line.trim() && !line.startsWith('#')) {
        const [key] = line.split('=');
        console.log(`   ${index + 1}. ${key}=***`);
      }
    });
    
    // Check specific keys
    console.log('\n🔑 Looking for required keys:');
    const hasProjectId = envContent.includes('GOOGLE_CLOUD_PROJECT_ID=');
    const hasClientEmail = envContent.includes('GOOGLE_CLOUD_CLIENT_EMAIL=');
    const hasPrivateKey = envContent.includes('GOOGLE_CLOUD_PRIVATE_KEY=');
    
    console.log('   GOOGLE_CLOUD_PROJECT_ID:', hasProjectId ? '✅ Found' : '❌ Missing');
    console.log('   GOOGLE_CLOUD_CLIENT_EMAIL:', hasClientEmail ? '✅ Found' : '❌ Missing');
    console.log('   GOOGLE_CLOUD_PRIVATE_KEY:', hasPrivateKey ? '✅ Found' : '❌ Missing');
    
  } catch (error) {
    console.error('❌ Error reading .env.local:', error.message);
  }
} else {
  console.log('❌ .env.local file not found!');
  console.log('📋 Expected location:', envPath);
}

// 3. Test dotenv loading
console.log('\n🧪 Testing dotenv loading...');
try {
  require('dotenv').config({ path: envPath });
  console.log('✅ Dotenv loaded successfully');
  console.log('🔍 After loading:');
  console.log('   PROJECT_ID:', process.env.GOOGLE_CLOUD_PROJECT_ID ? '✅ Loaded' : '❌ Missing');
  console.log('   CLIENT_EMAIL:', process.env.GOOGLE_CLOUD_CLIENT_EMAIL ? '✅ Loaded' : '❌ Missing');
  console.log('   PRIVATE_KEY:', process.env.GOOGLE_CLOUD_PRIVATE_KEY ? '✅ Loaded' : '❌ Missing');
} catch (error) {
  console.error('❌ Dotenv loading error:', error.message);
}

console.log('\n✨ Debug completed!');