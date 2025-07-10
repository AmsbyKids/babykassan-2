
/**
 * Swedish Municipal Tax Calculator
 */

const kommunSkattesatser = {
  'stockholm': 0.2982,
  'göteborg': 0.3260,
  'malmö': 0.3242,
  'uppsala': 0.3285,
  'linköping': 0.3210,
  'örebro': 0.3290,
  'västerås': 0.3150,
  'helsingborg': 0.3139,
  'norrköping': 0.3315,
  'jönköping': 0.3275,
  'umeå': 0.3415,
  'lund': 0.3193,
  'borås': 0.3279,
  'eskilstuna': 0.3360,
  'gävle': 0.3377,
  'sundsvall': 0.3388,
  'karlstad': 0.3295,
  'växjö': 0.3219,
  'halmstad': 0.3238,
  'norrtälje': 0.3212,
  'kalmar': 0.3367,
  'falun': 0.3340,
  'skellefteå': 0.3395,
  'karlskrona': 0.3369,
  'östersund': 0.3392,
  'trollhättan': 0.3341,
  'luleå': 0.3384,
  'kristianstad': 0.3290,
  'uddevalla': 0.3364,
  'varberg': 0.3214
};

const DEFAULT_TAX_RATE = 0.32; // 32% schablonskatt

/**
 * Get tax rate for a specific municipality
 * @param {string} kommun - Municipality name
 * @returns {number} Tax rate as decimal
 */
function getTaxRate(kommun) {
  if (!kommun) return DEFAULT_TAX_RATE;
  
  const normalizedKommun = kommun.toLowerCase().trim();
  return kommunSkattesatser[normalizedKommun] || DEFAULT_TAX_RATE;
}

/**
 * Calculate net amount after tax
 * @param {number} amount - Gross amount
 * @param {string} kommun - Municipality name
 * @returns {number} Net amount after tax
 */
function calculateNetAmount(amount, kommun) {
  const taxRate = getTaxRate(kommun);
  return Math.round(amount * (1 - taxRate));
}

module.exports = {
  getTaxRate,
  calculateNetAmount,
  DEFAULT_TAX_RATE
};
