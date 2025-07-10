
const axios = require('axios');
const fs = require('fs');
const OpenAI = require('openai');
const { isRelevantQuestion } = require('./openai.service');

// Testscenarier för Alice
const testScenarios = [
  {
    category: "Grundläggande förståelse",
    questions: [
      {
        question: "Hur många föräldradagar får man totalt per barn?",
        expectedInfo: ["480", "totalt", "dagar"]
      },
      {
        question: "När kan man tidigast ta ut föräldrapenning?",
        expectedInfo: ["60", "dagar", "innan", "beräknad"]
      }
    ]
  },
  {
    category: "SGI-skydd",
    questions: [
      {
        question: "Hur skyddar jag min SGI under föräldraledigheten?",
        expectedInfo: ["SGI-skydd", "föräldraledighet"]
      },
      {
        question: "Måste jag ta ut 5 dagar i veckan för att skydda min SGI?",
        expectedInfo: ["nej", "inte nödvändigt", "föräldraledighet"] 
      }
    ]
  },
  {
    category: "2025-regler",
    questions: [
      {
        question: "Vad händer med föräldrapenning på sjukpenningnivå för arbetsfria dagar från april 2025?",
        expectedInfo: ["april 2025", "arbetsfria", "dagar"]
      },
      {
        question: "Ändras reglerna för dubbeldagar i april 2025?",
        expectedInfo: ["dubbeldagar", "2025"]
      }
    ]
  },
  {
    category: "Felaktiga påståenden",
    questions: [
      {
        question: "Stämmer det att man kan ta ut föräldrapenning på sjukpenningnivå för arbetsfria dagar utan att ta ut någon mer dag från april 2025?",
        expectedInfo: ["felaktigt", "nej", "måste ta ut", "arbetsdagar"]
      },
      {
        question: "Måste jag ta ut 5 hela föräldrapenningdagar per vecka för att skydda min SGI?",
        expectedInfo: ["felaktigt", "nej", "behöver inte", "5 dagar"]
      }
    ]
  },
  {
    category: "Irrelevanta frågor",
    questions: [
      {
        question: "Vad tycker du om fotboll?",
        irrelevantExpected: true
      },
      {
        question: "Berätta om Stockholms historia",
        irrelevantExpected: true
      }
    ]
  }
];

// Evalueringsfunktion för testresultat
function evaluateResponse(response, testCase) {
  if (testCase.irrelevantExpected) {
    // Kontrollera att Alice identifierade frågan som irrelevant
    return {
      passed: response.toLowerCase().includes("specialiserad på föräldrapenning") && 
              response.toLowerCase().includes("hjälpa till med frågor inom detta område"),
      reason: testCase.irrelevantExpected ? "Förväntade irrelevant svar" : "Förväntade relevant svar",
      relevantIdentificationCorrect: response.toLowerCase().includes("specialiserad på föräldrapenning")
    };
  } else {
    // Kontrollera att svar innehåller förväntad information
    const allExpectedInfoPresent = testCase.expectedInfo.every(info => 
      response.toLowerCase().includes(info.toLowerCase())
    );
    
    return {
      passed: allExpectedInfoPresent,
      reason: allExpectedInfoPresent ? "Alla förväntade nyckelord hittades" : "Saknar förväntade nyckelord",
      missingKeywords: testCase.expectedInfo.filter(info => 
        !response.toLowerCase().includes(info.toLowerCase())
      )
    };
  }
}

// Testa relevansdetekteringsfunktionen
function testRelevanceDetection() {
  console.log("\n🔍 TESTAR RELEVANSDETEKTERING");
  
  const relevantQuestions = [
    "När kan jag ta ut föräldrapenning?",
    "Hur mycket föräldrapenning får jag?",
    "Vad händer med min SGI under föräldraledighet?",
    "Hur länge kan jag vara hemma med mitt barn?",
    "Jag funderar på reglerna kring föräldradagar och barnets ålder"
  ];
  
  const irrelevantQuestions = [
    "Vad är svaret på livets gåta?",
    "Berätta om historien bakom Stockholm",
    "Hur lagar man köttbullar?",
    "Vilken är din favoritfilm?",
    "Hur blir vädret imorgon?"
  ];
  
  let relevantPassed = 0;
  let irrelevantPassed = 0;
  
  console.log("\n✅ RELEVANTA FRÅGOR:");
  relevantQuestions.forEach(q => {
    const result = isRelevantQuestion(q);
    console.log(`  ${result ? '✓' : '✗'} "${q}"`);
    if (result) relevantPassed++;
  });
  
  console.log("\n❌ IRRELEVANTA FRÅGOR:");
  irrelevantQuestions.forEach(q => {
    const result = isRelevantQuestion(q);
    console.log(`  ${!result ? '✓' : '✗'} "${q}"`);
    if (!result) irrelevantPassed++;
  });
  
  console.log(`\nResultat: ${relevantPassed}/5 relevanta identifierade, ${irrelevantPassed}/5 irrelevanta identifierade`);
  return {
    relevantDetectionRate: relevantPassed / relevantQuestions.length,
    irrelevantDetectionRate: irrelevantPassed / irrelevantQuestions.length
  };
}

// Direkt test med OpenAI utan att gå via servern
async function testWithOpenAI() {
  const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
  });

  console.log("\n🧠 TESTAR DIREKTA OPENAI-SVAR");
  
  // Läs officiell data
  let officialData = {};
  try {
    if (fs.existsSync('official_data.json')) {
      officialData = JSON.parse(fs.readFileSync('official_data.json', 'utf8'));
    }
  } catch (err) {
    console.error('Kunde inte läsa official_data.json:', err);
    return { success: false, error: 'Kunde inte läsa datakälla' };
  }
  
  // Skapa kunskapsbas
  const rules2025 = officialData.nya_regler_2025 || 'Information om 2025 är inte tillgänglig ännu.';
  
  let testResults = [];
  let totalPassed = 0;
  
  // Testa en kategori i taget
  for (const category of testScenarios) {
    console.log(`\n📋 Kategori: ${category.category}`);
    
    const categoryResults = [];
    
    for (const testCase of category.questions) {
      console.log(`   Testar: "${testCase.question}"`);
      
      try {
        // Förbered prompt med samma struktur som används i aiQueryService
        const promptText = `
ANVÄNDARENS FRÅGA: 
${testCase.question}

KUNSKAPSBAS OM FÖRÄLDRAPENNING 2025:
${rules2025}

DETALJERADE INSTRUKTIONER:
1. Besvara användarens fråga baserat ENDAST på informationen i kunskapsbasen ovan.
2. Om informationen saknas i kunskapsbasen, var ärlig och säg att du inte har denna information.
3. Var EXTRA NOGGRANN med att inte sprida felaktig information om föräldrapenning 2025.
4. Strukturera svaret tydligt med rubriker och punktlistor för bättre läsbarhet.
5. Ange alltid källa och datum för informationen.
`;
        
        // Anropa OpenAI API
        const response = await openai.chat.completions.create({
          model: 'gpt-4o',
          messages: [
            {
              role: 'system',
              content: 'Du är en expert på svensk föräldrapenning 2025 och ger bara korrekt information baserad på verifierade officiella källor.'
            },
            {
              role: 'user',
              content: promptText
            }
          ],
          temperature: 0.3,
          max_tokens: 500
        });
        
        const answer = response.choices[0].message.content;
        
        // Evaluera resultatet
        const evaluation = evaluateResponse(answer, testCase);
        
        // Formatera resultatet för utskrift
        const resultSymbol = evaluation.passed ? '✅' : '❌';
        console.log(`   ${resultSymbol} Resultat: ${evaluation.passed ? 'GODKÄNT' : 'UNDERKÄNT'} - ${evaluation.reason}`);
        
        if (!evaluation.passed && evaluation.missingKeywords) {
          console.log(`   ℹ️ Saknade nyckelord: ${evaluation.missingKeywords.join(', ')}`);
        }
        
        if (evaluation.passed) {
          totalPassed++;
        }
        
        // Spara resultatet
        categoryResults.push({
          question: testCase.question,
          passed: evaluation.passed,
          reason: evaluation.reason,
          answer: answer.substring(0, 100) + '...' // Spara bara början av svaret för läsbarhet
        });
        
      } catch (error) {
        console.error(`   ❌ ERROR: ${error.message}`);
        categoryResults.push({
          question: testCase.question,
          passed: false,
          reason: `Fel: ${error.message}`,
          answer: null
        });
      }
    }
    
    testResults.push({
      category: category.category,
      results: categoryResults,
      passRate: categoryResults.filter(r => r.passed).length / categoryResults.length
    });
  }
  
  // Beräkna övergripande resultat
  const totalQuestions = testScenarios.reduce((sum, category) => sum + category.questions.length, 0);
  const overallPassRate = totalPassed / totalQuestions;
  
  // Skriv resultatet till fil
  const testReport = {
    timestamp: new Date().toISOString(),
    overallPassRate,
    totalQuestions,
    totalPassed,
    categoryResults: testResults
  };
  
  fs.writeFileSync('test_results.json', JSON.stringify(testReport, null, 2));
  
  console.log(`\n📊 TESTRESULTAT: ${totalPassed}/${totalQuestions} tester godkända (${(overallPassRate * 100).toFixed(1)}%)`);
  testResults.forEach(category => {
    console.log(`   ${category.category}: ${(category.passRate * 100).toFixed(1)}% godkända`);
  });
  
  return testReport;
}

// Huvudfunktion för att köra tester
async function runTests() {
  console.log("🧪 STARTAR TESTER AV ALICE");
  console.log("================================");
  
  // Testa relevansdetektering
  const relevanceResults = testRelevanceDetection();
  
  // Testa svar direkt med OpenAI
  const openaiResults = await testWithOpenAI();
  
  // Sammanställ resultat
  const finalResults = {
    timestamp: new Date().toISOString(),
    relevanceDetection: relevanceResults,
    answerAccuracy: {
      overallPassRate: openaiResults.overallPassRate,
      totalPassed: openaiResults.totalPassed,
      totalQuestions: openaiResults.totalQuestions
    }
  };
  
  // Skriv slutrapport
  console.log("\n📝 SAMMANSTÄLLNING");
  console.log("================================");
  console.log(`Testdatum: ${new Date().toLocaleString('sv-SE')}`);
  console.log(`Relevansdetektering: ${(relevanceResults.relevantDetectionRate * 100).toFixed(1)}% / ${(relevanceResults.irrelevantDetectionRate * 100).toFixed(1)}%`);
  console.log(`Svarsriktighet: ${(openaiResults.overallPassRate * 100).toFixed(1)}%`);
  
  if (openaiResults.overallPassRate >= 0.8) {
    console.log("\n✅ SLUTSATS: Alice är redo för marknadsföring med goda resultat.");
  } else if (openaiResults.overallPassRate >= 0.6) {
    console.log("\n⚠️ SLUTSATS: Alice presterar acceptabelt men behöver förbättringar innan full lansering.");
  } else {
    console.log("\n❌ SLUTSATS: Alice behöver betydande förbättringar innan lansering.");
  }
  
  return finalResults;
}

// Exportera testfunktioner
module.exports = {
  runTests,
  testRelevanceDetection,
  testWithOpenAI
};

// Om filen körs direkt, starta tester
if (require.main === module) {
  runTests().catch(err => {
    console.error("❌ Fel vid testning:", err);
  });
}
/**
 * Testskript för att verifiera korrekta beräkningar av föräldrapenning
 */

function testSGICalculations() {
  console.log("=== TEST AV SGI-BERÄKNINGAR ===");
  
  // Test 1: SGI under taket
  const sgi1 = 450000;
  const dailyAmount1 = sgi1 / 365 * 0.8;
  console.log(`Test 1: SGI ${sgi1} kr ger dagersättning ${Math.round(dailyAmount1)} kr (under taket 1 250 kr)`);
  
  // Test 2: SGI vid taket (räkna fram värdet)
  const maxDaily = 1250;
  const sgiAtCap = Math.round((maxDaily * 365) / 0.8);
  console.log(`Test 2: SGI-värdet som ger maxbeloppet (1 250 kr) är ${sgiAtCap} kr`);
  
  // Test 3: SGI över taket
  const sgi3 = 600000;
  const dailyRaw3 = sgi3 / 365 * 0.8;
  const dailyCapped3 = Math.min(dailyRaw3, maxDaily);
  console.log(`Test 3: SGI ${sgi3} kr ger okapad dagersättning ${Math.round(dailyRaw3)} kr`);
  console.log(`        Efter kapad till taket: ${Math.round(dailyCapped3)} kr`);
}

function testDayCalculations() {
  console.log("\n=== TEST AV DAGSBERÄKNINGAR ===");
  
  // Test 1: Omvandla månader till dagar (5 dagar/vecka)
  const months1 = 5;
  const daysPerWeek1 = 5;
  const days1 = months1 * 4.33 * daysPerWeek1;
  console.log(`Test 1: ${months1} månader med ${daysPerWeek1} dagar/vecka ger ${Math.round(days1)} dagar`);
  
  // Test 2: Omvandla månader till dagar (3 dagar/vecka)
  const months2 = 8;
  const daysPerWeek2 = 3;
  const days2 = months2 * 4.33 * daysPerWeek2;
  console.log(`Test 2: ${months2} månader med ${daysPerWeek2} dagar/vecka ger ${Math.round(days2)} dagar`);
  
  // Test 3: Omvandla månader till dagar (7 dagar/vecka)
  const months3 = 6;
  const daysPerWeek3 = 7;
  const days3 = months3 * 4.33 * daysPerWeek3;
  console.log(`Test 3: ${months3} månader med ${daysPerWeek3} dagar/vecka ger ${Math.round(days3)} dagar`);
}

function testTotalCompensationCalculations() {
  console.log("\n=== TEST AV TOTAL ERSÄTTNING ===");
  
  // Test med SGI under taket
  const sgi1 = 450000;
  const dailyAmount1 = sgi1 / 365 * 0.8;
  const days1 = 5 * 4.33 * 5; // 5 månader, 5 dagar/vecka
  const total1 = dailyAmount1 * Math.round(days1);
  console.log(`Test 1: SGI ${sgi1} kr, ${Math.round(days1)} dagar, ger total ersättning ${Math.round(total1)} kr`);
  
  // Test med SGI över taket
  const sgi2 = 600000;
  const dailyRaw2 = sgi2 / 365 * 0.8;
  const dailyCapped2 = Math.min(dailyRaw2, 1250);
  const days2 = 8 * 4.33 * 3; // 8 månader, 3 dagar/vecka
  const total2 = dailyCapped2 * Math.round(days2);
  console.log(`Test 2: SGI ${sgi2} kr, ${Math.round(days2)} dagar, ger total ersättning ${Math.round(total2)} kr`);
}

// Kör alla tester
testSGICalculations();
testDayCalculations();
testTotalCompensationCalculations();
