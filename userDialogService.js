
const fs = require('fs');

/**
 * Proaktiv dialoghanterare för att ställa följdfrågor och samla information
 */
class UserDialogService {
  constructor() {
    this.userProfiles = {};
    this.questionFlows = {
      initial: [
        {
          id: 'income',
          question: 'Vad är din månadsinkomst före skatt?',
          hint: 'Detta hjälper oss beräkna din föräldrapenning korrekt',
          followUp: 'municipality'
        },
        {
          id: 'municipality',
          question: 'Vilken kommun bor du i?',
          hint: 'Detta behövs för att beräkna korrekt skatt på din föräldrapenning',
          followUp: 'employment'
        },
        {
          id: 'employment',
          question: 'Vilken typ av anställning har du?',
          options: ['Fast anställd', 'Visstidsanställd', 'Egenföretagare', 'Arbetssökande', 'Studerande'],
          followUp: (answer) => answer === 'Egenföretagare' ? 'business' : 'childBirth'
        },
        {
          id: 'business',
          question: 'Hur länge har du haft ditt företag och vilken företagsform har du?',
          hint: 'Detta påverkar din SGI (sjukpenninggrundande inkomst)',
          followUp: 'childBirth'
        },

/**
 * Returnerar standardfrågor när vi saknar specifik kontextinformation
 * @returns {string[]} En array med öppna följdfrågor
 */
function getDefaultFollowUpQuestions() {
  return [
    "Berätta mer om din familjesituation och hur du planerar att fördela föräldraledigheten.",
    "Hur ser din ekonomiska situation ut idag, och vad är dina förväntningar under föräldraledigheten?",
    "På vilket sätt skulle din arbetsgivare kunna påverka din föräldraledighet och ekonomi?",
    "Vilka är dina största funderingar eller orosmoment kring föräldrapenningen?",
    "Hur mycket vet du om de nya reglerna för föräldrapenning som träder i kraft 2025?",
    "Hur ser du på balansen mellan föräldraledighet och arbete? Funderar du på deltidslösningar?",
    "Vad är viktigast för dig när det gäller planeringen av din föräldraledighet - ekonomi, tid med barnet, eller karriärutveckling?"
  ];
}

        {
          id: 'childBirth',
          question: 'När är/var ditt barn fött eller planerar du/ni att barnet ska födas?',
          hint: 'Format: ÅÅÅÅ-MM-DD',
          followUp: 'parentalLeave'
        },
        {
          id: 'parentalLeave',
          question: 'Hur planerar du att fördela din föräldraledighet?',
          hint: 'T.ex. "7 månader heltid, sedan 3 månader halvtid"',
          followUp: 'partnerStatus'
        },
        {
          id: 'partnerStatus',
          question: 'Kommer barnets andra förälder också ta ut föräldraledighet?',
          options: ['Ja', 'Nej', 'Osäkert', 'Ingen annan förälder'],
          followUp: (answer) => answer === 'Ja' ? 'partnerIncome' : 'employerBenefit'
        },
        {
          id: 'partnerIncome',
          question: 'Vad är den andra förälderns månadsinkomst före skatt?',
          hint: 'För att beräkna optimal fördelning av föräldradagar',
          followUp: 'employerBenefit'
        },
        {
          id: 'employerBenefit',
          question: 'Har din arbetsgivare någon extra ersättning vid föräldraledighet?',
          hint: 'T.ex. föräldralön eller föräldrapenningtillägg',
          options: ['Ja', 'Nej', 'Vet inte'],
          followUp: (answer) => answer === 'Ja' ? 'employerBenefitDetails' : null
        },
        {
          id: 'employerBenefitDetails',
          question: 'Beskriv arbetsgivarens extra ersättning. Hur många månader och hur mycket?',
          followUp: null
        }
      ],
      daycare: [
        {
          id: 'daycareStart',
          question: 'När planerar ni att barnet ska börja i förskola/barnomsorg?',
          hint: 'Format: ÅÅÅÅ-MM-DD eller "Ingen plats planerad ännu"',
          followUp: 'daycareHours'
        },
        {
          id: 'daycareHours',
          question: 'Hur många timmar per vecka planerar ni att barnet ska vara i barnomsorg?',
          hint: 'Detta kan påverka rätten till föräldrapenning vid deltidsarbete',
          followUp: null
        }
      ],
      planningSpecific: [
        {
          id: 'specificMonth',
          question: 'Vilken månad vill du få detaljerade beräkningar för?',
          hint: 'T.ex. "april 2025" eller "första månaden med barn"',
          followUp: 'specificIncome'
        },
        {
          id: 'specificIncome',
          question: 'Vill du beräkna nettoinkomsten för en specifik ersättningsnivå?',
          options: ['Heltid (100%)', 'Deltid (75%)', 'Halvtid (50%)', 'Kvartsfart (25%)', 'Endast grundnivå'],
          followUp: null
        }
      ]
    };
    
    this.loadProfiles();
  }
  
  /**
   * Läser in befintliga användarprofiler
   */
  loadProfiles() {
    try {
      if (fs.existsSync('user_profiles.json')) {
        this.userProfiles = JSON.parse(fs.readFileSync('user_profiles.json', 'utf8'));
      }
    } catch (error) {
      console.error('Kunde inte läsa användarprofiler:', error.message);
      this.userProfiles = {};
    }
  }
  
  /**
   * Sparar användarprofiler
   */
  saveProfiles() {
    try {
      fs.writeFileSync('user_profiles.json', JSON.stringify(this.userProfiles, null, 2));
    } catch (error) {
      console.error('Kunde inte spara användarprofiler:', error.message);
    }
  }
  
  /**
   * Skapar eller uppdaterar en användarprofil
   */
  updateUserProfile(userId, answers) {
    if (!this.userProfiles[userId]) {
      this.userProfiles[userId] = {
        created: new Date().toISOString(),
        answers: {}
      };
    }
    
    // Uppdatera svar
    this.userProfiles[userId].answers = {
      ...this.userProfiles[userId].answers,
      ...answers
    };
    
    this.userProfiles[userId].lastUpdated = new Date().toISOString();
    this.saveProfiles();
    return this.userProfiles[userId];
  }
  
  /**
   * Hämtar användarens profil
   */
  getUserProfile(userId) {
    return this.userProfiles[userId] || null;
  }
  
  /**
   * Genererar nästa fråga baserat på användarens svar
   */
  getNextQuestion(userId, currentQuestionId = null, answer = null) {
    const profile = this.getUserProfile(userId);
    
    // Om vi har ett svar, uppdatera profilen
    if (currentQuestionId && answer !== null) {
      const updates = {};
      updates[currentQuestionId] = answer;
      this.updateUserProfile(userId, updates);
    }
    
    // Bestäm vilket flöde vi är i baserat på tidigare svar och frågor
    let flow = 'initial';
    if (profile && profile.answers.childBirth && !profile.answers.daycareStart) {
      // Om vi har svarat på barnets födelsedatum men inte förskola, ge förskoleflödet
      flow = 'daycare';
    } else if (profile && Object.keys(profile.answers).length >= 5) {
      // Om vi har tillräckligt med grundinformation, fråga om specifika beräkningar
      flow = 'planningSpecific';
    }
    
    // Hitta rätt flöde
    const questions = this.questionFlows[flow];
    
    // Om vi inte har en aktuell fråga, ta den första i flödet
    if (!currentQuestionId) {
      return questions[0];
    }
    
    // Hitta aktuell fråga
    const currentQuestionIndex = questions.findIndex(q => q.id === currentQuestionId);
    if (currentQuestionIndex === -1) {
      // Om vi inte hittar frågan i aktuellt flöde, börja om med första frågan
      return questions[0];
    }
    
    // Hämta aktuell fråga
    const currentQuestion = questions[currentQuestionIndex];
    
    // Bestäm följdfråga
    let nextQuestionId;
    if (typeof currentQuestion.followUp === 'function') {
      nextQuestionId = currentQuestion.followUp(answer);
    } else {
      nextQuestionId = currentQuestion.followUp;
    }
    
    // Om det inte finns någon följdfråga eller om vi är i slutet av ett flöde
    if (!nextQuestionId) {
      if (flow === 'initial') {
        // Gå vidare till nästa flöde
        return this.questionFlows.daycare[0];
      } else if (flow === 'daycare') {
        // Gå vidare till specifika beräkningar
        return this.questionFlows.planningSpecific[0];
      } else {
        // Vi har ställt alla frågor, returnera null
        return null;
      }
    }
    
    // Hitta nästa fråga i flödet
    return questions.find(q => q.id === nextQuestionId) || null;
  }
  
  /**
   * Genererar anpassade beräkningar baserat på användarens profil
   */
  generatePersonalizedCalculations(userId) {
    const profile = this.getUserProfile(userId);
    if (!profile) {
      return {
        success: false,
        message: 'Ingen användarprofil hittad'
      };
    }
    
    const { answers } = profile;
    
    // Kontrollera att vi har tillräckligt med information
    if (!answers.income || !answers.childBirth) {
      return {
        success: false,
        message: 'Otillräcklig information för att generera beräkningar'
      };
    }
    
    // Beräkna SGI baserat på månadsinkomst
    const monthlyIncome = parseInt(answers.income, 10);
    const sgi = monthlyIncome * 12;
    
    // Maxtak för SGI
    const maxSGI = 588000; // 10 prisbasbelopp 2025
    const appliedSGI = Math.min(sgi, maxSGI);
    
    // Beräkna föräldrapenning på sjukpenningnivå (ca 80%)
    const dailyAmount = (appliedSGI / 365) * 0.8;
    const maxDailyAmount = 1250; // Max belopp per dag 2025
    const appliedDailyAmount = Math.min(dailyAmount, maxDailyAmount);
    
    // Beräkna månatlig föräldrapenning (ca 30 dagar/månad)
    const monthlyParentalBenefit = Math.round(appliedDailyAmount * 30);
    
    // Skatta föräldrapenningen (förenklad modell)
    const estimatedTaxRate = 0.25; // 25% skatt
    const netMonthlyParentalBenefit = Math.round(monthlyParentalBenefit * (1 - estimatedTaxRate));
    
    // Om arbetsgivaren har extra ersättning
    let employerSupplementAmount = 0;
    if (answers.employerBenefit === 'Ja' && answers.employerBenefitDetails) {
      // Enkel uppskattning, i verkligheten skulle detta behöva en mer komplex beräkning
      employerSupplementAmount = Math.round(monthlyIncome * 0.1); // 10% av lönen som exempel
    }
    
    // Total ersättning efter skatt
    const totalNetCompensation = netMonthlyParentalBenefit + employerSupplementAmount;
    
    // Skillnad mot ordinarie lön
    const netSalary = Math.round(monthlyIncome * (1 - estimatedTaxRate));
    const differenceProcent = Math.round((totalNetCompensation / netSalary) * 100);
    
    return {
      success: true,
      calculations: {
        sgi: appliedSGI,
        maxSGI: maxSGI,
        dailyAmount: Math.round(appliedDailyAmount),
        monthlyParentalBenefit: monthlyParentalBenefit,
        netMonthlyParentalBenefit: netMonthlyParentalBenefit,
        employerSupplementAmount: employerSupplementAmount,
        totalNetCompensation: totalNetCompensation,
        ordinarySalary: monthlyIncome,
        netOrdinarySalary: netSalary,
        compensationRate: `${differenceProcent}%`
      },
      message: 'Beräkningar genomförda baserat på din profil'
    };
  }
  
  /**
   * Genererar följdfrågor baserat på användarens tidigare svar och saknad information
   */
  generateFollowUpQuestions(userId, currentQuestion) {
    const profile = this.getUserProfile(userId);
    if (!profile) {
      return {
        success: false,
        message: 'Ingen användarprofil hittad',
        questions: getDefaultFollowUpQuestions()
      };
    }
    
    const { answers } = profile;
    const followUpQuestions = [];
    
    // Identifiera saknad nyckelinformation
    if (!answers.income) {
      followUpQuestions.push("Vad är din månadsinkomst före skatt? Detta hjälper mig att beräkna exakt föräldrapenning.");
    }
    
    if (!answers.employment) {
      followUpQuestions.push("Vilken typ av anställning har du? (Fast anställd, visstid, egenföretagare, etc.)");
    }
    
    if (!answers.childBirth) {
      followUpQuestions.push("När är eller var ditt barn fött? Alternativt, när planerar ni att barnet ska födas?");
    }
    
    if (!answers.parentalLeave && answers.childBirth) {
      followUpQuestions.push("Hur planerar du att fördela din föräldraledighet? (Exempelvis antal månader heltid/deltid)");
    }
    
    if (!answers.partnerStatus && answers.childBirth) {
      followUpQuestions.push("Kommer barnets andra förälder också ta ut föräldraledighet? I så fall, hur mycket?");
    }
    
    if (!answers.employerBenefit && answers.employment && answers.employment !== 'Egenföretagare') {
      followUpQuestions.push("Har din arbetsgivare någon extra ersättning vid föräldraledighet, som föräldralön?");
    }
    
    // Om vi har grundläggande information men saknar specifika detaljer
    if (answers.income && answers.employment && answers.childBirth) {
      if (!answers.specificMonth) {
        followUpQuestions.push("För vilken specifik period vill du ha en detaljerad beräkning av din föräldrapenning?");
      }
    }
    
    // Om vi redan har mycket information, ställ mer detaljerade frågor
    if (Object.keys(answers).length >= 5) {
      followUpQuestions.push("Finns det några specifika ekonomiska mål eller begränsningar du har under föräldraledigheten?");
      followUpQuestions.push("Har du några funderingar kring specifika regler eller undantag som kan påverka din föräldrapenning?");
    }
    
    // Om vi har för få frågor, lägg till några allmänna
    while (followUpQuestions.length < 3) {
      const defaultQuestions = getDefaultFollowUpQuestions();
      for (const q of defaultQuestions) {
        if (!followUpQuestions.includes(q)) {
          followUpQuestions.push(q);
          break;
        }
      }
    }
    
    // Begränsa till max 4 frågor
    return {
      success: true,
      questions: followUpQuestions.slice(0, 4)
    };
  }
  
  /**
   * Genererar personliga förslag baserat på användarens profil
   */
  generatePersonalizedSuggestions(userId) {
    const profile = this.getUserProfile(userId);
    if (!profile) {
      return {
        success: false,
        message: 'Ingen användarprofil hittad'
      };
    }
    
    const { answers } = profile;
    const suggestions = [];
    
    // Förslag baserat på inkomst
    if (answers.income) {
      const monthlyIncome = parseInt(answers.income, 10);
      if (monthlyIncome > 49000) {
        suggestions.push(
          'Din inkomst överstiger SGI-taket på 588 000 kr per år. Kontrollera med din arbetsgivare om de erbjuder föräldralön som kompenserar för inkomster över taket.'
        );
      }
    }
    
    // Förslag baserat på anställningsform
    if (answers.employment === 'Egenföretagare') {
      suggestions.push(
        'Som egenföretagare bör du granska reglerna för SGI-skydd. Din SGI baseras på din nettoinkomst från verksamheten, inte på vad du tar ut i lön.'
      );
    } else if (answers.employment === 'Visstidsanställd') {
      suggestions.push(
        'Med visstidsanställning är det viktigt att planera din föräldraledighet så att du har SGI-skydd även efter att anställningen upphör.'
      );
    } else if (answers.employment === 'Studerande') {
      suggestions.push(
        'Som studerande kan du få föräldrapenning på grundnivå (250 kr/dag). Om du arbetat innan studierna, kan din SGI vara skyddad under studietiden.'
      );
    }
    
    // Förslag baserat på barnets födelsedatum
    if (answers.childBirth) {
      const birthDate = new Date(answers.childBirth);
      const today = new Date();
      
      if (birthDate > today) {
        suggestions.push(
          'Kom ihåg att anmäla graviditeten till Försäkringskassan senast i vecka 32 för att få graviditetspenning om ditt arbete är fysiskt krävande.'
        );
      }
      
      // Kontrollera om barnet föds efter 1 april 2025 (nya reglerna)
      const april2025 = new Date('2025-04-01');
      if (birthDate >= april2025) {
        suggestions.push(
          'Ditt barn kommer att födas efter 1 april 2025, då nya regler för föräldrapenning vid arbetsfri tid införs. Du kan ta ut föräldrapenning på sjukpenningnivå under arbetsfria dagar om du tar ut föräldrapenning i samma omfattning för dagar direkt före eller efter.'
        );
      }
    }
    
    // Förslag om dubbeldagar
    if (answers.partnerStatus === 'Ja') {
      suggestions.push(
        'Ni kan använda upp till 60 dubbeldagar under barnets första 15 månader, vilket låter er vara hemma tillsammans. Dubbeldagar kan inte tas från de 90 reserverade dagarna.'
      );
    }
    
    // Förslag om optimal fördelning
    if (answers.partnerIncome && answers.income) {
      const ownIncome = parseInt(answers.income, 10);
      const partnerIncome = parseInt(answers.partnerIncome, 10);
      
      if (Math.abs(ownIncome - partnerIncome) > 10000) {
        const higherEarner = ownIncome > partnerIncome ? 'du' : 'din partner';
        suggestions.push(
          `Det finns en betydande inkomstskillnad mellan er. Ur rent ekonomiskt perspektiv kan det vara fördelaktigt att ${higherEarner} tar färre föräldradagar, men väg detta mot andra faktorer som är viktiga för er familj.`
        );
      }
    }
    
    return {
      success: true,
      suggestions: suggestions,
      message: 'Personliga förslag genererade baserat på din profil'
    };
  }
}

const userDialogService = new UserDialogService();
module.exports = {
  ...userDialogService,
  getDefaultFollowUpQuestions
};
