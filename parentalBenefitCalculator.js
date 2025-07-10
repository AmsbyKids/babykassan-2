
// const { DateTime } = require("luxon");
// const swedishDates = require('./swedishDateCalculator');

// // Konstanter för beräkningar
// const MAX_SGI = 588000; // Maxgräns för SGI enligt Försäkringskassan
// const ERSÄTTNINGSNIVÅ = 0.8; // 80% av SGI
// const MAX_DAGLIG_ERSÄTTNING = 1250; // Maximal dagersättning
// const DAGAR_PER_ÅR = 365;
// const VECKOR_PER_MÅNAD = 4.33; // 52 veckor / 12 månader
// const LÄGSTANIVÅ = 250; // Lägstanivå per dag för dagar 391-480

// /**
//  * Beräknar daglig ersättning baserat på SGI
//  * @param {number} sgi - Sjukpenninggrundande inkomst (årsinkomst)
//  * @returns {number} - Daglig ersättning (avrundat till heltal)
//  */
// function calculateDailyBenefit(sgi) {
//   // Justera SGI till maxgränsen om den överstiger den
//   const justeradSGI = Math.min(sgi, MAX_SGI);
  
//   // Beräkna daglig ersättning: (SGI / 365) * 80%
//   const dagligErsättningRå = (justeradSGI / DAGAR_PER_ÅR) * ERSÄTTNINGSNIVÅ;
  
//   // Justera till maximal dagersättning om den överstiger den
//   const dagligErsättning = Math.min(dagligErsättningRå, MAX_DAGLIG_ERSÄTTNING);
  
//   // Avrunda till närmaste heltal
//   return Math.round(dagligErsättning);
// }

// /**
//  * Beräknar total ersättning för en specifik period
//  * @param {number} sgi - Sjukpenninggrundande inkomst (årsinkomst)
//  * @param {string} startDate - Startdatum i format YYYY-MM-DD
//  * @param {string} endDate - Slutdatum i format YYYY-MM-DD
//  * @param {number} daysPerWeek - Antal dagar per vecka (1-7)
//  * @returns {object} - Resultat med total ersättning och antal dagar
//  */
// function calculateTotalBenefitForPeriod(sgi, startDate, endDate, daysPerWeek = 5) {
//   const start = new Date(startDate);
//   const end = new Date(endDate);
  
//   // Beräkna antal dagar mellan datumen
//   const daysDiff = Math.round((end - start) / (1000 * 60 * 60 * 24));
  
//   // Beräkna arbetsdagar baserat på antal dagar per vecka
//   const workdaysRatio = daysPerWeek / 7;
//   const workdays = Math.round(daysDiff * workdaysRatio);
  
//   // Beräkna daglig ersättning
//   const dailyBenefit = calculateDailyBenefit(sgi);
  
//   // Beräkna total ersättning
//   const totalBenefit = dailyBenefit * workdays;
  
//   return {
//     days: workdays,
//     dailyBenefit: dailyBenefit,
//     totalBenefit: totalBenefit,
//     period: {
//       start: startDate,
//       end: endDate,
//       totalDays: daysDiff
//     }
//   };
// }

// /**
//  * Beräknar exakt antal uttagsdagar baserat på månader och dagar per vecka
//  * @param {number} months - Antal månader
//  * @param {number} daysPerWeek - Antal dagar per vecka (1-7)
//  * @returns {number} - Exakt antal uttagsdagar (avrundat till heltal)
//  */
// function calculateExactDays(months, daysPerWeek) {
//   const weeks = months * VECKOR_PER_MÅNAD;
//   const days = weeks * daysPerWeek;
//   return Math.round(days);
// }

// /**
//  * Beräknar slutdatum för föräldraledighet med hög precision
//  * @param {string} startDate - Startdatum i format YYYY-MM-DD
//  * @param {number} days - Antal uttagsdagar
//  * @param {number} daysPerWeek - Antal dagar per vecka (1-7)
//  * @returns {string} - Slutdatum formaterat som "DD månad YYYY"
//  */
// function calculateEndDate(startDate, days, daysPerWeek) {
//   // Konvertera startdatum till Date-objekt
//   const startDateObj = new Date(startDate);
  
//   let countWeekends = daysPerWeek === 7;
//   let specificDays = null;
  
//   // Om daysPerWeek är 5, använd endast vardagar (mån-fre)
//   if (daysPerWeek === 5) {
//     specificDays = [1, 2, 3, 4, 5]; // 1=Måndag, 2=Tisdag, osv.
//   }
  
//   // Beräkna slutdatum med swedishDateCalculator för maximal precision
//   const endDateObj = swedishDates.calculateParentalLeaveEndDate(
//     startDateObj, 
//     days, 
//     countWeekends, 
//     specificDays
//   );
  
//   // Formatera slutdatum på svenskt sätt
//   return swedishDates.formatSwedishDate(endDateObj, true);
// }

// /**
//  * Fullständig beräkning av föräldrapenning med hög precision
//  * @param {number} sgi - Sjukpenninggrundande inkomst (årsinkomst)
//  * @param {string} startDate - Startdatum i format YYYY-MM-DD
//  * @param {number} months1 - Antal månader för första perioden
//  * @param {number} daysPerWeek1 - Antal dagar per vecka för första perioden (1-7)
//  * @param {number} months2 - Antal månader för andra perioden (kan vara 0)
//  * @param {number} daysPerWeek2 - Antal dagar per vecka för andra perioden (1-7)
//  * @param {boolean} includeLowLevelDays - Om lägstanivådagar ska inkluderas i beräkningen
//  * @returns {object} - Resultat med detaljerade beräkningar
//  */
// function calculateParentalBenefit(sgi, startDate, months1, daysPerWeek1, months2 = 0, daysPerWeek2 = 0, includeLowLevelDays = false) {
//   // Beräkna daglig ersättning på sjukpenningnivå
//   const dagligErsättning = calculateDailyBenefit(sgi);
  
//   // Beräkna exakt antal uttagsdagar för period 1
//   const uttagsdagar1 = calculateExactDays(months1, daysPerWeek1);
  
//   // Beräkna exakt antal uttagsdagar för period 2 (om den finns)
//   const uttagsdagar2 = months2 > 0 ? calculateExactDays(months2, daysPerWeek2) : 0;
  
//   // Beräkna totalt antal uttagsdagar
//   const totalDagar = uttagsdagar1 + uttagsdagar2;
  
//   // Beräkna sjukpenningnivådagar och lägstanivådagar
//   const sjukpenningNivåDagar = Math.min(totalDagar, 390);
//   const lägstaNivåDagar = includeLowLevelDays ? Math.max(0, totalDagar - 390) : 0;
  
//   // Beräkna total ersättning
//   const ersättningSjukpenningNivå = sjukpenningNivåDagar * dagligErsättning;
//   const ersättningLägstaNivå = lägstaNivåDagar * LÄGSTANIVÅ;
//   const totalErsättning = Math.round(ersättningSjukpenningNivå + ersättningLägstaNivå);
  
//   // Beräkna slutdatum för period 1
//   const startDateObj = new Date(startDate);
//   let period1EndDate = null;
  
//   if (months1 > 0) {
//     const countWeekends1 = daysPerWeek1 === 7;
//     const specificDays1 = daysPerWeek1 === 5 ? [1, 2, 3, 4, 5] : null;
    
//     period1EndDate = swedishDates.calculateParentalLeaveEndDate(
//       startDateObj, 
//       uttagsdagar1, 
//       countWeekends1, 
//       specificDays1
//     );
//   }
  
//   // Beräkna slutdatum för hela ledigheten
//   let slutdatum = null;
  
//   if (months2 > 0 && period1EndDate) {
//     const countWeekends2 = daysPerWeek2 === 7;
//     const specificDays2 = daysPerWeek2 === 5 ? [1, 2, 3, 4, 5] : null;
    
//     slutdatum = swedishDates.calculateParentalLeaveEndDate(
//       period1EndDate, 
//       uttagsdagar2, 
//       countWeekends2, 
//       specificDays2
//     );
//   } else {
//     slutdatum = period1EndDate;
//   }
  
//   // Formatera slutdatum på svenskt sätt
//   const formattedSlutdatum = swedishDates.formatSwedishDate(slutdatum, true);
  
//   // Returnera detaljerat resultat
//   return {
//     sgi: sgi,
//     justeradSGI: Math.min(sgi, MAX_SGI),
//     dagligErsättning: dagligErsättning,
//     uttagsdagar1: uttagsdagar1,
//     uttagsdagar2: uttagsdagar2,
//     totalDagar: totalDagar,
//     totalErsättning: totalErsättning,
//     period1End: period1EndDate ? swedishDates.formatSwedishDate(period1EndDate, true) : null,
//     slutdatum: formattedSlutdatum,
//     månatligErsättningBrutto: Math.round(dagligErsättning * (daysPerWeek1 * VECKOR_PER_MÅNAD))
//   };
// }

// // Exportera funktionerna för användning i andra moduler
// module.exports = {
//   calculateDailyBenefit,
//   calculateExactDays,
//   calculateEndDate,
//   calculateParentalBenefit,
//   MAX_SGI,
//   ERSÄTTNINGSNIVÅ,
//   MAX_DAGLIG_ERSÄTTNING,
//   DAGAR_PER_ÅR,
//   VECKOR_PER_MÅNAD
// };


// -----------------------------------------
const { DateTime } = require("luxon");
const swedishDates = require('./swedishDateCalculator');

// === Ny funktion för dubbeldagsberäkning ===
/**
 * Beräknar dubbeldagar och saldo för två föräldrar.
 * @param {number[]} parent1Schedule - dagar per månad för förälder 1
 * @param {number[]} parent2Schedule - dagar per månad för förälder 2
 * @param {number} parent1Start - startdagar för förälder 1 (default 390)
 * @param {number} parent2Start - startdagar för förälder 2 (default 390)
 * @param {number} maxDoubleDays - max dubbeldagar (default 90)
 * @returns {object} - Per månad: dubbeldagar, egna dagar, saldo per förälder och dubbeldagar kvar
 */
function calculateDoubleDaysAndBalances(
  parent1Schedule,
  parent2Schedule,
  parent1Start = 390,
  parent2Start = 390,
  maxDoubleDays = 90
) {
  let saldo1 = parent1Start;
  let saldo2 = parent2Start;
  let doubleDaysUsed = 0;
  let doubleDaysLeft = maxDoubleDays;
  const results = [];

  for (let i = 0; i < Math.max(parent1Schedule.length, parent2Schedule.length); i++) {
    const d1 = parent1Schedule[i] || 0;
    const d2 = parent2Schedule[i] || 0;
    const doubleDays = Math.min(d1, d2, doubleDaysLeft);
    const single1 = d1 - doubleDays;
    const single2 = d2 - doubleDays;

    saldo1 -= (doubleDays + single1);
    saldo2 -= (doubleDays + single2);
    doubleDaysLeft -= doubleDays;
    doubleDaysUsed += doubleDays;

    results.push({
      month: i + 1,
      doubleDays,
      single1,
      single2,
      saldo1: Math.max(saldo1, 0),
      saldo2: Math.max(saldo2, 0),
      doubleDaysLeft: Math.max(doubleDaysLeft, 0)
    });
  }

  return {
    results,
    doubleDaysUsed,
    saldo1: Math.max(saldo1, 0),
    saldo2: Math.max(saldo2, 0),
    doubleDaysLeft: Math.max(doubleDaysLeft, 0)
  };
}
// === SLUT på ny kod för dubbeldagsberäkning ===


// Konstanter för beräkningar
const MAX_SGI = 588000; // Maxgräns för SGI enligt Försäkringskassan
const ERSÄTTNINGSNIVÅ = 0.8; // 80% av SGI
const MAX_DAGLIG_ERSÄTTNING = 1250; // Maximal dagersättning
const DAGAR_PER_ÅR = 365;
const VECKOR_PER_MÅNAD = 4.33; // 52 veckor / 12 månader
const LÄGSTANIVÅ = 250; // Lägstanivå per dag för dagar 391-480

/**
 * Beräknar daglig ersättning baserat på SGI
 * @param {number} sgi - Sjukpenninggrundande inkomst (årsinkomst)
 * @returns {number} - Daglig ersättning (avrundat till heltal)
 */
function calculateDailyBenefit(sgi) {
  // Justera SGI till maxgränsen om den överstiger den
  const justeradSGI = Math.min(sgi, MAX_SGI);
  
  // Beräkna daglig ersättning: (SGI / 365) * 80%
  const dagligErsättningRå = (justeradSGI / DAGAR_PER_ÅR) * ERSÄTTNINGSNIVÅ;
  
  // Justera till maximal dagersättning om den överstiger den
  const dagligErsättning = Math.min(dagligErsättningRå, MAX_DAGLIG_ERSÄTTNING;
  
  // Avrunda till närmaste heltal
  return Math.round(dagligErsättning);
}

/**
 * Beräknar total ersättning för en specifik period
 * @param {number} sgi - Sjukpenninggrundande inkomst (årsinkomst)
 * @param {string} startDate - Startdatum i format YYYY-MM-DD
 * @param {string} endDate - Slutdatum i format YYYY-MM-DD
 * @param {number} daysPerWeek - Antal dagar per vecka (1-7)
 * @returns {object} - Resultat med total ersättning och antal dagar
 */
function calculateTotalBenefitForPeriod(sgi, startDate, endDate, daysPerWeek = 5) {
  const start = new Date(startDate);
  const end = new Date(endDate);
  
  // Beräkna antal dagar mellan datumen
  const daysDiff = Math.round((end - start) / (1000 * 60 * 60 * 24));
  
  // Beräkna arbetsdagar baserat på antal dagar per vecka
  const workdaysRatio = daysPerWeek / 7;
  const workdays = Math.round(daysDiff * workdaysRatio);
  
  // Beräkna daglig ersättning
  const dailyBenefit = calculateDailyBenefit(sgi);
  
  // Beräkna total ersättning
  const totalBenefit = dailyBenefit * workdays;
  
  return {
    days: workdays,
    dailyBenefit: dailyBenefit,
    totalBenefit: totalBenefit,
    period: {
      start: startDate,
      end: endDate,
      totalDays: daysDiff
    }
  };
}

/**
 * Beräknar exakt antal uttagsdagar baserat på månader och dagar per vecka
 * @param {number} months - Antal månader
 * @param {number} daysPerWeek - Antal dagar per vecka (1-7)
 * @returns {number} - Exakt antal uttagsdagar (avrundat till heltal)
 */
function calculateExactDays(months, daysPerWeek) {
  const weeks = months * VECKOR_PER_MÅNAD;
  const days = weeks * daysPerWeek;
  return Math.round(days);
}

/**
 * Beräknar slutdatum för föräldraledighet med hög precision
 * @param {string} startDate - Startdatum i format YYYY-MM-DD
 * @param {number} days - Antal uttagsdagar
 * @param {number} daysPerWeek - Antal dagar per vecka (1-7)
 * @returns {string} - Slutdatum formaterat som "DD månad YYYY"
 */
function calculateEndDate(startDate, days, daysPerWeek) {
  // Konvertera startdatum till Date-objekt
  const startDateObj = new Date(startDate);
  
  let countWeekends = daysPerWeek === 7;
  let specificDays = null;
  
  // Om daysPerWeek är 5, använd endast vardagar (mån-fre)
  if (daysPerWeek === 5) {
    specificDays = [1, 2, 3, 4, 5]; // 1=Måndag, 2=Tisdag, osv.
  }
  
  // Beräkna slutdatum med swedishDateCalculator för maximal precision
  const endDateObj = swedishDates.calculateParentalLeaveEndDate(
    startDateObj, 
    days, 
    countWeekends, 
    specificDays
  );
  
  // Formatera slutdatum på svenskt sätt
  return swedishDates.formatSwedishDate(endDateObj, true);
}

/**
 * Fullständig beräkning av föräldrapenning med hög precision
 * @param {number} sgi - Sjukpenninggrundande inkomst (årsinkomst)
 * @param {string} startDate - Startdatum i format YYYY-MM-DD
 * @param {number} months1 - Antal månader för första perioden
 * @param {number} daysPerWeek1 - Antal dagar per vecka för första perioden (1-7)
 * @param {number} months2 - Antal månader för andra perioden (kan vara 0)
 * @param {number} daysPerWeek2 - Antal dagar per vecka för andra perioden (1-7)
 * @param {boolean} includeLowLevelDays - Om lägstanivådagar ska inkluderas i beräkningen
 * @returns {object} - Resultat med detaljerade beräkningar
 */
function calculateParentalBenefit(sgi, startDate, months1, daysPerWeek1, months2 = 0, daysPerWeek2 = 0, includeLowLevelDays = false) {
  // Beräkna daglig ersättning på sjukpenningnivå
  const dagligErsättning = calculateDailyBenefit(sgi);
  
  // Beräkna exakt antal uttagsdagar för period 1
  const uttagsdagar1 = calculateExactDays(months1, daysPerWeek1);
  
  // Beräkna exakt antal uttagsdagar för period 2 (om den finns)
  const uttagsdagar2 = months2 > 0 ? calculateExactDays(months2, daysPerWeek2) : 0;
  
  // Beräkna totalt antal uttagsdagar
  const totalDagar = uttagsdagar1 + uttagsdagar2;
  
  // Beräkna sjukpenningnivådagar och lägstanivådagar
  const sjukpenningNivåDagar = Math.min(totalDagar, 390);
  const lägstaNivåDagar = includeLowLevelDays ? Math.max(0, totalDagar - 390) : 0;
  
  // Beräkna total ersättning
  const ersättningSjukpenningNivå = sjukpenningNivåDagar * dagligErsättning;
  const ersättningLägstaNivå = lägstaNivåDagar * LÄGSTANIVÅ;
  const totalErsättning = Math.round(ersättningSjukpenningNivå + ersättningLägstaNivå);
  
  // Beräkna slutdatum för period 1
  const startDateObj = new Date(startDate);
  let period1EndDate = null;
  
  if (months1 > 0) {
    const countWeekends1 = daysPerWeek1 === 7;
    const specificDays1 = daysPerWeek1 === 5 ? [1, 2, 3, 4, 5] : null;
    
    period1EndDate = swedishDates.calculateParentalLeaveEndDate(
      startDateObj, 
      uttagsdagar1, 
      countWeekends1, 
      specificDays1
    );
  }
  
  // Beräkna slutdatum för hela ledigheten
  let slutdatum = null;
  
  if (months2 > 0 && period1EndDate) {
    const countWeekends2 = daysPerWeek2 === 7;
    const specificDays2 = daysPerWeek2 === 5 ? [1, 2, 3, 4, 5] : null;
    
    slutdatum = swedishDates.calculateParentalLeaveEndDate(
      period1EndDate, 
      uttagsdagar2, 
      countWeekends2, 
      specificDays2
    );
  } else {
    slutdatum = period1EndDate;
  }
  
  // Formatera slutdatum på svenskt sätt
  const formattedSlutdatum = swedishDates.formatSwedishDate(slutdatum, true);
  
  // Returnera detaljerat resultat
  return {
    sgi: sgi,
    justeradSGI: Math.min(sgi, MAX_SGI),
    dagligErsättning: dagligErsättning,
    uttagsdagar1: uttagsdagar1,
    uttagsdagar2: uttagsdagar2,
    totalDagar: totalDagar,
    totalErsättning: totalErsättning,
    period1End: period1EndDate ? swedishDates.formatSwedishDate(period1EndDate, true) : null,
    slutdatum: formattedSlutdatum,
    månatligErsättningBrutto: Math.round(dagligErsättning * (daysPerWeek1 * VECKOR_PER_MÅNAD))
  };
}

// Exportera funktionerna för användning i andra moduler
module.exports = {
  calculateDailyBenefit,
  calculateExactDays,
  calculateEndDate,
  calculateParentalBenefit,
  calculateTotalBenefitForPeriod,
  calculateDoubleDaysAndBalances, // <--- NY EXPORT!
  MAX_SGI,
  ERSÄTTNINGSNIVÅ,
  MAX_DAGLIG_ERSÄTTNING,
  DAGAR_PER_ÅR,
  VECKOR_PER_MÅNAD
};


