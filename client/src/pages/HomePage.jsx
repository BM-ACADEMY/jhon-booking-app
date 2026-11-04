import { Helmet } from 'react-helmet-async';
import HeroSection from '../sections/HeroSection';
import RoomsSection from '../sections/RoomsSection';
import FeaturesSection from '../sections/FeaturesSection';
import TestimonialsSection from '../sections/TestimonialsSection';
// import CtaBanner from '../sections/CtaBanner';

const HomePage = () => (
  <>
    <Helmet>
      <title>Best Villa in Pondicherry: Themed Stays | The Balified Villa</title>
      <meta name="description" content="Stay at The Balified Villa, a Bali & Greek themed villa with a private pool near Serenity Beach & Auroville, Pondicherry. Book direct for your getaway." />
    </Helmet>
    <HeroSection />
    <RoomsSection />
    <FeaturesSection />
    <TestimonialsSection />
    {/* <CtaBanner /> */}
  </>
);

export default HomePage;
