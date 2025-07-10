
/**
 * Exempel på exakt kalkylering av föräldraledighet med swedishDateCalculator
 */
const swedishDates = require('./swedishDateCalculator');

// Funktion för att beräkna exakt antal uttagsdagar och ersättning
function calculateParentalLeave(sgi, startDate, months1, daysPerWeek1, months2, daysPerWeek2) {
    const ersättningsnivå = 0.8;
    const maxDagligErsättning = 1250;
    const dagarPerÅr = 365;

    // Beräkna daglig ersättning (SGI / 365 * 80% upp till maxbelopp)
    let dagligErsättning = Math.min((sgi / dagarPerÅr) * ersättningsnivå, maxDagligErsättning);
    dagligErsättning = Math.round(dagligErsättning);

    // Beräkna exakt antal uttagsdagar i varje period
    let uttagsdagar1 = swedishDates.calculateExactParentalLeaveDays(months1, daysPerWeek1);
    let uttagsdagar2 = swedishDates.calculateExactParentalLeaveDays(months2, daysPerWeek2);
    let totalDagar = uttagsdagar1 + uttagsdagar2;

    // Beräkna total ersättning
    let ersättning1 = uttagsdagar1 * dagligErsättning;
    let ersättning2 = uttagsdagar2 * dagligErsättning;
    let totalErsättning = Math.round(ersättning1 + ersättning2);

    // Beräkna slutdatum genom att addera faktiska uttagsdagar till startdatum
    let startDatum = new Date(startDate);
    
    // Beräkna slutdatum för första perioden
    let slutdatumPeriod1 = swedishDates.calculatePreciseEndDate(
        startDatum, 
        months1, 
        daysPerWeek1, 
        daysPerWeek1 === 7, // räkna helger om det är 7 dagar/vecka
        daysPerWeek1 === 5 ? [1, 2, 3, 4, 5] : null // vardagar om 5 dagar/vecka
    );
    
    // Beräkna slutdatum för andra perioden, med start från slutet av första perioden
    let slutdatum = swedishDates.calculatePreciseEndDate(
        slutdatumPeriod1, 
        months2, 
        daysPerWeek2, 
        daysPerWeek2 === 7, // räkna helger om det är 7 dagar/vecka
        daysPerWeek2 === 5 ? [1, 2, 3, 4, 5] : null // vardagar om 5 dagar/vecka
    );

    // Returnera resultatet
    return {
        dagligErsättning: dagligErsättning,
        totalErsättning: totalErsättning,
        totalDagar: totalDagar,
        uttagsdagar1: uttagsdagar1,
        uttagsdagar2: uttagsdagar2,
        slutdatum: swedishDates.formatSwedishDate(slutdatum, true)
    };
}

// Exempelanrop till funktionen
let resultat = calculateParentalLeave(770000, "2026-11-05", 5, 5, 7, 3);
console.log(`Daglig ersättning: ${resultat.dagligErsättning} kr/dag`);
console.log(`Totalt antal uttagsdagar: ${resultat.totalDagar} (${resultat.uttagsdagar1} + ${resultat.uttagsdagar2})`);
console.log(`Total ersättning: ${resultat.totalErsättning} kr`);
console.log(`Slutdatum: ${resultat.slutdatum}`);

// Ytterligare exempel
console.log("\n=== Mer exempel ===");
let exempel2 = calculateParentalLeave(580000, "2025-03-01", 3, 7, 4, 5);
console.log(`Exempel 2 (SGI 580000, 3 mån med 7 dagar/vecka + 4 mån med 5 dagar/vecka):`);
console.log(`Daglig ersättning: ${exempel2.dagligErsättning} kr/dag`);
console.log(`Totalt antal uttagsdagar: ${exempel2.totalDagar} (${exempel2.uttagsdagar1} + ${exempel2.uttagsdagar2})`);
console.log(`Total ersättning: ${exempel2.totalErsättning} kr`);
console.log(`Slutdatum: ${exempel2.slutdatum}`);
