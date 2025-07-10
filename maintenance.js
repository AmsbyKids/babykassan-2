
/**
 * Alice Underhållsverktyg
 * 
 * Detta skript används för att manuellt köra underhåll, tester och inlärning för Alice.
 * Kör med: node maintenance.js [kommando]
 * 
 * Tillgängliga kommandon:
 *   learn     - Kör manuell inlärning från betrodda källor
 *   test      - Kör testsviten för att validera Alices svar
 *   update    - Uppdatera assistenten med senaste informationen
 *   status    - Visa status för systemet
 *   help      - Visa denna hjälptext
 */

const { runManualLearning, updateAssistant } = require('./automaticLearning');
const { runTests } = require('./aliceTests');
const fs = require('fs');

// Formatera datum
function formatDate(date) {
  return new Date(date).toLocaleString('sv-SE');
}

// Visa systemstatus
async function showStatus() {
  console.log("\n📊 SYSTEM STATUS");
  console.log("================================");
  
  try {
    // Kontrollera official_data.json
    if (fs.existsSync('official_data.json')) {
      const officialData = JSON.parse(fs.readFileSync('official_data.json', 'utf8'));
      console.log(`Senast uppdaterad: ${formatDate(officialData.senast_uppdaterad || 'okänt')}`);
      console.log(`Källa: ${officialData.källa || 'okänd'}`);
      
      // Information om automatiskt insamlad data
      if (officialData.automatically_collected) {
        const collectionCount = Object.keys(officialData.automatically_collected).length;
        console.log(`Antal automatiska inlärningssessioner: ${collectionCount}`);
        
        if (collectionCount > 0) {
          const latestCollection = Object.keys(officialData.automatically_collected)
            .sort()
            .pop();
          console.log(`Senaste inlärning: ${formatDate(latestCollection)}`);
        }
      } else {
        console.log("Inga automatiska inlärningssessioner har utförts");
      }
      
      // Information om regelstorlek
      if (officialData.nya_regler_2025) {
        console.log(`Storlek på 2025-regler: ${officialData.nya_regler_2025.length} tecken`);
      } else {
        console.log("Ingen information om 2025-regler finns");
      }
    } else {
      console.log("❌ Filen official_data.json finns inte");
    }
    
    // Kontrollera test_results.json
    if (fs.existsSync('test_results.json')) {
      const testResults = JSON.parse(fs.readFileSync('test_results.json', 'utf8'));
      console.log(`\nSenaste testkörning: ${formatDate(testResults.timestamp)}`);
      console.log(`Testresultat: ${testResults.totalPassed}/${testResults.totalQuestions} tester godkända (${(testResults.overallPassRate * 100).toFixed(1)}%)`);
      
      // Visa eventuella problemområden
      if (testResults.categoryResults) {
        const problemAreas = testResults.categoryResults
          .filter(cat => cat.passRate < 0.7)
          .map(cat => `${cat.category}: ${(cat.passRate * 100).toFixed(1)}%`);
        
        if (problemAreas.length > 0) {
          console.log("\nProblemområden:");
          problemAreas.forEach(area => console.log(`- ${area}`));
        }
      }
    } else {
      console.log("\n⚠️ Inga testresultat tillgängliga");
    }
    
    // Kontrollera cron-loggfil
    if (fs.existsSync('learning_cron.log')) {
      const logContent = fs.readFileSync('learning_cron.log', 'utf8');
      const logLines = logContent.split('\n').filter(line => line.trim());
      
      console.log(`\nCron-aktiviteter: ${logLines.length} loggade händelser`);
      
      // Visa de senaste 3 aktiviteterna
      if (logLines.length > 0) {
        console.log("\nSenaste aktiviteter:");
        logLines.slice(-3).forEach(line => console.log(`- ${line}`));
      }
    } else {
      console.log("\n⚠️ Ingen cron-loggfil tillgänglig");
    }
    
    console.log("\n✅ Statuskontroll slutförd");
    
  } catch (error) {
    console.error("\n❌ Fel vid läsning av systemstatus:", error.message);
  }
}

// Huvudfunktion
async function main() {
  const command = process.argv[2] || 'help';
  
  console.log(`🤖 ALICE UNDERHÅLLSVERKTYG`);
  console.log(`Kommando: ${command}`);
  console.log(`Tidpunkt: ${new Date().toLocaleString('sv-SE')}`);
  console.log("================================");
  
  try {
    switch (command.toLowerCase()) {
      case 'learn':
        console.log("📚 Startar manuell inlärning...");
        const learningResult = await runManualLearning();
        console.log("✅ Inlärning slutförd:", learningResult);
        break;
        
      case 'test':
        console.log("🧪 Startar testkörning...");
        const testResults = await runTests();
        console.log("✅ Tester slutförda");
        break;
        
      case 'update':
        console.log("🔄 Uppdaterar assistenten...");
        await updateAssistant();
        console.log("✅ Assistenten uppdaterad");
        break;
        
      case 'status':
        await showStatus();
        break;
        
      case 'help':
      default:
        console.log(`
Tillgängliga kommandon:
  node maintenance.js learn    - Kör manuell inlärning från betrodda källor
  node maintenance.js test     - Kör testsviten för att validera Alices svar
  node maintenance.js update   - Uppdatera assistenten med senaste informationen
  node maintenance.js status   - Visa status för systemet
  node maintenance.js help     - Visa denna hjälptext
        `);
    }
  } catch (error) {
    console.error(`❌ Fel vid körning av kommando '${command}':`, error);
  }
}

// Kör huvudfunktionen
main().catch(console.error);
