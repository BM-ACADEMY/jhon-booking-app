import FeaturesSection from '../sections/FeaturesSection';
import AmenitiesSection from '../sections/AmenitiesSection';

/** Wizard step 3 — highlights and amenities. */
const FeaturesStep = ({ form, patch, readOnly }) => (
  <div className="space-y-8">
    <FeaturesSection form={form} patch={patch} readOnly={readOnly} />
    <AmenitiesSection form={form} patch={patch} readOnly={readOnly} />
  </div>
);

export default FeaturesStep;
