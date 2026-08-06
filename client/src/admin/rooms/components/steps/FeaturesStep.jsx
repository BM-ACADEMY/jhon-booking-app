import WhatThisPlaceOffers from '../sections/WhatThisPlaceOffers';

/** Wizard step 3 — what this place offers (amenities). */
const FeaturesStep = ({ form, patch, readOnly }) => (
  <div className="space-y-8">
    <div>
      <h4 className="text-sm font-bold text-zinc-900 mb-3">What this place offers</h4>
      <WhatThisPlaceOffers form={form} patch={patch} readOnly={readOnly} />
    </div>
  </div>
);

export default FeaturesStep;
