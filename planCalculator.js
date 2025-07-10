
const express = require('express');
const { calculateParentalBenefit } = require('./parentalBenefitCalculator');
const { calculateNetAmount } = require('./taxCalculator');
const { getVerifiedCurrentDate } = require('./swedishDateCalculator');

const router = express.Router();

router.get("/api/plan/auto", async (req, res) => {
  try {
    const sgi = parseInt(req.query.sgi);
    const kommun = req.query.kommun || 'Stockholm';
    const dagarKvar = parseInt(req.query.dagarKvar) || 480;
    const minNetto = parseInt(req.query.minNetto) || 12000;
    const maxManader = parseInt(req.query.maxManader) || 14;
    const { getStartMonthAndYear } = require('./swedishDateCalculator');
    const { year: startAr, month: startManad } = getStartMonthAndYear(1); // Start next month by default

    if (!sgi || !kommun) {
      return res.status(400).json({ error: 'För att kunna räkna behöver jag både SGI och kommun.' });
    }

    const plan = generateMonthByMonthPlan(sgi, maxManader, minNetto, dagarKvar);
    
    const formattedPlan = plan.months.map(month => ({
      manad: `${startManad + month.month - 1 > 12 ? startManad + month.month - 1 - 12 : startManad + month.month - 1}/${startAr + Math.floor((startManad + month.month - 1)/12)}`,
      dagar: month.days,
      brutto: month.amount,
      netto: calculateNetAmount(month.amount, kommun)
    }));

    const response = {
      plan_start: `${startManad} ${startAr}`,
      plan_slut: `${startManad + maxManader - 1 > 12 ? 'månad okänd' : startManad + maxManader - 1} ${startAr + Math.floor((startManad + maxManader - 1)/12)}`,
      dagar_per_vecka: 5,
      sgi,
      kommun,
      json_plan: formattedPlan,
      netto_per_manad: calculateNetAmount(plan.months[0].amount, kommun),
      brutto_per_manad: plan.months[0].amount,
      kvarvarande_dagar: plan.months[plan.months.length - 1].daysLeft
    };

    res.json(response);
  } catch (error) {
    console.error('Error generating plan:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

function generateMonthByMonthPlan(sgi, months, minNetPerMonth, remainingDays) {
  const { månatligErsättningBrutto } = calculateParentalBenefit(sgi, getVerifiedCurrentDate().date, months, 5);
  const daysPerMonth = Math.min(22, Math.ceil(remainingDays / months));
  
  const monthlyPlan = [];
  let daysLeft = remainingDays;
  
  for (let i = 0; i < months && daysLeft > 0; i++) {
    const daysThisMonth = Math.min(daysPerMonth, daysLeft);
    const monthAmount = Math.round((månatligErsättningBrutto / 22) * daysThisMonth);
    
    monthlyPlan.push({
      month: i + 1,
      days: daysThisMonth,
      amount: monthAmount,
      daysLeft: daysLeft - daysThisMonth
    });
    
    daysLeft -= daysThisMonth;
  }
  
  return {
    totalMonths: months,
    startingSGI: sgi,
    months: monthlyPlan
  };
}

module.exports = router;
