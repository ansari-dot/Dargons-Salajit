const PricingEngine = require('./pricingEngine');

const calculateCost = async (data) => {
  return await PricingEngine.calculate(data);
};

const getCalculatorOptions = async () => {
  return await PricingEngine.getFullConfig();
};

const saveConfiguration = async (data) => {
  return await PricingEngine.saveConfiguration(data);
};

const getConfigurationByReference = async (referenceNo) => {
  return await PricingEngine.getConfigurationByReference(referenceNo);
};

module.exports = {
  calculateCost,
  getCalculatorOptions,
  saveConfiguration,
  getConfigurationByReference
};
