// test-api.js - Check available models
require('dotenv').config();

const apiKey = process.env.GEMINI_API_KEY;

async function testAPI() {
  console.log('Testing Gemini API...');
  console.log('API Key:', apiKey ? `${apiKey.substring(0, 10)}...` : 'NOT FOUND');
  
  try {
    // List available models
    console.log('\nFetching available models...');
    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models?key=${apiKey}`);
    
    if (!response.ok) {
      const error = await response.text();
      console.error('Error:', error);
      return;
    }
    
    const data = await response.json();
    console.log('\nAvailable models:');
    if (data.models) {
      data.models.forEach(model => {
        console.log(`- ${model.name}`);
        console.log(`  Supports: ${model.supportedGenerationMethods?.join(', ')}`);
      });
    } else {
      console.log('No models found or unexpected response:', data);
    }
    
    // Try a simple generation with the first available model
    if (data.models && data.models.length > 0) {
      const testModel = data.models[0].name;
      console.log(`\nTesting generation with ${testModel}...`);
      
      const genResponse = await fetch(`https://generativelanguage.googleapis.com/${testModel}:generateContent?key=${apiKey}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ parts: [{ text: 'Say "Hello, world!" in one sentence.' }] }]
        })
      });
      
      if (genResponse.ok) {
        const result = await genResponse.json();
        console.log('✅ Success! Response:', result.candidates[0].content.parts[0].text);
      } else {
        const error = await genResponse.text();
        console.log('❌ Failed:', error);
      }
    }
    
  } catch (error) {
    console.error('Error:', error.message);
  }
}

testAPI();