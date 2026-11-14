import React from 'react';
import { CalculatorManagerPage } from './CalculatorManagerPage';
import { PackagingItemsPage } from './PackagingItemsPage';
import { PackagingPricingTiersPage } from './PackagingPricingTiersPage';
import { PricingEngineTiersPage } from './PricingEngineTiersPage';

/** Packaging Pricing Tiers screen with its "Packaging Items" tab wired to the real Packaging Items page. */
export const PackagingPricingTiersRoute: React.FC = () => (
  <PackagingPricingTiersPage itemsView={<PackagingItemsPage embedded />} />
);

export { CalculatorManagerPage, PackagingItemsPage, PackagingPricingTiersPage, PricingEngineTiersPage };

/*
  Router example (react-router), all under the "Calculator Setup" sidebar item:

  <Route path="/calculator-setup"                 element={<CalculatorManagerPage />} />
  <Route path="/calculator-setup/packaging-items" element={<PackagingItemsPage />} />
  <Route path="/calculator-setup/packaging-tiers" element={<PackagingPricingTiersRoute />} />
  <Route path="/calculator-setup/pricing-engine"  element={<PricingEngineTiersPage />} />
*/
