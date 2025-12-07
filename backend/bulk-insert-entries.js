/*
 * Bulk Insert Journal Entries - Extended to December 10, 2025
 * Creates journal entries from Oct 1 - Dec 10, 2025
 * 
 * Usage:
 * 1. Make sure backend is running
 * 2. Update email if needed (line 136)
 * 3. Run: node bulk-insert-entries.js
 */

require('dotenv').config();
const mongoose = require('mongoose');

// Import your models
const { Entry, User } = require('./models');

// MongoDB connection
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/calily';

// Sample journal entry templates
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
  "Content with a quiet day at home. Sometimes that's enough.",
  "Woke up feeling stiff. Cold weather makes everything worse.",
  "Trying to stay positive despite the pain. Some days are harder.",
  "Had a good conversation with my doctor. Feeling heard.",
  "Struggling to keep up with housework. Need to ask for help.",
  "Enjoying a good book despite feeling tired. Small pleasures matter.",
  "Weather changed and I can feel it in my bones. Barometric pressure drop.",
  "Managed to cook dinner tonight. Felt accomplished!",
  "Headache won't go away. Going to try ice pack.",
  "Feeling grateful for heating pad. Best investment ever.",
  "Tired of being tired. When will this get better?",
  "Found a comfortable position finally. Small wins count.",
  "Talking to support group helped. Not alone in this.",
  "Making peace with my limitations. It's a process.",
  "Body cooperated today! Got things done without crashing.",
  "Dealing with guilt about needing so much rest.",
  "Celebrating being able to shower today. Victory!",
  "Pain is manageable with medication. Grateful for that.",
  "Trying new relaxation techniques. Hope they help with stress.",
  "Another sleepless night. Exhausted but wired.",
  "Finally had a breakthrough with my symptoms! Feeling hopeful.",
  "Setback today. Two steps forward, one step back.",
  "Learning to listen to my body's signals better.",
  "Pushed too hard yesterday. Paying for it today.",
  "Gentle yoga helped. Flexibility improving slowly.",
  "Bad weather = bad symptoms. Like clockwork.",
  "Supporting other chronic illness warriors online. We're in this together.",
  "Appointment went well. New medication to try.",
  "Side effects from new med. Ugh. Adjust or push through?",
  "Better than yesterday! Progress isn't linear.",
  "Accepting that some days are just survival days."
];

function getRandomEntry() {
  return entryTemplates[Math.floor(Math.random() * entryTemplates.length)];
}

function generateSampleEntries() {
  const entries = [];
  
  // October 2025 (all 31 days)
  console.log('Generating October entries...');
  for (let day = 1; day <= 31; day++) {
    const entriesPerDay = Math.random() > 0.3 ? 2 : 1;
    
    for (let e = 0; e < entriesPerDay; e++) {
      const hour = e === 0 ? 8 + Math.floor(Math.random() * 4) : 14 + Math.floor(Math.random() * 6);
      const minute = Math.floor(Math.random() * 60);
      const date = new Date(2025, 9, day, hour, minute); // Month 9 = October
      
      entries.push({
        text: getRandomEntry(),
        date: date
      });
    }
  }
  
  // November 2025 (all 30 days)
  console.log('Generating November entries...');
  for (let day = 1; day <= 30; day++) {
    const entriesPerDay = Math.random() > 0.3 ? 2 : 1;
    
    for (let e = 0; e < entriesPerDay; e++) {
      const hour = e === 0 ? 8 + Math.floor(Math.random() * 4) : 14 + Math.floor(Math.random() * 6);
      const minute = Math.floor(Math.random() * 60);
      const date = new Date(2025, 10, day, hour, minute); // Month 10 = November
      
      entries.push({
        text: getRandomEntry(),
        date: date
      });
    }
  }
  
  // December 1-10, 2025
  console.log('Generating December entries...');
  for (let day = 1; day <= 10; day++) {
    const entriesPerDay = Math.random() > 0.3 ? 2 : 1;
    
    for (let e = 0; e < entriesPerDay; e++) {
      const hour = e === 0 ? 8 + Math.floor(Math.random() * 4) : 14 + Math.floor(Math.random() * 6);
      const minute = Math.floor(Math.random() * 60);
      const date = new Date(2025, 11, day, hour, minute); // Month 11 = December
      
      entries.push({
        text: getRandomEntry(),
        date: date
      });
    }
  }
  
  entries.sort((a, b) => a.date - b.date);
  return entries;
}

async function insertEntries() {
  try {
    console.log('═'.repeat(60));
    console.log('  CALILY - Bulk Entry Insert (Oct 1 - Dec 10, 2025)');
    console.log('═'.repeat(60));
    console.log('\nConnecting to MongoDB...');
    await mongoose.connect(MONGODB_URI);
    console.log('✓ Connected to MongoDB\n');

    // ⚠️ UPDATE THIS EMAIL TO MATCH YOUR ACCOUNT
    const userEmail = 'avaraper@me.com';
    
    const user = await User.findOne({ email: userEmail });
    
    if (!user) {
      console.error(`✗ User not found with email: ${userEmail}`);
      console.log('\n⚠️  IMPORTANT: Update the email on line 136 to match your account!\n');
      process.exit(1);
    }

    console.log(`✓ Found user: ${user.name} (${user.email})`);
    console.log('\n' + '─'.repeat(60));
    
    const sampleEntries = generateSampleEntries();
    console.log(`\n📝 Preparing ${sampleEntries.length} journal entries...`);
    console.log(`📅 Date range: October 1 - December 10, 2025\n`);

    // Create entries with userId
    const entries = sampleEntries.map(sample => ({
      userId: user._id,
      text: sample.text,
      createdAt: sample.date,
      updatedAt: sample.date,
      tags: []
    }));

    // Insert all entries
    console.log('Inserting entries into database...');
    const result = await Entry.insertMany(entries);
    
    console.log('\n' + '═'.repeat(60));
    console.log('  ✓ SUCCESS! ENTRIES INSERTED');
    console.log('═'.repeat(60));
    console.log(`\n📊 Summary:`);
    console.log(`    User: ${user.name}`);
    console.log(`    Email: ${user.email}`);
    console.log(`    Date range: Oct 1 - Dec 10, 2025`);
    console.log(`    Total entries: ${result.length}`);
    console.log(`    October: ~${Math.round(result.length * 0.4)} entries`);
    console.log(`    November: ~${Math.round(result.length * 0.45)} entries`);
    console.log(`    December: ~${Math.round(result.length * 0.15)} entries`);
    console.log('\n' + '═'.repeat(60));
    console.log('\n✨ All done! Your journal now has entries spanning:');
    console.log('   • October 2025 (full month)');
    console.log('   • November 2025 (full month)');
    console.log('   • December 1-10, 2025\n');
    console.log('🔄 Refresh your browser to see all the entries!\n');
    console.log('📈 Perfect for testing AI trend analysis over time.\n');
    
  } catch (error) {
    console.error('\n✗ Error:', error.message);
    console.error(error);
  } finally {
    await mongoose.connection.close();
    console.log('✓ MongoDB connection closed.\n');
  }
}

insertEntries();