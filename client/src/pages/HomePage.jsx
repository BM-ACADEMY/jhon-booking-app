import { Helmet } from 'react-helmet-async';
import HeroSection from '../sections/HeroSection';
import RoomsSection from '../sections/RoomsSection';
import FeaturesSection from '../sections/FeaturesSection';
import TestimonialsSection from '../sections/TestimonialsSection';
// import CtaBanner from '../sections/CtaBanner';

const HomePage = () => (
  <>
    <Helmet>
      <title>The Balified Villa | Bali & Greek Themed Villa Stay in Pondicherry</title>
      <meta name="description" content="Discover The Balified Villa — a Bali & Greek themed private pool villa stay in Pondicherry, near Serenity Beach & Auroville. Book your themed getaway today." />
    </Helmet>
    <HeroSection />
    <RoomsSection />
    <FeaturesSection />
    <TestimonialsSection />
    {/* <CtaBanner /> */}
  </>
);

export default HomePage;
