
/**
 * Testskript för att validera beräkning av slutdatum för föräldraledighet
 */
const swedishDates = require('./swedishDateCalculator');

function testParentalLeaveCalculation() {
  console.log("=== TESTNING AV FÖRÄLDRALEDIGHETSBERÄKNING ===");
  
  // Scenario 1: Börja 1 april 2025, 180 ersättningsdagar på vardagar
  const startDate1 = new Date(2025, 3, 1); // April 1, 2025
  const endDate1 = swedishDates.calculateParentalLeaveEndDate(startDate1, 180, false);
  console.log(`Scenario 1 - Start: 2025-04-01, 180 vardagar`);
  console.log(`Förväntat slutdatum: 2026-01-07`);
  console.log(`Beräknat slutdatum: ${swedishDates.formatSwedishDate(endDate1)}`);
  console.log(`Formaterat slutdatum: ${swedishDates.formatSwedishDate(endDate1, true)}`);
  console.log();
  
  // Scenario 2: Börja på en helgdag
  const startDate2 = new Date(2025, 11, 25); // December 25, 2025 (Juldagen)
  const endDate2 = swedishDates.calculateParentalLeaveEndDate(startDate2, 20, false);
  console.log(`Scenario 2 - Start: 2025-12-25 (Juldagen), 20 vardagar`);
  console.log(`Beräknat slutdatum: ${swedishDates.formatSwedishDate(endDate2)}`);
  console.log(`Formaterat slutdatum: ${swedishDates.formatSwedishDate(endDate2, true)}`);
  console.log();
  
  // Scenario 3: Test med SGI över taket
  console.log(`Scenario 3 - SGI över taket (600 000 kr) och 5 dagars uttag per vecka i 4 månader`);
  const sgi = 600000;
  const dailyRaw = sgi / 365 * 0.8;
  const dailyCapped = Math.min(dailyRaw, 1250);
  const days = 4 * 4.33 * 5; // 4 månader, 5 dagar/vecka
  const total = dailyCapped * Math.round(days);
  console.log(`SGI: ${sgi} kr`);
  console.log(`Dagersättning okapad: ${Math.round(dailyRaw)} kr`);
  console.log(`Dagersättning efter tak: ${Math.round(dailyCapped)} kr`);
  console.log(`Antal dagar: ${Math.round(days)} dagar`);
  console.log(`Total ersättning: ${Math.round(total)} kr`);
  console.log();
  
  // Kontrollera att påsken 2026 hanteras korrekt
  console.log("\n=== HELGDAGAR 2026 ===");
  const easter2026 = swedishDates.calculateEaster(2026);
  console.log(`Påskdagen 2026: ${swedishDates.formatSwedishDate(easter2026)}`);
  console.log(`Långfredagen 2026: ${swedishDates.formatSwedishDate(swedishDates.addDays(easter2026, -2))}`);
  console.log(`Annandag påsk 2026: ${swedishDates.formatSwedishDate(swedishDates.addDays(easter2026, 1))}`);
}

testParentalLeaveCalculation();


// Testa olika scenarier för specifika uttagsdagar
function testSpecificDaysOfWeek() {
  console.log("\n=== TESTNING AV SPECIFIKA UTTAGSDAGAR ===");
  
  // Scenario 1: Endast måndagar och onsdagar
  const start1 = new Date(2025, 3, 1); // 1 april 2025 (en tisdag)
  const mondayWednesday = [1, 3]; // 1=Måndag, 3=Onsdag
  const end1 = swedishDates.calculateParentalLeaveEndDate(start1, 20, false, mondayWednesday);
  console.log(`Scenario: Start 2025-04-01, 20 dagar (endast måndagar och onsdagar)`);
  console.log(`Beräknat slutdatum: ${swedishDates.formatSwedishDate(end1, true)}`);
  
  // Scenario 2: Endast vardagar (mån-fre)
  const start2 = new Date(2025, 3, 1);
  const weekdays = [1, 2, 3, 4, 5]; // Mån-Fre
  const end2 = swedishDates.calculateParentalLeaveEndDate(start2, 108, false, weekdays);
  console.log(`\nScenario: Start 2025-04-01, 108 dagar (5 dagar/vecka i 5 månader)`);
  console.log(`Beräknat slutdatum: ${swedishDates.formatSwedishDate(end2, true)}`);
  
  // Scenario 3: Alla dagar i veckan
  const start3 = new Date(2025, 3, 1);
  const end3 = swedishDates.calculateParentalLeaveEndDate(start3, 151, true); // 7 dagar/vecka i 5 månader = 151 dagar
  console.log(`\nScenario: Start 2025-04-01, 151 dagar (7 dagar/vecka i 5 månader)`);
  console.log(`Beräknat slutdatum: ${swedishDates.formatSwedishDate(end3, true)}`);
}

// Kör både standardtesterna och de nya testerna
testParentalLeaveCalculation();
testSpecificDaysOfWeek();
