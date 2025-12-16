import React from "react";
import ServiceLayout from "../../components/ServiceLayout";

const FixedDeposit = () => {
  const types = [
    { name: "ELSS (Equity Linked Savings Scheme)", desc: "Get tax benefits under Section 80C with a 3-year lock-in period." },
    { name: "NPS (National Pension Scheme)", desc: "Save for retirement while enjoying additional tax deductions." },
    { name: "Tax Saving FDs", desc: "Fixed deposits with tax-saving benefits and assured returns." },
    { name: "PPF (Public Provident Fund)", desc: "Long-term tax saving option with government backing." },
    { name: "Insurance Premiums", desc: "Life and health insurance premiums qualify for tax deductions." }
  ];

  const benefits = [
    { name: "Maximized Savings", desc: "Optimize your tax outgo with effective planning." },
    { name: "Legal Compliance", desc: "Ensure your investments are compliant with Indian tax laws." },
    { name: "Wealth Creation", desc: "Invest in tax-saving instruments that also generate returns." },
    { name: "Retirement Security", desc: "Plan early for a financially secure retirement." },
    { name: "Expert Guidance", desc: "Tailored strategies to match your income, goals, and risk appetite." }
  ];

  return (
    <ServiceLayout
      title="Fixed Deposit"
      subtitle="Smart Planning. Big Savings."
      description="Effective fund planning is not just about saving fund, it’s about aligning your financial decisions with your long-term goals. 
      At Trust Point Wealth Partners, we help you choose the best Fund instruments that maximize savings and ensure compliance."
      types={types}
      benefits={benefits}
      ctaText="Save more with smart Fixed Deposit planning strategies."
      ctaAction={() => alert('Explore Fixed Deposit Options')}
    />
  );
};

export default FixedDeposit;
