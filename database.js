
const { createClient } = require('@supabase/supabase-js');
const crypto = require('crypto');

// Initialize Supabase client
const supabase = createClient(
  'https://kfspsyuskvgopobngbxq.supabase.co',
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
