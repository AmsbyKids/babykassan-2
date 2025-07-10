console.log("🔧 index.js körs...");

const express = require('express');
const session = require('express-session');
const planRouter = require('./planCalculator');
const { isRelevantQuestion } = require('./openai.service');
const { queryOpenAI } = require('./aiQueryService'); // ✅ Flyttad upp hit

const app = express();

// Session-hantering
app.use(session({
  secret: 'alice-secret-key',
  resave: false,
  saveUninitialized: true
}));

// Aktivera CORS
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Content-Type');
  next();
});

// Enkel middleware för loggning
app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} - ${req.method} ${req.url}`);
  next();
});

// Express-konfiguration
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Använd planCalculator för /api/plan routes
app.use(planRouter);

// 🟢 Test-GET-route för att se att servern lever
app.get("/ping", (req, res) => {
  console.log("🔍 GET /ping anropad");
  res.status(200).send("Alice är vaken! ✅");
});

// API-rutt för chattförfrågningar
app.post("/api/chat", async (req, res) => {
  console.log("💬 Mottog POST till /api/chat");

  try {
    const { message, sessionId, userId, deviceInfo } = req.body;

    if (!message) {
      console.log("❗️ POST saknar 'message'");
      return res.status(400).json({ 
        success: false, 
        answer: "Meddelande saknas" 
      });
    }

    console.log(`🔄 Anropar queryOpenAI med meddelande: "${message}"`);

    if (!isRelevantQuestion(message)) {
      console.log(`🚫 Irrelevant fråga avvisad: "${message}"`);
      return res.json({
        success: true,
        answer: "Jag är specialiserad på föräldrapenning och föräldraledighet och kan bara hjälpa till med frågor inom detta område. Har du någon fråga om föräldraförsäkringen som jag kan hjälpa dig med?"
      });
    }

    console.log(`✅ Relevant fråga accepterad, använder queryOpenAI`);
    const response = await queryOpenAI(message);
    console.log(`📝 Svar från queryOpenAI mottaget`);
    res.json(response);

  } catch (error) {
    console.error('❌ Fel vid API-anrop:', error);
    res.status(500).json({ 
      success: false, 
      answer: "Ett tekniskt fel uppstod. Vänligen försök igen om en stund." 
    });
  }
});

const PORT = process.env.PORT || 5000;
console.log("🚀 Startar servern...");
app.listen(PORT, "0.0.0.0", () => {
  console.log(`✅ Servern lyssnar på http://0.0.0.0:${PORT}`);
  console.log("💡 Server körs i", process.env.NODE_ENV, "läge");
});

// Hantera process signaler för graceful shutdown
process.on('SIGTERM', () => {
  console.log('📢 Tar emot SIGTERM signal');
  process.exit(0);
});

process.on('SIGINT', () => {
  console.log('📢 Tar emot SIGINT signal');
  process.exit(0);
});
