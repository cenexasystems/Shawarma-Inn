import SEO from '../components/SEO';
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
  const restaurantSchema = {
    "@context": "https://schema.org",
    "@type": "Restaurant",
    "name": "Shawarma Inn Mathur",
    "image": "https://shawarmainn.in/premium_shawarma_hero.png",
    "servesCuisine": "Lebanese",
    "priceRange": "$$",
    "telephone": "+91 98765 43210",
    "address": {
      "@type": "PostalAddress",
      "addressLocality": "Mathur",
      "addressRegion": "Chennai",
      "addressCountry": "IN"
    },
    "sameAs": [
      "https://instagram.com/shawarmainn.in"
    ]
  };

  return (
    <main>
      <SEO 
        title="Best Shawarma in Mathur | Shawarma Inn Mathur Branch"
        description="Enjoy authentic Lebanese shawarma, wraps, mojitos and more at Shawarma Inn Mathur. Freshly prepared, flame grilled and delivered hot across Mathur, Chennai."
        keywords="chicken shawarma Mathur, flame grilled shawarma Chennai"
        canonicalUrl="/"
        schema={restaurantSchema}
      />
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
