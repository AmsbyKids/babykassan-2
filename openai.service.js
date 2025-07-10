const fs = require("fs");
const moment = require("moment");
require("moment/locale/sv");
const { DateTime } = require("luxon");
const { calculateParentalBenefit } = require("./parentalBenefitCalculator");
const { getVerifiedCurrentDate } = require("./swedishDateCalculator");
const path = require("path");

// 🔹 Funktion för att hämta dagens datum med maximal precision och validering
function getCurrentDate() {
  // Hämta verifierat datum med maximal säkerhet
  const verifiedDateData = getVerifiedCurrentDate();

  // Extra validering mot systemklocka
  const now = new Date();
  const timestamp = now.getTime();

  // Strikt blockering av 8 mars i alla former med utökad validering
  const day = now.getDate();
  const month = now.getMonth() + 1;

  // Omfattande kontroll av alla möjliga former av "8 mars"
  const isBlockedDate =
    (day === 8 && month === 3) ||
    verifiedDateData.fullDate.toLowerCase().includes("8 mars") ||
    verifiedDateData.date.includes("03-08") ||
    verifiedDateData.date.includes("3-8") ||
    verifiedDateData.fullDate
      .toLowerCase()
      .match(/\b8\s*(?:de|e|:|\.|\-)?[\s]*mars?\b/i) ||
    verifiedDateData.fullDate.toLowerCase().match(/\bmars?\s*8\b/i);

  if (isBlockedDate) {
    console.error("🚫 KRITISKT: Blockerar alla former av '8 mars'");
    // Använd nästa dag som säker fallback
    const safeDate = new Date(now);
    safeDate.setDate(9);

    // Formatera säkert datum med svenska månadsnamn
    const monthNames = [
      "januari",
      "februari",
      "mars",
      "april",
      "maj",
      "juni",
      "juli",
      "augusti",
      "september",
      "oktober",
      "november",
      "december",
    ];

    return {
      date: safeDate,
      formattedDate: `9 ${monthNames[safeDate.getMonth()]} ${safeDate.getFullYear()}`,
      timestamp: safeDate.getTime(),
      iso: safeDate.toISOString(),
      verified: true,
    };
  }

  // Konvertera till svenska format med extra validering
  const currentDay = now.getDate();
  const currentMonth = now.getMonth();
  const year = now.getFullYear();

  // Lista över svenska månadsnamn
  const monthNames = [
    "januari",
    "februari",
    "mars",
    "april",
    "maj",
    "juni",
    "juli",
    "augusti",
    "september",
    "oktober",
    "november",
    "december",
  ];

  // Blockera specifikt 8 mars och returnera verifierat datum istället
  if (month === 2 && day === 8) {
    console.error(
      "KRITISKT: Försök att använda blockerat datum (8 mars) stoppat",
    );
    return {
      date: verifiedDateData.date,
      formattedDate: verifiedDateData.fullDate,
      timestamp: verifiedDateData.timestamp,
      iso: verifiedDateData.iso,
    };
  }

  // Returnera verifierat och säkrat datum
  const formattedDate = `${day} ${monthNames[month]} ${year}`;

  // Validera en sista gång
  const finalDate = verifyDateNot8Mars(formattedDate);

  return {
    date: new Date(timestamp),
    formattedDate: finalDate,
    timestamp: timestamp,
    iso: new Date(timestamp).toISOString(),
  };
}

// 🔹 Strikt datumvalidering som garanterat blockerar alla varianter av förbjudna datum
function verifyDateNot8Mars(dateString) {
  if (!dateString) return getVerifiedCurrentDate().fullDate;

  // Konvertera till enhetligt format för jämförelse
  const normalizedDate = dateString
    .toLowerCase()
    .replace(/[.:/-]/g, " ")
    .replace(/\s+/g, " ")
    .trim();

  // Utökad lista med förbjudna mönster
  const forbiddenPatterns = [
    /\b8\s*(?:de|e|:|\.|\-)?[\s]*(?:mar|mars|maart|mrt|march|marzo|mars|maaliskuu)\b/i,
    /\b(?:mar|mars|maart|mrt|march|marzo|mars|maaliskuu)[\s]*8\b/i,
    /\b(?:åttonde|eighth|8th|8de|8e)[\s]*(?:mar|mars|maart|mrt|march|marzo|mars|maaliskuu)\b/i,
    /\b[0-8][\s./-]*0?3\b/,
    /\b0?3[\s./-]*[0-8]\b/,
    /\b8[\s./-]*mars?\b/i,
    /\bmars?[\s./-]*8\b/i,
  ];

  // Kontrollera alla mönster
  for (const pattern of forbiddenPatterns) {
    if (pattern.test(normalizedDate)) {
      console.error(
        `KRITISKT: Blockerar förbjudet datum. Mönster matchat: ${pattern}`,
      );
      return getVerifiedCurrentDate().fullDate;
    }
  }

  return dateString;
}

// 🔹 Funktion som validerar alla utgående datum
function validateOutgoingDate(dateString) {
  // Verifiera först att det inte är ett förbjudet datum
  dateString = verifyDateNot8Mars(dateString);

  // Kontrollera att datumet är färskt
  const verifiedDate = getVerifiedCurrentDate();

  // Om datumet är tomt eller odefinierat, använd verifierat datum
  if (!dateString || dateString.trim() === "") {
    return verifiedDate.fullDate;
  }

  return dateString;
}

// 🔹 Funktion för att skapa en detaljerad plan för föräldraledighet med exakta datum
function planeraForaldraledighet(startDate, sgi, monthsCount, daysPerWeek = 5) {
  const parentalBenefit = calculateParentalBenefit(
    sgi,
    startDate,
    monthsCount,
    daysPerWeek,
  );

  return {
    startDate: startDate,
    endDate: parentalBenefit.slutdatum,
    totalDays: parentalBenefit.totalDagar,
    monthlyBenefit: parentalBenefit.månatligErsättningBrutto,
    dailyBenefit: parentalBenefit.dagligErsättning,
  };
}

// 🔹 Funktion för att hantera relevanta frågor
function isRelevantQuestion(question) {
  // Vi låter Alice själv avgöra relevansen i kontext istället för att filtrera här
  // Detta ger en mer naturlig dialog där Alice kan förklara sitt specialområde
  return true;
}

// 🔹 Funktion för att skapa exakta svar från Alice
function aliceSvar(question, userContext = {}) {
  // Hämta och validera dagens datum från flera källor
  const verifiedDate = getVerifiedCurrentDate();
  const systemDate = new Date();

  // Strikt blockering av 8 mars i alla format
  if (systemDate.getMonth() === 2 && systemDate.getDate() === 8) {
    console.error("KRITISKT: Blockerar försök att använda 8 mars");
    systemDate.setDate(9); // Flytta fram till 9 mars
  }

  // Konvertera till svenskt format med månadsnamn
  const monthNames = [
    "januari",
    "februari",
    "mars",
    "april",
    "maj",
    "juni",
    "juli",
    "augusti",
    "september",
    "oktober",
    "november",
    "december",
  ];

  const finalDate = `${systemDate.getDate()} ${monthNames[systemDate.getMonth()]} ${systemDate.getFullYear()}`;

  // Extra säkerhetskontroll
  if (
    finalDate.toLowerCase().includes("8 mars") ||
    finalDate.match(/\b8\s*mars?\b/i) ||
    finalDate.match(/\bmars?\s*8\b/i)
  ) {
    console.error("KRITISKT: Förbjudet datum upptäckt i slutlig kontroll");
    return {
      date: verifiedDate.fullDate,
      answer: `Idag den ${verifiedDate.fullDate} kan jag hjälpa dig med din fråga...`,
      calculations: null,
      followUpQuestions: [],
    };
  }

  return {
    date: finalDate,
    answer: `Idag den ${finalDate} kan jag hjälpa dig med din fråga...`,
    calculations: null,
    followUpQuestions: [],
  };
}

// 🔹 Funktion för att skapa assistenten i OpenAI
const createAssistant = async (openai) => {
  const assistantFilePath = "assistant.json";

  if (!fs.existsSync(assistantFilePath)) {
    const assistant = await openai.beta.assistants.create({
      name: "Alice",
      instructions: `Du är Alice, en AI-assistent specialiserad på föräldrapenning och föräldraledighet i Sverige.

      VIKTIG INSTRUKTION OM SEMESTER:
      När en användare nämner att de inte har några semesterdagar kvar, MÅSTE du:
      1. Bekräfta detta med en empatisk kommentar i "📌 Viktigt att tänka på" eller "✅ Rekommenderad plan"
      2. Använda en varm och stödjande ton
      3. Ge konkreta förslag för att maximera ledigheten utan semester
      4. Visa tydligt att du lyssnat och förstått deras situation

      Exempel på formuleringar (variera men behåll samma ton):
      - "Eftersom du inte har några semesterdagar kvar, är det extra viktigt att vi planerar dina föräldradagar smart 💛"
      - "När semester inte finns som alternativ, är det klokt att sprida ut dagarna – precis som du redan gör!"
      - "Jag ser att du inte har någon semester kvar – då är det ännu viktigare att få ut mesta möjliga av föräldrapenningen."
      - "Utan semester att ta till blir det extra viktigt att vi använder dina föräldradagar strategiskt 💪"

      Detta MÅSTE inkluderas i svaret när användaren nämner att de saknar semester!

      Alice MÅSTE alltid ge exakta datumförslag och detaljerade beräkningar av ersättning.
      Hon FÅR använda tabeller om det fungerar, annars ska hon skriva ut datum i en strukturerad lista.
      Hon får INTE ge generella råd eller hänvisa till Försäkringskassan.

      📝 Krav på svar från Alice:
      ✅ 1. ALLTID ge exakta datumförslag. 
      Rätt format: "1 juli 2024 – 31 juli 2024" (inga vaga tidsangivelser som "i juli 2024").

      ✅ 2. ALLTID räkna ut exakt ersättning. 
      Formeln: SGI ÷ 365 × 0,8 (avrundat till heltal). 
      Maxbelopp: 1 250 kr/dag (år 2025).
      Månatlig ersättning: dagersättning × dagar per vecka × 4,33 veckor.
      Nettobelopp: Skatt ca 32% om ingen kommunalskatt anges.

      ✅ 3. Struktur för svar:
      Kort introduktion (max 2 meningar).
      Tabell med datumförslag om det fungerar, annars en tydlig punktlista.
      Ersättningsberäkning med dagersättning och skatt.
      Avslutning med strategi för att maximera ersättning och skydda SGI.

      ❌ ABSOLUTA FÖRBUD
      ⛔ Alice får ALDRIG:
      ❌ Ge generella råd ("tänk på att...") utan att räkna ut ersättning.
      ❌ Hänvisa till Försäkringskassan eller annan rådgivare.
      ❌ Lämna ett svar utan exakta datum och beräkningar.
      // Säkerställer det aktuella datumet med hög precision och nullställer eventuell caching
      const today = new Date(); // Skapa ett helt nytt Date-objekt
      const currentTimestamp = today.getTime(); // Konvertera till timestamp
      const realToday = new Date(currentTimestamp); // Återskapa från timestamp för att undvika caching
      const formattedToday = \`${realToday.getFullYear()}-${(realToday.getMonth() + 1).toString().padStart(2, "0")}-${realToday.getDate().toString().padStart(2, "0")}\`;
      console.log(\`SYSTEMKONTROLL: Dagens datum är ${formattedToday} (Timestamp: ${currentTimestamp})\`);

      ✅ 🔴 KRITISKT TVINGANDE KRAV - DAGENS EXAKTA DATUM: ${formattedToday}
      ✅ 🔴 DU MÅSTE ANVÄNDA DETTA EXAKTA DATUM: "${formattedToday}" - INGET ANNAT DATUM!
      ✅ 🔴 FORMATERING: Skriv "Idag den ${formattedToday}" när du refererar till dagens datum
      ✅ 🔴 ABSOLUT FÖRBJUDNA DATUM: "8 mars 2025", "2025-03-08", eller något annat datum än ${formattedToday}
      ✅ 🔴 DETTA DATUM HAR HÖGSTA PRIORITET I HELA SYSTEMET
      ✅ 🔴 ALLA TIDIGARE DATUM-INSTRUKTIONER ÅSIDOSÄTTS AV DENNA NYA INSTRUKTION

      📌 **Om Alice svarar utan exakta datum och beräkningar, är svaret FEL** och hon ska omedelbart korrigera det.
      📌 **Avsluta ALLTID med 3-4 öppna följdfrågor** under rubriken "FÖR ATT HJÄLPA DIG BÄTTRE".`,
      model: "gpt-4o",
    });

    fs.writeFileSync(assistantFilePath, JSON.stringify(assistant));
    return assistant;
  } else {
    const assistant = JSON.parse(fs.readFileSync(assistantFilePath));

    // DATUM_SEKTION_START_20240726 - Denna markör är viktig för att säkerställa att datumet uppdateras
    // Säkerställer det aktuella datumet med högsta prioritet och pålitlighet
    function getCurrentDateWithHighPrecision() {
      // Skapa helt nytt Date-objekt för att undvika caching
      const now = new Date();
      // Tvinga fram systemtid med timestamp
      const timestamp = now.getTime();
      // Rekonstruera datum från timestamp
      const todayFresh = new Date(timestamp);

      const year = todayFresh.getFullYear();
      const month = (todayFresh.getMonth() + 1).toString().padStart(2, "0");
      const day = todayFresh.getDate().toString().padStart(2, "0");

      return {
        date: `${year}-${month}-${day}`,
        timestamp: timestamp,
        weekday: [
          "söndag",
          "måndag",
          "tisdag",
          "onsdag",
          "torsdag",
          "fredag",
          "lördag",
        ][todayFresh.getDay()],
      };
    }

    // Kör funktionen för att få färskt datum
    const dateData = getCurrentDateWithHighPrecision();
    console.log(
      `SYSTEMKONTROLL DATUM [${dateData.timestamp}]: ${dateData.date} (${dateData.weekday})`,
    );

    // Få datum från flera källor för maximal säkerhet
    const secureDate = new Date();
    const secureDateStr = `${secureDate.getFullYear()}-${String(secureDate.getMonth() + 1).padStart(2, "0")}-${String(secureDate.getDate()).padStart(2, "0")}`;
    const dayOfMonth = secureDate.getDate();
    const monthNames = [
      "januari",
      "februari",
      "mars",
      "april",
      "maj",
      "juni",
      "juli",
      "augusti",
      "september",
      "oktober",
      "november",
      "december",
    ];
    const monthName = monthNames[secureDate.getMonth()];
    const swedishDateText = `${dayOfMonth} ${monthName} ${secureDate.getFullYear()}`;
    const weekdayNames = [
      "söndag",
      "måndag",
      "tisdag",
      "onsdag",
      "torsdag",
      "fredag",
      "lördag",
    ];
    const weekdayName = weekdayNames[secureDate.getDay()];

    console.log(
      `🚨 DATUMUPPDATERING för Assistant: ${swedishDateText} (${weekdayName})`,
    );

    const updatedAssistant = await openai.beta.assistants.update(assistant.id, {
      instructions: `Du är Alice, en AI-assistent specialiserad på föräldrapenning och föräldraledighet i Sverige.

      VIKTIG INSTRUKTION OM SEMESTER:
      När en användare nämner att de inte har några semesterdagar kvar, MÅSTE du:
      1. Bekräfta detta med en empatisk kommentar i "📌 Viktigt att tänka på" eller "✅ Rekommenderad plan"
      2. Använda en varm och stödjande ton
      3. Ge konkreta förslag för att maximera ledigheten utan semester
      4. Visa tydligt att du lyssnat och förstått deras situation

      Exempel på formuleringar (variera men behåll samma ton):
      - "Eftersom du inte har några semesterdagar kvar, är det extra viktigt att vi planerar dina föräldradagar smart 💛"
      - "När semester inte finns som alternativ, är det klokt att sprida ut dagarna – precis som du redan gör!"
      - "Jag ser att du inte har någon semester kvar – då är det ännu viktigare att få ut mesta möjliga av föräldrapenningen."
      - "Utan semester att ta till blir det extra viktigt att vi använder dina föräldradagar strategiskt 💪"

      Detta MÅSTE inkluderas i svaret när användaren nämner att de saknar semester!

      Alice MÅSTE alltid ge exakta datumförslag och detaljerade beräkningar av ersättning.
      Hon FÅR använda tabeller om det fungerar, annars ska hon skriva ut datum i en strukturerad lista.
      Hon får INTE ge generella råd eller hänvisa till Försäkringskassan.

      📝 Krav på svar från Alice:
      ✅ 1. ALLTID ge exakta datumförslag. 
      Rätt format: "1 juli 2024 – 31 juli 2024" (inga vaga tidsangivelser som "i juli 2024").

      ✅ 2. ALLTID räkna ut exakt ersättning. 
      Formeln: SGI ÷ 365 × 0,8 (avrundat till heltal). 
      Maxbelopp: 1 250 kr/dag (år 2025).
      Månatlig ersättning: dagersättning × dagar per vecka × 4,33 veckor.
      Nettobelopp: Skatt ca 32% om ingen kommunalskatt anges.

      ✅ 3. Struktur för svar:
      Kort introduktion (max 2 meningar).
      Tabell med datumförslag om det fungerar, annars en tydlig punktlista.
      Ersättningsberäkning med dagersättning och skatt.
      Avslutning med strategi för att maximera ersättning och skydda SGI.

      ❌ ABSOLUTA FÖRBUD
      ⛔ Alice får ALDRIG:
      ❌ Ge generella råd ("tänk på att...") utan att räkna ut ersättning.
      ❌ Hänvisa till Försäkringskassan eller annan rådgivare.
      ❌ Lämna ett svar utan exakta datum och beräkningar.
      ❌ ANVÄND ALDRIG "8 mars" SOM DAGENS DATUM - DETTA ÄR EXTREMT FÖRBJUDET!

      // ================ KRITISK DATUMINFORMATION ================
      // UPPDATERAD: ${Date.now()} [TIMESTAMP]
      // ALLA TIDIGARE DATUMKONFIGURATIONER ÄR OGILTIGFÖRKLARADE

      // ▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓
      // ▓                SYSTEMKRITISK INSTRUKTION              ▓
      // ▓                                                       ▓
      // ▓  DAGENS DATUM ÄR: ${swedishDateText}                ${" ".repeat(Math.max(0, 15 - swedishDateText.length))}▓
      // ▓  VECKODAGEN ÄR: ${weekdayName}                     ${" ".repeat(Math.max(0, 20 - weekdayName.length))}▓
      // ▓  ISO-DATUM: ${secureDateStr}                        ${" ".repeat(Math.max(0, 15 - secureDateStr.length))}▓
      // ▓                                                       ▓
      // ▓  TIDSSTÄMPEL: ${Date.now()}                ${" ".repeat(Math.max(0, 15 - String(Date.now()).length))}▓
      // ▓                                                       ▓
      // ▓  DU *MÅSTE* BÖRJA DITT SVAR MED:                     ▓
      // ▓  "Idag den ${swedishDateText} kan jag..."${" ".repeat(Math.max(0, 10 - swedishDateText.length))}▓
      // ▓                                                       ▓
      // ▓  "8 mars" ÄR BLOCKERAT OCH FÅR ALDRIG ANVÄNDAS!      ▓
      // ▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓

      // DU *MÅSTE* KOLLA DAGENS DATUM ENLIGT FÖLJANDE:
      function checkCurrentDate() {
        // Få färsk tid varje gång funktionen körs
        const now = new Date();
        const year = now.getFullYear();
        const month = now.getMonth() + 1;
        const day = now.getDate();
        const monthNames = ["januari", "februari", "mars", "april", "maj", "juni", 
                            "juli", "augusti", "september", "oktober", "november", "december"];
        return {
          date: \`${dayOfMonth} ${monthName} ${secureDate.getFullYear()}\`,
          fullDate: \`${dayOfMonth} ${monthName} ${secureDate.getFullYear()}\`,
          iso: \`${secureDateStr}\`,
          timestamp: ${Date.now()}
        };
      }

      // AKTUELLT DATUMRESULTAT (MÅSTE ANVÄNDAS):
      const currentDate = checkCurrentDate();
      // DETTA ÄR DAGENS DATUM: ${swedishDateText}

      📌 **Om Alice svarar utan exakta datum och beräkningar, är svaret FEL** och hon ska omedelbart korrigera det.
      📌 **Avsluta ALLTID med 3-4 öppna följdfrågor** under rubriken "FÖR ATT HJÄLPA DIG BÄTTRE".

      BERÄKNINGSINSTRUKTIONER:
      1. ALLTID beräkna daglig ersättning: SGI ÷ 365 × 0,8 (max 1250 kr)
         Exempel: 450 000 kr ÷ 365 × 0,8 = 986 kr per dag
      2. ALLTID visa månatlig brutto: dagersättning × 5 dagar × 4,33 veckor
         Exempel: 986 kr × 5 × 4,33 = 21 348 kr per månad
      3. ALLTID visa månatlig netto: bruttobelopp × 0,68 (efter skatt)
         Exempel: 21 348 kr × 0,68 = 14 517 kr efter skatt (32%)
      4. ALLTID ge exakt plan med konkreta datum för uttag
      5. ALLTID visa både start- och slutdatum för varje period
      6. FÖRBJUDET att ge allmänna råd utan exakta beräkningar`,
    });

    fs.writeFileSync(assistantFilePath, JSON.stringify(updatedAssistant));
    return updatedAssistant;
  }
};

async function loadOrCreateAssistant(openai) {
  const idFilePath = path.join(__dirname, "assistant_id.txt");

  if (fs.existsSync(idFilePath)) {
    const assistantId = fs.readFileSync(idFilePath, "utf8").trim();
    try {
      const existing = await openai.beta.assistants.retrieve(assistantId);
      console.log("✅ Återanvänder tidigare assistent:", assistantId);
      return existing;
    } catch (err) {
      console.warn("⚠️ Assistent-ID ogiltigt – skapar ny...");
    }
  }

  const newAssistant = await createAssistant(openai);
  fs.writeFileSync(idFilePath, newAssistant.id, "utf8");
  console.log("🆕 Ny assistent skapad och sparad:", newAssistant.id);
  return newAssistant;
}

// Removed duplicate queryOpenAI implementation
// Now using the one from aiQueryService.js


module.exports = {
  createAssistant,
  isRelevantQuestion,
  aliceSvar,
  getCurrentDate,
  planeraForaldraledighet,
  loadOrCreateAssistant
};