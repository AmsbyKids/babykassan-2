
const { createClient } = require('@supabase/supabase-js');
const crypto = require('crypto');

// Initialize Supabase client
const supabase = createClient(
  'https://kfspsyuskvgopobngbxq.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imtmc3BzeXVza3Znb3BvYm5nYnhxIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDI5OTY3OTUsImV4cCI6MjA1ODU3Mjc5NX0.rcsIY0u1WWSmPGwtPrK_SUYu4Yuk0PNANOcEwe111m0'
);

async function logInteraction(data) {
  try {
    if (!data.sessionId || !data.message) {
      console.error('Missing required data for logging:', data);
      return false;
    }

    const interactionData = {
      id: crypto.randomUUID(),
      session_id: data.sessionId,
      timestamp: new Date().toISOString(),
      fråga: data.isUser ? data.message : null,
      svar: !data.isUser ? data.message : null,
      device_type: data.deviceType || null,
      browser: data.browser || null,
      language: data.language || null,
      kommun: data.kommun || null,
      region: data.region || null,
      postal_code: data.postalCode || null,
      income_level: data.incomeLevel || null,
      familjesituation: data.familySituation || null,
      antal_barn: data.numberOfChildren || null,
      barn_fodelsear: data.childrenBirthYears || null,
      sgi: data.sgi || null,
      sentiment_score: data.sentimentScore || null,
      tags: data.tags || null,
      kategori: data.category || null,
      komplexitet: data.complexity || null
    };

    const { error } = await supabase
      .from('interactions')
      .insert([interactionData]);

    if (error) {
      console.error('Supabase error:', error.message);
      return false;
    }

    console.log('Successfully logged interaction');
    return true;
  } catch (err) {
    console.error('Error logging interaction:', err.message);
    return false;
  }
}

module.exports = {
  logInteraction
};
