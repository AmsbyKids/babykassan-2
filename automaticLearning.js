
const fs = require('fs');
const axios = require('axios');
const cheerio = require('cheerio');
const { createAssistant } = require('./openai.service');
const OpenAI = require('openai');

// Initiera OpenAI-klienten
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

// Lista över betrodda källor
const trustedSources = [
  {
    name: 'Försäkringskassan - Föräldrapenning',
    url: 'https://www.forsakringskassan.se/privatperson/foralder/foraldrapenning',
    selectors: 'article, .content-area, main, p, h1, h2, h3, li',
    priority: 'high'
  },
  {
    name: 'Försäkringskassan - Nya regler 2025',
    url: 'https://www.forsakringskassan.se/nyhetsarkiv', 
    selectors: 'article, .content-area, .news-list, .news-item, h2, h3, p',
    priority: 'high'
  },
  {
    name: 'Försäkringskassan - När barnet är fött',
    url: 'https://www.forsakringskassan.se/privatperson/foralder/nar-barnet-ar-fott/foraldrapenning',
    selectors: 'article, .content-area, main, p, h1, h2, h3, li',
    priority: 'medium'
  },
  {
    name: 'Riksdagen - Propositioner',
    url: 'https://www.riksdagen.se/sv/dokument-lagar/dokument/proposition/',
    selectors: '.searchResultContainer, .documentList, h3, p',
    priority: 'high',
    searchTerm: 'föräldrapenning 2025'
  },
  {
    name: 'Regeringen - Rattsliga dokument',
    url: 'https://www.regeringen.se/rattsliga-dokument/',
    selectors: '.content-list, .news-list, h2, h3, p',
    priority: 'high',
    searchTerm: 'föräldrapenning'
  },
  {
    name: 'Försäkringskassan - Prisbasbelopp',
    url: 'https://www.forsakringskassan.se/privatperson/ersattningar-och-bidrag/prisbasbelopp',
    selectors: '.article-content, main, p, table, tr, td',
    priority: 'medium'
  },
  {
    name: 'Almega - Arbetsgivarinformation',
    url: 'https://www.almega.se/aktuellt-och-press/',
    selectors: 'article, .news-item, .post, h2, h3, p',
    priority: 'medium',
    searchTerm: 'föräldrapenning rapportering'
  },
  {
    name: 'Unionen - Föräldraskap',
    url: 'https://www.unionen.se/rad-och-stod/foraldraskap',
    selectors: 'article, .content, p, h2, h3, li',
    priority: 'low'
  },
  {
    name: 'SCB - Statistik',
    url: 'https://www.scb.se/hitta-statistik/',
    selectors: '.content-area, article, p, h2, h3',
    priority: 'low',
    searchTerm: 'föräldrapenning'
  },
  {
    name: 'Sveriges Riksdag - Nya Lagar',
    url: 'https://www.riksdagen.se/sv/dokument-lagar/dokument/svensk-forfattningssamling/',
    selectors: '.searchResultContainer, .hit-item, h3, p',
    priority: 'high',
    searchTerm: 'föräldrapenning'
  }
];

// Nyckelord för filtrering
const relevantKeywords = [
  'föräldrapenning', 'föräldraledighet', 'nya regler', 'proposition', 
  '2025', '2026', 'april', 'förändring', 'sgi skydd', 'sjukpenninggrundande', 
  'barnbidrag', 'dagersättning', 'föräldradagar', 'reserverade'
];

/**
 * Hämtar och sparar information från alla betrodda källor
 */
async function collectNewInformation() {
  console.log(`🔄 Startar automatisk inlärning ${new Date().toISOString()}`);
  
  // Läs in tidigare data
  let officialData = {};
  try {
    if (fs.existsSync('official_data.json')) {
      officialData = JSON.parse(fs.readFileSync('official_data.json', 'utf8'));
    }
  } catch (err) {
    console.error('Kunde inte läsa official_data.json:', err);
    // Om filen inte existerar, skapa en tom struktur
    officialData = {
      "prisbasbelopp": "58 800 kr",
      "inkomstbasbelopp": "80 600 kr",
      "sjukpenninggrundande_inkomst": {
        "max": "588 000 kr",
        "min": "14 100 kr"
      },
      "senast_uppdaterad": new Date().toISOString(),
      "källa": "Initierad vid första inlärningen",
      "nya_regler_2025": "Föräldrapenningregler för 2025 laddas in...",
      "automatically_collected": {}
    };
  }
  
  // Skapa en inlärningslogg
  let learningLog = [];
  try {
    if (fs.existsSync('learning_log.json')) {
      learningLog = JSON.parse(fs.readFileSync('learning_log.json', 'utf8'));
    }
  } catch (err) {
    console.error('Kunde inte läsa learning_log.json:', err);
    learningLog = [];
  }
  
  // Samla information från alla källor
  let newInformation = '';
  let latestUpdateDate = new Date().toISOString();
  
  // Håll reda på besökta URLs för att undvika dubletter
  const visitedUrls = new Set();
  // Lista över upptäckta men ej besökta relaterade länkar
  let discoveredLinks = [];
  
  // Sorterar källor baserat på prioritet
  const prioritySources = [...trustedSources].sort((a, b) => {
    const priorityOrder = { high: 0, medium: 1, low: 2 };
    return priorityOrder[a.priority || 'medium'] - priorityOrder[b.priority || 'medium'];
  });
  
  for (const source of prioritySources) {
    try {
      // Undvik dubletter
      if (visitedUrls.has(source.url)) {
        continue;
      }
      
      console.log(`🔍 Söker information från ${source.name}: ${source.url} (Prioritet: ${source.priority || 'medium'})`);
      
      // Om källan har en sökterm, använd den för att hitta mer specifik information
      let targetUrl = source.url;
      if (source.searchTerm) {
        console.log(`🔎 Använder sökterm: "${source.searchTerm}"`);
        // Simulera sökning om URL:en är en sökbar sida
        if (source.url.includes('riksdagen.se') || source.url.includes('regeringen.se')) {
          targetUrl = `${source.url}?q=${encodeURIComponent(source.searchTerm)}`;
        }
      }
      
      const response = await axios.get(targetUrl);
      const $ = cheerio.load(response.data);
      visitedUrls.add(targetUrl);
      
      // Extrahera relevant innehåll baserat på sidans struktur
      let pageContent = '';
      $(source.selectors).each((_, el) => {
        pageContent += $(el).text() + ' ';
      });
      
      // Hitta relaterade länkar för ytterligare sökning
      $('a').each((_, el) => {
        const href = $(el).attr('href');
        const linkText = $(el).text().toLowerCase();
        
        // Om länken verkar relevant baserat på text och destination
        if (href && 
            !visitedUrls.has(href) && 
            !discoveredLinks.includes(href) && 
            (relevantKeywords.some(keyword => linkText.includes(keyword.toLowerCase())) || 
             (linkText.includes('läs mer') || linkText.includes('mer information')))) {
            
            // Hantera både absoluta och relativa länkar
            let fullUrl = href;
            if (href.startsWith('/')) {
              // Konvertera relativ URL till absolut
              const baseUrl = new URL(targetUrl);
              fullUrl = `${baseUrl.protocol}//${baseUrl.host}${href}`;
            }
            
            // Kontrollera att länken är till en betrodd domän
            const trustedDomains = [
              'forsakringskassan.se', 
              'riksdagen.se', 
              'regeringen.se', 
              'skatteverket.se',
              'almega.se',
              'unionen.se',
              'scb.se'
            ];
            
            if (trustedDomains.some(domain => fullUrl.includes(domain))) {
              discoveredLinks.push(fullUrl);
              console.log(`🔗 Hittade relaterad länk: ${fullUrl}`);
            }
        }
      });
      
      // Filtrera innehåll baserat på nyckelord
      const relevantContent = extractRelevantContent(pageContent, relevantKeywords);
      if (relevantContent) {
        newInformation += `\n\n--- INFORMATION FRÅN ${source.name.toUpperCase()} ---\n${relevantContent}`;
        console.log(`✅ Hittade relevant information från ${source.name} (${relevantContent.length} tecken)`);
        
        // Lägg till i lärningsloggen
        learningLog.push({
          timestamp: new Date().toISOString(),
          source: source.name,
          url: targetUrl,
          priority: source.priority || 'medium',
          content_length: relevantContent.length,
          content_summary: relevantContent.substring(0, 150) + '...'
        });
      } else {
        console.log(`ℹ️ Ingen relevant information hittades från ${source.name}`);
      }
    } catch (error) {
      console.error(`❌ Fel vid hämtning från ${source.name}:`, error.message);
    }
  }
  
  // Besök upp till 5 av de upptäckta relaterade länkarna
  const maxExtraLinks = 5;
  console.log(`🔍 Undersöker upp till ${maxExtraLinks} relaterade länkar...`);
  
  for (let i = 0; i < Math.min(discoveredLinks.length, maxExtraLinks); i++) {
    const url = discoveredLinks[i];
    
    try {
      // Undvik dubletter
      if (visitedUrls.has(url)) {
        continue;
      }
      
      console.log(`🔍 Söker information från relaterad länk: ${url}`);
      const response = await axios.get(url);
      const $ = cheerio.load(response.data);
      visitedUrls.add(url);
      
      // Extrahera relevant innehåll
      let pageContent = '';
      $('article, .content-area, main, p, h1, h2, h3, li, .news-item').each((_, el) => {
        pageContent += $(el).text() + ' ';
      });
      
      // Filtrera innehåll baserat på nyckelord
      const relevantContent = extractRelevantContent(pageContent, relevantKeywords);
      if (relevantContent) {
        newInformation += `\n\n--- INFORMATION FRÅN RELATERAD KÄLLA: ${url} ---\n${relevantContent}`;
        console.log(`✅ Hittade relevant information från relaterad länk (${relevantContent.length} tecken)`);
        
        // Lägg till i lärningsloggen
        learningLog.push({
          timestamp: new Date().toISOString(),
          source: 'Relaterad källa',
          url: url,
          priority: 'medium',
          content_length: relevantContent.length,
          content_summary: relevantContent.substring(0, 150) + '...'
        });
      } else {
        console.log(`ℹ️ Ingen relevant information hittades från relaterad länk: ${url}`);
      }
    } catch (error) {
      console.error(`❌ Fel vid hämtning från relaterad länk ${url}:`, error.message);
    }
  }
  
  // Om vi hittat ny information, analysera den med OpenAI
  if (newInformation.length > 100) {
    console.log('🧠 Analyserar ny information med OpenAI...');
    
    try {
      const analysisResponse = await openai.chat.completions.create({
        model: 'gpt-4o',
        messages: [
          {
            role: 'system',
            content: 'Du är en AI-expert på att analysera information om föräldrapenning i Sverige. Extrahera all relevant information om nya regler, ändringar, belopp och datum. Var särskilt uppmärksam på information rörande 2025 och framåt. Strukturera informationen tydligt med rubriker och punktlistor.'
          },
          {
            role: 'user',
            content: `Analysera följande information om föräldrapenning och extrahera alla viktiga fakta, särskilt gällande nya regler från april 2025:\n\n${newInformation}`
          }
        ],
        temperature: 0.5,
        max_tokens: 1000
      });
      
      const analysisResult = analysisResponse.choices[0].message.content;
      console.log('✅ Analys slutförd');
      
      // Uppdatera officiell data
      if (!officialData.automatically_collected) {
        officialData.automatically_collected = {};
      }
      
      // Spara analysresultat
      officialData.automatically_collected[latestUpdateDate] = {
        raw_information: newInformation,
        analysis: analysisResult
      };
      
      // Uppdatera senaste regler för 2025 om analysen innehåller relevant information
      if (analysisResult.toLowerCase().includes('2025') || 
          analysisResult.toLowerCase().includes('april') || 
          analysisResult.toLowerCase().includes('nya regler')) {
        
        // Verifiera informationen med en extra OpenAI-förfrågan för att säkerställa kvaliteten
        try {
          console.log('🧠 Verifierar information med extra OpenAI-förfrågan...');
          
          const verificationResponse = await openai.chat.completions.create({
            model: 'gpt-4o',
            messages: [
              {
                role: 'system',
                content: 'Du är en faktagranskare som specialiserar sig på svensk föräldrapenning och regler från Försäkringskassan. Din uppgift är att STRIKT granska information och flagga eventuella påståenden som saknar bekräftad källa. Det är kritiskt att vi inte sprider felaktig information om föräldrapenning 2025.'
              },
              {
                role: 'user',
                content: `VIKTIGT: Granska följande information om föräldrapenning 2025 EXTREMT NOGA. 

FELAKTIGA påståenden som INTE får förekomma:
1. Att man kan ta ut föräldrapenning på sjukpenningnivå för arbetsfria dagar utan att ta ut någon mer dag (detta är FELAKTIGT)
2. Att man måste ta ut 5 hela föräldrapenningdagar per vecka för att skydda SGI (detta är FELAKTIGT)

Granska följande information: ${analysisResult}`
              }
            ],
            temperature: 0.3,
            max_tokens: 800
          });
          
          const verificationResult = verificationResponse.choices[0].message.content;
          console.log('✅ Verifiering slutförd');
          
          // Om verifieringen indikerar att informationen är korrekt
          if (verificationResult.toLowerCase().includes('korrekt') || 
              verificationResult.toLowerCase().includes('verifierad') ||
              verificationResult.toLowerCase().includes('stämmer')) {
            
            // Lägg till den nya informationen till befintlig information
            if (officialData.nya_regler_2025) {
              officialData.nya_regler_2025 = analysisResult + '\n\n--- TIDIGARE INFORMATION ---\n' + officialData.nya_regler_2025.split('--- SENASTE AUTOMATISKA UPPDATERINGEN ---')[0];
            } else {
              officialData.nya_regler_2025 = analysisResult;
            }
            
            console.log('✅ Uppdaterade information om 2025-regler (verifierad)');
          } else {
            // Om verifieringen påpekade viktiga korrigeringar, använd den korrigerade informationen
            if (officialData.nya_regler_2025) {
              officialData.nya_regler_2025 = verificationResult + '\n\n--- TIDIGARE INFORMATION ---\n' + officialData.nya_regler_2025.split('--- SENASTE AUTOMATISKA UPPDATERINGEN ---')[0];
            } else {
              officialData.nya_regler_2025 = verificationResult;
            }
            
            console.log('✅ Uppdaterade information om 2025-regler (korrigerad)');
          }
          
          // Spara även verifieringen
          if (!officialData.verifications) {
            officialData.verifications = [];
          }
          
          officialData.verifications.push({
            timestamp: new Date().toISOString(),
            original: analysisResult.substring(0, 200) + '...',
            verification: verificationResult.substring(0, 200) + '...'
          });
          
        } catch (error) {
          console.error('❌ Fel vid verifiering:', error.message);
          
          // Fallback om verifieringen misslyckas
          if (officialData.nya_regler_2025) {
            officialData.nya_regler_2025 += '\n\n--- SENASTE AUTOMATISKA UPPDATERINGEN ---\n' + analysisResult;
          } else {
            officialData.nya_regler_2025 = analysisResult;
          }
          
          console.log('✅ Uppdaterade information om 2025-regler (ej verifierad)');
        }
      }
      
      // Uppdatera senaste uppdateringen
      officialData.senast_uppdaterad = latestUpdateDate;
      officialData.källa = 'Automatiskt insamlad från betrodda källor: ' + trustedSources.map(s => s.name).join(', ');
      
      // Spara uppdaterad data
      fs.writeFileSync('official_data.json', JSON.stringify(officialData, null, 2));
      fs.writeFileSync('learning_log.json', JSON.stringify(learningLog, null, 2));
      
      console.log('✅ Sparade uppdaterad information till official_data.json');
      console.log('✅ Sparade inlärningslogg till learning_log.json');
      
      // Uppdatera assistenten med ny information
      await updateAssistant();
      
      return {
        success: true,
        message: 'Automatisk inlärning slutförd. Hittade och analyserade ny information.',
        sources_checked: trustedSources.length,
        new_information_length: newInformation.length,
        analysis_length: analysisResult.length
      };
    } catch (error) {
      console.error('❌ Fel vid analys med OpenAI:', error.message);
      return {
        success: false,
        message: 'Fel vid analys med OpenAI: ' + error.message
      };
    }
  } else {
    console.log('ℹ️ Inte tillräckligt med ny information hittades för analys');
    
    // Spara uppdaterad inlärningslogg ändå
    fs.writeFileSync('learning_log.json', JSON.stringify(learningLog, null, 2));
    
    return {
      success: true,
      message: 'Automatisk inlärning slutförd. Ingen tillräcklig ny information hittades.',
      sources_checked: trustedSources.length
    };
  }
}

/**
 * Extraherar relevant innehåll baserat på nyckelord med viktat relevanssystem
 */
function extractRelevantContent(text, keywords) {
  // Dela upp texten i meningar
  const sentences = text.split(/[.!?]+/).filter(sentence => sentence.trim().length > 10);
  
  // Skapa ett relevanssystem för meningar
  const scoredSentences = sentences.map(sentence => {
    const lowerSentence = sentence.toLowerCase();
    let score = 0;
    
    // Beräkna poäng baserat på antal nyckelord och deras betydelse
    const highPriorityKeywords = ['2025', 'april 2025', '1 april 2025', 'nya regler', 'rapporteringsskyldighet'];
    const mediumPriorityKeywords = ['föräldrapenning', 'föräldradagar', 'reserverade', 'sgi skydd', 'proposition'];
    
    // Ge högre poäng för högprioriterade nyckelord
    highPriorityKeywords.forEach(keyword => {
      if (lowerSentence.includes(keyword.toLowerCase())) {
        score += 3;
      }
    });
    
    // Ge medium poäng för mediumprioriterade nyckelord
    mediumPriorityKeywords.forEach(keyword => {
      if (lowerSentence.includes(keyword.toLowerCase())) {
        score += 2;
      }
    });
    
    // Ge baspoäng för alla andra nyckelord
    keywords.forEach(keyword => {
      if (!highPriorityKeywords.includes(keyword) && !mediumPriorityKeywords.includes(keyword) && 
          lowerSentence.includes(keyword.toLowerCase())) {
        score += 1;
      }
    });
    
    // Ge extra poäng för meningar som innehåller datum eller sifferuppgifter
    if (/\d{4}/.test(lowerSentence) || /\d+\s*(kr|kronor|procent|%)/.test(lowerSentence)) {
      score += 2;
    }
    
    // Ge extra poäng för meningar som ser ut att innehålla ändringar eller nya regler
    if (lowerSentence.includes('ändras') || 
        lowerSentence.includes('ändring') || 
        lowerSentence.includes('träder i kraft') || 
        lowerSentence.includes('gäller från')) {
      score += 2;
    }
    
    return { sentence, score };
  });
  
  // Sortera meningar efter relevans och ta de mest relevanta
  const sortedSentences = scoredSentences
    .filter(item => item.score > 0)  // Filtrera bort irrelevanta meningar
    .sort((a, b) => b.score - a.score); // Sortera efter poäng (högst först)
  
  // Om det finns tillräckligt många relevanta meningar, sammanställ dem
  if (sortedSentences.length > 0) {
    // Gruppera meningar för att behålla kontext
    // Vi vill ha de mest relevanta men också behålla ordning i källtexten
    let contextGroups = [];
    let currentGroup = [];
    
    // Skapa en indexerad kopia av den ursprungliga meningsordningen
    const originalSentencesMap = sentences.reduce((map, sentence, index) => {
      map[sentence] = index;
      return map;
    }, {});
    
    // Sortera de relevanta meningarna efter deras ursprungliga ordning
    const orderedSentences = [...sortedSentences]
      .sort((a, b) => originalSentencesMap[a.sentence] - originalSentencesMap[b.sentence]);
    
    // Bilda sammanhängande grupper av meningar för bättre kontext
    orderedSentences.forEach((item, index) => {
      if (index > 0) {
        const prevIndex = originalSentencesMap[orderedSentences[index-1].sentence];
        const currIndex = originalSentencesMap[item.sentence];
        
        // Om meningarna är i sekvens (med ett visst avstånd), lägg till i samma grupp
        if (currIndex - prevIndex <= 3) {
          currentGroup.push(item);
        } else {
          // Annars, starta en ny grupp
          if (currentGroup.length > 0) {
            contextGroups.push([...currentGroup]);
          }
          currentGroup = [item];
        }
      } else {
        currentGroup.push(item);
      }
    });
    
    // Lägg till den sista gruppen
    if (currentGroup.length > 0) {
      contextGroups.push(currentGroup);
    }
    
    // Sammanställ all information, grupperad efter kontext
    const result = contextGroups
      .map(group => group.map(item => item.sentence.trim() + '.').join(' '))
      .join('\n\n');
    
    return result;
  }
  
  return null;
}

/**
 * Uppdaterar assistenten med nya instruktioner
 */
async function updateAssistant() {
  try {
    console.log('🔄 Uppdaterar assistenten med ny inlärd information...');
    await createAssistant(openai);
    console.log('✅ Assistenten uppdaterad');
    return true;
  } catch (error) {
    console.error('❌ Fel vid uppdatering av assistenten:', error.message);
    return false;
  }
}

/**
 * Kör den automatiska inlärningen manuellt
 */
async function runManualLearning() {
  console.log('🔄 Startar manuell inlärningssession...');
  const result = await collectNewInformation();
  console.log('📊 RESULTAT:', result);
  return result;
}

module.exports = {
  collectNewInformation,
  updateAssistant,
  runManualLearning
};
