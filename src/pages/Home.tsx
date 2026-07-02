import Footer from '../components/Footer';
import TrendingProducts from '../components/TrendingProducts';
import WhyOrderDirect from '../components/home/WhyOrderDirect';
import SmartDeliveryModel from '../components/home/SmartDeliveryModel';
import FranchiseSection from '../components/FranchiseSection';
import DeliveryAppsSection from '../components/home/DeliveryAppsSection';
import TrustSection from '../components/home/TrustSection';
import AiVideosSection from '../components/AiVideosSection';
import ReviewsCarousel from '../components/ReviewsCarousel';
import VideoTestimonials from '../components/VideoTestimonials';
import MapsSection from '../components/MapsSection';

export default function Home() {
  return (
    <main>
      <TrustSection />
      <TrendingProducts />
      <WhyOrderDirect />
      <SmartDeliveryModel />
      <FranchiseSection />
      <DeliveryAppsSection />
      <AiVideosSection />
      <ReviewsCarousel />
      <VideoTestimonials />
      <MapsSection />
      <Footer />
    </main>
  );
}
