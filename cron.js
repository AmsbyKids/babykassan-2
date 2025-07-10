
const cron = require('node-cron');
const { collectNewInformation, updateAssistant } = require('./automaticLearning');
const { runTests } = require('./aliceTests');
const fs = require('fs');

// Funktion för att logga händelser
function logEvent(message) {
  const timestamp = new Date().toISOString();
  const logEntry = `${timestamp} - ${message}\n`;
  
  // Logga till konsol
  console.log(logEntry);
  
  // Spara till loggfil
  fs.appendFile('learning_cron.log', logEntry, (err) => {
    if (err) console.error('Kunde inte skriva till loggfil:', err);
  });
}

// Schemalägg automatisk inlärning vid specifika tider med olika intensitet
logEvent('🚀 CRON-JOBB INITIERAS');

// Daglig inlärning - kör varje morgon kl 05:00
cron.schedule('0 5 * * *', async () => {
  logEvent('📚 STARTAR DAGLIG INLÄRNING');
  try {
    const result = await collectNewInformation();
    logEvent(`📊 DAGLIG INLÄRNING SLUTFÖRD: ${result.success ? 'Lyckades' : 'Misslyckades'} - ${result.message}`);
    
    // Kör tester efter inlärning för att kontrollera kvalitet
    logEvent('🧪 STARTAR AUTOMATISKA TESTER EFTER INLÄRNING');
    const testResults = await runTests();
    logEvent(`📋 TESTRESULTAT: Svarsriktighet ${(testResults.answerAccuracy.overallPassRate * 100).toFixed(1)}%`);
  } catch (error) {
    logEvent(`❌ FEL VID DAGLIG INLÄRNING: ${error.message}`);
  }
});

// Extra inlärning - kör varje måndag, onsdag och fredag kl 14:00
cron.schedule('0 14 * * 1,3,5', async () => {
  logEvent('📚 STARTAR EXTRA INLÄRNING (FLERA DAGAR I VECKAN)');
  try {
    const result = await collectNewInformation();
    logEvent(`📊 EXTRA INLÄRNING SLUTFÖRD: ${result.success ? 'Lyckades' : 'Misslyckades'} - ${result.message}`);
  } catch (error) {
    logEvent(`❌ FEL VID EXTRA INLÄRNING: ${error.message}`);
  }
});

// Specialinlärning - kör första dagen i varje månad för djupare genomgång
cron.schedule('0 3 1 * *', async () => {
  logEvent('🔍 STARTAR MÅNADSVIS DJUPINLÄRNING');
  try {
    // Uppdatera assistenten med nya instruktioner efter inlärning
    await updateAssistant();
    logEvent('✅ ASSISTENTEN UPPDATERAD MED NY INFORMATION');
    
    // Kör tester efter uppdatering
    const testResults = await runTests();
    
    // Spara detaljerad testrapport för månadsgenomsökning
    fs.writeFileSync(`test_results_monthly_${new Date().toISOString().split('T')[0]}.json`, 
                    JSON.stringify(testResults, null, 2));
    
    logEvent(`📋 MÅNADSVIS TEST SLUTFÖRT: Svarsriktighet ${(testResults.answerAccuracy.overallPassRate * 100).toFixed(1)}%`);
  } catch (error) {
    logEvent(`❌ FEL VID MÅNADSVIS INLÄRNING: ${error.message}`);
  }
});

// Övervakningsfunktion - kontrollera att inlärning sker regelbundet
cron.schedule('0 8 * * *', () => {
  try {
    // Kontrollera när senaste inlärningen skedde
    if (fs.existsSync('official_data.json')) {
      const officialData = JSON.parse(fs.readFileSync('official_data.json', 'utf8'));
      const lastUpdate = new Date(officialData.senast_uppdaterad || 0);
      const now = new Date();
      const daysSinceUpdate = Math.floor((now - lastUpdate) / (1000 * 60 * 60 * 24));
      
      if (daysSinceUpdate > 2) {
        logEvent(`⚠️ VARNING: Inlärning har inte skett på ${daysSinceUpdate} dagar!`);
      } else {
        logEvent(`✅ ÖVERVAKNINGSKONTROLL: Senaste inlärning skedde för ${daysSinceUpdate} dagar sedan.`);
      }
    } else {
      logEvent('⚠️ VARNING: official_data.json finns inte. Inlärning har aldrig körts!');
    }
  } catch (error) {
    logEvent(`❌ FEL VID ÖVERVAKNINGSKONTROLL: ${error.message}`);
  }
});

// Starta manuellt vid uppstart för att säkerställa att data finns
(async () => {
  // Vänta 30 sekunder för att säkerställa att systemet har startats helt
  await new Promise(resolve => setTimeout(resolve, 30000));
  
  logEvent('🚀 INITIAL INLÄRNING VID SERVERSTART');
  
  // Kontrollera om officiell data redan finns
  let needsInitialData = true;
  try {
    if (fs.existsSync('official_data.json')) {
      const officialData = JSON.parse(fs.readFileSync('official_data.json', 'utf8'));
      if (officialData.nya_regler_2025 && officialData.nya_regler_2025.length > 100) {
        needsInitialData = false;
        logEvent('ℹ️ Officiell data existerar redan, hoppar över initial inlärning');
      }
    }
  } catch (err) {
    logEvent(`⚠️ Kunde inte läsa official_data.json: ${err.message}`);
  }
  
  if (needsInitialData) {
    try {
      const result = await collectNewInformation();
      logEvent(`📊 INITIAL INLÄRNING SLUTFÖRD: ${result.success ? 'Lyckades' : 'Misslyckades'} - ${result.message}`);
    } catch (error) {
      logEvent(`❌ FEL VID INITIAL INLÄRNING: ${error.message}`);
    }
  }
  
  // Kör tester oavsett om initial inlärning skedde eller inte
  try {
    logEvent('🧪 STARTAR INITIAL TESTKÖRNING');
    const testResults = await runTests();
    logEvent(`📋 INITIAL TESTRESULTAT: Svarsriktighet ${(testResults.answerAccuracy.overallPassRate * 100).toFixed(1)}%`);
  } catch (error) {
    logEvent(`❌ FEL VID INITIAL TESTKÖRNING: ${error.message}`);
  }
})();

logEvent('✅ CRON-JOBB SCHEMALAGDA OCH STARTADE');
console.log('Cron-schema etablerat! Se learning_cron.log för aktivitetslogg.');

module.exports = {
  // Exportera funktioner för manuell körning
  startManualLearning: collectNewInformation,
  runManualTests: runTests
};
