// Quick test script for Gemini API
// Run: node test-gemini.js

const { GoogleGenerativeAI } = require('@google/generative-ai');

// Use env var - never hardcode API keys!
const API_KEY = process.env.GEMINI_API_KEY;
const MODEL = process.env.GEMINI_MODEL || 'gemini-flash-latest';

async function testGemini() {
  if (!API_KEY) {
    console.error('❌ ERROR: GEMINI_API_KEY environment variable is not set');
    console.log('Set it with: set GEMINI_API_KEY=your-api-key');
    return;
  }
  
  console.log(`Testing Gemini API with ${MODEL}...`);
  
  const genAI = new GoogleGenerativeAI(API_KEY);
  const model = genAI.getGenerativeModel({ model: MODEL });
  
  try {
    const result = await model.generateContent('give me motivational content in 10 lines.');
    const text = result.response.text();
    
    console.log('\n✅ SUCCESS! API Key is working.\n');
    console.log('Response:', text);
  } catch (error) {
    console.error('\n❌ ERROR:', error.message);
  }
}

testGemini();
