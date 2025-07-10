
const productKeywords = {
  babykläder: ['overall', 'kläder', 'body', 'pyjamas', 'mössa', 'vantar'],
  barnvagn: ['vagn', 'barnvagn', 'sulky', 'liggdel', 'sittdel'],
  leksaker: ['leksak', 'napp', 'mobil', 'skallra', 'aktivitetsgym'],
  säkerhet: ['bilstol', 'babyskydd', 'grind', 'spjälsäng', 'babyvakt'],
  amning: ['pump', 'amningskudde', 'flaska', 'nappflaska', 'amningsinlägg']
};

const partners = {
  babykläder: ['Polarn o. Pyret', 'Lindex Baby', 'HM Baby'],
  barnvagn: ['Babyproffsen', 'Jollyroom'],
  leksaker: ['Lekmer', 'BR Leksaker'],
  säkerhet: ['BabyWorld', 'Babyland'],
  amning: ['Apotek Hjärtat', 'Kronans Apotek']
};

function analyzeProductSignals(message) {
  const results = {
    categories: [],
    partners: [],
    signal: null,
    canShowAd: false
  };

  const lowerMessage = message.toLowerCase();

  for (const [category, keywords] of Object.entries(productKeywords)) {
    if (keywords.some(keyword => lowerMessage.includes(keyword))) {
      results.categories.push(category);
      results.partners.push(...partners[category]);
      results.canShowAd = true;
    }
  }

  if (results.categories.length > 0) {
    results.signal = `intresserad av ${results.categories.join(', ')}`;
  }

  return results;
}

module.exports = {
  analyzeProductSignals
};
