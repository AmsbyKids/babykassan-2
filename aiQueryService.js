const OpenAI = require("openai");
const { getVerifiedCurrentDate } = require('./swedishDateCalculator');

// Logga om API-nyckel finns
console.log("🔐 OPENAI_API_KEY laddad?", !!process.env.OPENAI_API_KEY);

// Initialize OpenAI
let openai;
let conversationHistory = [];

async function setupOpenAI() {
  console.log("🔄 Initierar OpenAI setup...");
  
  if (!process.env.OPENAI_API_KEY) {
    console.error("❌ OPENAI_API_KEY saknas i miljövariabler");
    throw new Error("API-nyckel saknas");
  }

  try {
    openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY
    });
    // test 
    // Verifiera att nyckeln fungerar
    const models = await openai.models.list();
    if (models) {
      console.log("✅ OpenAI API-nyckel verifierad");
      console.log("📡 OpenAI anslutning etablerad");
      return true;
    }
  } catch (error) {
    console.error("❌ Fel vid OpenAI-initiering:", error.message);
    console.error("🔍 Feldetaljer:", JSON.stringify(error, null, 2));
    throw new Error(`OpenAI initiering misslyckades: ${error.message}`);
  }
}

// Kommunalskatt per kommun
const kommunSkattesatser = {
  Stockholm: 0.2982,
  Göteborg: 0.3260,
  Malmö: 0.3187,
  Uppsala: 0.3285,
  Linköping: 0.3210,
  Örebro: 0.3290,
  Västerås: 0.3150,
  Helsingborg: 0.2927,
  Norrköping: 0.3315,
  Jönköping: 0.3275,
  Umeå: 0.3310,
  Lund: 0.3193,
  Borås: 0.3279,
  Eskilstuna: 0.3360,
  Gävle: 0.3377,
  Sundsvall: 0.3388,
  Karlstad: 0.3295,
  Växjö: 0.3219,
  Halmstad: 0.3238,
  Norrtälje: 0.3313,
  Kalmar: 0.3367,
  Falun: 0.3340,
  Skellefteå: 0.3395,
  Karlskrona: 0.3369,
  Östersund: 0.3392,
  Trollhättan: 0.3341,
  Luleå: 0.3384,
  Kristianstad: 0.3290,
  Uddevalla: 0.3364,
  Varberg: 0.3214
};

const baseSystemMessage = `Du är Alice – en varm, kunnig och oumbärlig rådgivare som hjälper föräldrar i Sverige att planera sin föräldraledighet på ett tryggt, smart och enkelt sätt. Du är deras digitala bästa vän ❤️.

[Uppdrag]
- Skapa alltid en komplett månad-för-månad-plan 🗖️, minst 12 månader lång.
- Visa per månad: antal uttagna dagar per person och nivå, brutto, skatt, netto, ev. buffert.
- Skapa separata tabeller för varje förälder om båda ingår i planen.
- Beräkna korrekt dagsersättning för varje person:
  - SGI / 365 × 0.8 (max 1250 kr/dag)
  - Dra av kommunalskatt för korrekt netto per dag
- Räkna ut hur många dagar varje person behöver ta ut per månad för att nå en viss nettolön (t.ex. 12 500 kr/månad).
- Om båda ska nå ett visst nettomål (t.ex. 14 000 kr var), justera uttag utifrån deras SGI och visa hur många dagar som krävs var.
- Om endast 4 dagar/vecka nämns, använd max 17,32 dagar/månad.
- Om det inte räcker – visa exakt hur mycket som saknas och var buffert behövs.
- Om användaren har semester en viss månad – ta hänsyn till det och dra av från dagarna.
- Summera alltid hur många sjukpenningnivådagar och lägstanivådagar som används och vad som är kvar per person.
- För alla föräldrar: utgå från att det finns 390 dagar på sjukpenningnivå och 90 på lägstanivå per barn.
- Om ett smartare sätt finns att spara dagar – visa det som alternativ 2.
- Visa alltid: "Totalt kvar efter perioden: X dagar för dig, Y dagar för partnern".

[Verifiering och realism]
- Använd verkliga kalendermånader – max 20 vardagar, eller 17,32 dagar vid 4 dagar/vecka.
- Visa tydligt när dagarna för varje barn tar slut (enligt 4-årsregel och 8-årsgräns).
- Om inkomsten understiger önskat nettobelopp – visa exakt belopp som saknas.
- Om inkomsten understiger existensminimum (10 000 kr) – ⚠️ Varning och föreslå lösning.
- Summera tydligt i slutet: antal använda dagar, kvarvarande dagar per person, total buffert som behövdes.

[Personlig reflektion och analys]
- Spegla användarens familjesituation direkt i svaret.
- Anpassa efter SGI, kommun, barnens ålder och planerade inskolningar.
- Ge emotionell trygghet: "Jag ser att ni delar på ledigheten – vilket är fantastiskt för er båda och barnet. 💛"

[Alternativa upplägg]
- Visa alltid ett alternativ med färre dagar om det är möjligt.
- Visa tydlig jämförelse mellan Alternativ 1 och Alternativ 2:
  - Antal dagar
  - Flexibilitet
  - Kvarvarande dagar
  - Buffertbehov

[Ton och avslut]
- Inled alltid med dagens datum och orden: "Idag den [datum] kan jag hjälpa dig att planera… ❤️"
- Skriv varmt 💛, konkret och mänskligt.
- Avsluta alltid med en summering, följdfrågor och nästa steg. Fråga t.ex.:
  - "Vill du att jag gör en ny plan med 3 dagar i veckan istället?"
  - "Vill du att jag visar hur det ser ut om ni delar lika men byter roller efter 6 månader?"
  - "Vill du att jag visar en variant där ni sparar fler dagar?"`;

async function queryOpenAI(message) {
  try {
    const verifiedDate = getVerifiedCurrentDate();
    console.log("🗕️ Datum:", verifiedDate.fullDate);

    if (!openai) {
      console.log("🔄 Initierar OpenAI...");
      await setupOpenAI();
      if (!openai) {
        console.error("❌ Kunde inte initiera OpenAI");
        return {
          success: false,
          answer: "Ett tekniskt fel uppstod vid initiering av tjänsten. Vänligen försök igen om en stund."
        };
      }
    }

    if (!conversationHistory) {
      console.log("📝 Skapar ny konversationshistorik");
      conversationHistory = [];
    }

    console.log("➡️ Nytt meddelande mottaget:", message);
    conversationHistory.push({ role: "user", content: message });

    const enhancedPrompt = baseSystemMessage + `

Användarens meddelande:
"""
${message}
"""

Idag den ${verifiedDate.fullDate} kan du skapa en konkret och varm planering som svar. ❤️`;

const maxHistory = 4; // t.ex. senaste 4 meddelanden räcker oftast!
const trimmedHistory = conversationHistory.slice(-maxHistory);

const completion = await openai.chat.completions.create({
  model: "gpt-4.1",
  messages: [
    { role: "system", content: enhancedPrompt },
    ...trimmedHistory
  ],
  temperature: 0.7,
  max_tokens: 2000
});


    const reply = completion.choices[0].message.content;
    conversationHistory.push({ role: "assistant", content: reply });

    return { success: true, answer: reply };
  } catch (error) {
    console.error('OpenAI API Error:', error);
    return {
      success: false,
      answer: "Jag kunde tyvärr inte svara just nu. Vänta några sekunder och försök igen."
    };
  }
}

function isRelevantQuestion(message) {
  const lowercase = message.toLowerCase();
  return lowercase.includes("föräldrapenning") ||
         lowercase.includes("föräldraledighet") ||
         lowercase.includes("fp-dagar") ||
         lowercase.includes("försäkringskassan") ||
         lowercase.includes("föräldradagar") ||
         lowercase.includes("sgi") ||
         lowercase.includes("lägstanivå") ||
         lowercase.includes("sjukpenningnivå") ||
         lowercase.includes("förlossning") ||
         lowercase.includes("föräldraförsäkring") ||
         lowercase.includes("fp") ||
         lowercase.includes("ledighet") ||
         lowercase.includes("dagar");
}

module.exports = { queryOpenAI, isRelevantQuestion };

// 🟢 Starta direkt om körs manuellt
if (require.main === module) {
  setupOpenAI()
    .then(() => {
      console.log("🧠 Alice-service är redo");
      
      // Lyssna på process signaler
      process.on('SIGTERM', () => {
        console.log('📢 Tar emot SIGTERM signal');
        process.exit(0);
      });

      process.on('SIGINT', () => {
        console.log('📢 Tar emot SIGINT signal');
        process.exit(0);
      });

      // Håll processen vid liv
      setInterval(() => {
        console.log("📡 Alice är aktiv - PID:", process.pid);
      }, 1000 * 60);
    })
    .catch(err => {
      console.error("❌ Alice-service kraschade vid start:", err.message);
      process.exit(1);
    });
}
