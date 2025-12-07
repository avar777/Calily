/*
 * Bulk Insert Journal Entries via API
 * Creates journal entries from Oct 1 - Nov 6, 2024
 * 
 * Usage:
 * 1. Log in to your account at http://localhost:3000
 * 2. Open browser DevTools (F12) → Console
 * 3. Type: localStorage.getItem('token')
 * 4. Copy the token (without quotes)
 * 5. Run: node bulk-insert-oct-nov.js YOUR_TOKEN_HERE
 * 
 */

const https = require('https');
const http = require('http');

// Sample journal entries - varied symptoms and emotions
const entryTemplates = [
  "Woke up with a mild headache and feeling exhausted. Had trouble sleeping last night. Energy level around 3/10.",
  "Good morning! Actually slept well for once. Feeling hopeful and energized. Energy 7/10.",
  "Brain fog is terrible today. Hard to concentrate on anything. Drinking more water.",
  "Joint pain in hands and knees. Weather is rainy - probably related. Resting today.",
  "Dizzy spells when standing up. Had to sit down quickly. Blood pressure might be low.",
  "Feeling better today! Managed to get some work done. Small victory.",
  "Bad flare day. Everything hurts. Fatigue is overwhelming. Stayed in bed most of the day.",
  "Mild nausea after eating. Not sure if it's the food or just my body being difficult.",
  "Actually felt energized! Went for a short 10 minute walk. Felt good.",
  "Anxious about upcoming doctor appointment. Stress is making symptoms worse.",
  "Rash appeared on my cheeks again. Inflammation is increasing. Taking photos to show doctor.",
  "Peaceful morning. Did some gentle stretching. Feeling calm and grateful.",
  "Crashed after lunch. Exhaustion hit hard. Had to nap for 2 hours.",
  "Frustrated with my body today. Why can't I just feel normal?",
  "Surprisingly good energy today! Accomplished several tasks without overdoing it.",
  "Migraine starting. Light and sound sensitivity. Need dark room.",
  "Feeling sad and isolated. Chronic illness is so lonely sometimes.",
  "Good sleep last night! 8 hours. Feel more rested than usual.",
  "Tension headache from stress. Trying to relax and breathe deeply.",
  "Happy today! Spent time with friends. Felt supported and understood.",
  "Moderate pain but manageable. Did some work from home.",
  "Fever and chills. Body aches all over. Might be getting sick on top of everything.",
  "Proud of myself for pacing today. Didn't overdo it for once.",
  "Numb and empty feeling. Hard to explain. Just existing today.",
  "Inflammation flare. Joints are swollen and painful. Ice packs helping.",
  "Grateful for my support system. They make this bearable.",
  "Overwhelmed by all the symptoms. Too much to track. Feeling defeated.",
  "Better day! Energy around 6/10. Able to do laundry and dishes.",
  "Confused about what triggers my flares. Wish I could figure it out.",
  "Resting and recovering from yesterday's activity. Learning my limits slowly.",
  "Hopeful about new treatment plan. Fingers crossed it helps.",
  "Exhausted but can't sleep. The irony is not lost on me.",
  "Pain level is high today. 7/10. Taking it easy.",
  "Felt confident today! Able to handle things without crashing.",
  "Worried about money and medical bills. Stress isn't helping symptoms.",
  "Calm and relaxed after meditation. Mind feels clearer.",
  "Discouraged by lack of progress. Will I ever feel better?",
  "Small improvements. Sleep is slightly better. I'll take it.",
  "Bitter about missing out on life. Everyone else seems fine.",
  "Motivated to keep trying. Not giving up.",
  "Resentful of healthy people who don't understand. Trying not to be.",
  "Guilty for being a burden. I know I shouldn't feel this way.",
  "Embarrassed to cancel plans again. People must think I'm flaky.",
  "Bored and restless but too tired to do anything. Frustrating.",
  "Excited about trying a new supplement. Hope it helps!",
  "Tearful today. Just needed a good cry. That's okay.",
  "On edge and irritable. Everything annoys me. Probably tired.",
  "Relieved after doctor visit. They're taking me seriously.",
  "Defeated after another failed treatment. Back to square one.",
  "Content with a quiet day at home. Sometimes that's enough."
];

// Function to get random entry
function getRandomEntry() {
  return entryTemplates[Math.floor(Math.random() * entryTemplates.length)];
}

// Function to generate entries for date range
function generateEntries() {
  const entries = [];
  
  // October 2024 (all 31 days)
  for (let day = 1; day <= 31; day++) {
    // 1-2 entries per day
    const entriesPerDay = Math.random() > 0.3 ? 2 : 1;
    
    for (let e = 0; e < entriesPerDay; e++) {
      const hour = e === 0 ? 8 + Math.floor(Math.random() * 4) : 14 + Math.floor(Math.random() * 6);
      const minute = Math.floor(Math.random() * 60);
      const date = new Date(2024, 9, day, hour, minute); // Month 9 = October
      
      entries.push({
        text: getRandomEntry(),
        date: date.toISOString()
      });
    }
  }
  
  // November 1-6, 2024
  for (let day = 1; day <= 6; day++) {
    const entriesPerDay = Math.random() > 0.3 ? 2 : 1;
    
    for (let e = 0; e < entriesPerDay; e++) {
      const hour = e === 0 ? 8 + Math.floor(Math.random() * 4) : 14 + Math.floor(Math.random() * 6);
      const minute = Math.floor(Math.random() * 60);
      const date = new Date(2024, 10, day, hour, minute); // Month 10 = November
      
      entries.push({
        text: getRandomEntry(),
        date: date.toISOString()
      });
    }
  }
  
  // Sort by date
  entries.sort((a, b) => new Date(a.date) - new Date(b.date));
  
  return entries;
}

// Get API URL and token from command line
const API_URL = process.env.API_URL || 'http://localhost:5001';
const TOKEN = process.argv[2];

if (!TOKEN) {
  console.error(' Error: No token provided!\n');
  console.log(' How to get your token:');
  console.log('1. Log in at http://localhost:3000');
  console.log('2. Open DevTools (F12) → Console tab');
  console.log('3. Type: localStorage.getItem(\'token\')');
  console.log('4. Copy the token (the long string in quotes)');
  console.log('\n Then run:');
  console.log('   node bulk-insert-oct-nov.js YOUR_TOKEN_HERE\n');
  process.exit(1);
}

const sampleEntries = generateEntries();

console.log(' Starting bulk insert...');
console.log(` API: ${API_URL}`);
console.log(` Entries to insert: ${sampleEntries.length}`);
console.log(` Date range: Oct 1 - Nov 6, 2024\n`);

// Function to create an entry via API
async function createEntry(entry, index) {
  return new Promise((resolve, reject) => {
    const url = new URL(`${API_URL}/api/entries`);
    const client = url.protocol === 'https:' ? https : http;
    
    const data = JSON.stringify({ 
      text: entry.text,
      createdAt: entry.date 
    });
    
    const options = {
      hostname: url.hostname,
      port: url.port || (url.protocol === 'https:' ? 443 : 80),
      path: url.pathname,
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${TOKEN}`,
        'Content-Length': data.length
      }
    };
    
    const req = client.request(options, (res) => {
      let responseData = '';
      
      res.on('data', (chunk) => {
        responseData += chunk;
      });
      
      res.on('end', () => {
        if (res.statusCode === 200 || res.statusCode === 201) {
          const date = new Date(entry.date).toLocaleDateString('en-US', {
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
          });
          console.log(` [${index + 1}/${sampleEntries.length}] ${date}: ${entry.text.substring(0, 50)}...`);
          resolve(true);
        } else {
          console.error(` Failed (${res.statusCode}): ${entry.text.substring(0, 30)}...`);
          if (res.statusCode === 401) {
            console.error('     Token expired or invalid! Get a new token.');
          }
          resolve(false);
        }
      });
    });
    
    req.on('error', (error) => {
      console.error(` Network error: ${error.message}`);
      reject(error);
    });
    
    req.write(data);
    req.end();
  });
}

// Insert all entries with a small delay between each
async function insertAllEntries() {
  let successCount = 0;
  let failCount = 0;
  
  for (let i = 0; i < sampleEntries.length; i++) {
    try {
      const success = await createEntry(sampleEntries[i], i);
      if (success) successCount++;
      else failCount++;
      
      // Small delay to avoid overwhelming the server
      await new Promise(resolve => setTimeout(resolve, 100));
    } catch (error) {
      failCount++;
    }
  }
  
  console.log('\n' + '═'.repeat(60));
  console.log(' Results:');
  console.log(`    Success: ${successCount}`);
  console.log(`    Failed: ${failCount}`);
  console.log(`    Date range: Oct 1 - Nov 6, 2024`);
  console.log(`    Total entries: ${sampleEntries.length}`);
  console.log('═'.repeat(60));
  
  if (successCount > 0) {
    console.log('\n Done! Refresh your app to see the entries.\n');
    console.log(' Now try the AI features:');
    console.log('   • Weekly Summary (last 7 days)');
    console.log('   • Pattern Analysis (all entries)');
    console.log('   • Trigger Identification (good vs bad days)\n');
  } else {
    console.log('\n  No entries were created. Check:');
    console.log('   • Is your backend running? (node server.js)');
    console.log('   • Is your token valid? (not expired)');
    console.log('   • Try getting a fresh token\n');
  }
}

// Run the script
insertAllEntries().catch(error => {
  console.error('\n Fatal error:', error.message);
  process.exit(1);
});