
/**
 * Testskript för att validera de nya precisa beräkningarna
 */
const parentalBenefitCalculator = require('./parentalBenefitCalculator');

// Funktion för att köra tester och visa resultat
function runTests() {
  console.log("=== TESTNING AV FÖRÄLDRAPENNINGSBERÄKNINGAR ===");
  
  // Test 1: SGI under taket, 5 månader, 5 dagar/vecka
  console.log("\nTest 1: SGI under taket, 5 månader, 5 dagar/vecka");
  const test1 = parentalBenefitCalculator.calculateParentalBenefit(
    450000,
    "2025-04-01",
    5, 
    5
  );
  console.log(`SGI: 450 000 kr`);
  console.log(`Daglig ersättning: ${test1.dagligErsättning} kr/dag`);
  console.log(`Antal dagar: ${test1.totalDagar} dagar`);
  console.log(`Total ersättning: ${test1.totalErsättning} kr`);
  console.log(`Slutdatum: ${test1.slutdatum}`);
  
  // Test 2: SGI över taket, 8 månader, 3 dagar/vecka
  console.log("\nTest 2: SGI över taket, 8 månader, 3 dagar/vecka");
  const test2 = parentalBenefitCalculator.calculateParentalBenefit(
    600000,
    "2025-10-15",
    8, 
    3
  );
  console.log(`SGI: 600 000 kr (över taket på ${parentalBenefitCalculator.MAX_SGI} kr)`);
  console.log(`Daglig ersättning: ${test2.dagligErsättning} kr/dag`);
  console.log(`Antal dagar: ${test2.totalDagar} dagar`);
  console.log(`Total ersättning: ${test2.totalErsättning} kr`);
  console.log(`Slutdatum: ${test2.slutdatum}`);
  
  // Test 3: Två perioder med olika uttag
  console.log("\nTest 3: Två perioder med olika uttag");
  const test3 = parentalBenefitCalculator.calculateParentalBenefit(
    500000,
    "2025-03-01",
    3,
    7,
    4,
    5
  );
  console.log(`SGI: 500 000 kr`);
  console.log(`Daglig ersättning: ${test3.dagligErsättning} kr/dag`);
  console.log(`Period 1: ${test3.uttagsdagar1} dagar (3 månader, 7 dagar/vecka)`);
  console.log(`Period 2: ${test3.uttagsdagar2} dagar (4 månader, 5 dagar/vecka)`);
  console.log(`Total antal dagar: ${test3.totalDagar} dagar`);
  console.log(`Total ersättning: ${test3.totalErsättning} kr`);
  console.log(`Period 1 slutdatum: ${test3.period1End}`);
  console.log(`Slutdatum: ${test3.slutdatum}`);
  
  // Bonus test: Beräkna månadsersättning före skatt
  console.log("\nBonus: Månadsersättning före skatt");
  console.log(`Test 1 (5 dagar/vecka): cirka ${test1.månatligErsättningBrutto} kr/månad brutto`);
  console.log(`Test 2 (3 dagar/vecka): cirka ${test2.månatligErsättningBrutto} kr/månad brutto`);
  console.log(`Test 3 (Period 1, 7 dagar/vecka): cirka ${test3.månatligErsättningBrutto} kr/månad brutto`);
}

// Kör testerna
runTests();
