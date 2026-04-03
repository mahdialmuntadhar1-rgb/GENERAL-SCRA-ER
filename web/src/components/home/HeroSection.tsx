import { useState, useEffect } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import type { Business } from "@/lib/supabase";

interface HeroSectionProps {
  businesses: Business[];
}

const HERO_SLOGANS = [
  {
    en: "Discover Everything Happening in Your City",
    ar: "اكتشف كل شيء يحدث في مدينتك",
    ku: "Hemû tiştên li ser cî yên bajar bibibîn",
    image: "https://images.unsplash.com/photo-1556740738-b6a63e27c4df?w=1200&h=400&fit=crop",
  },
  {
    en: "Find the Best Businesses Near You",
    ar: "ابحث عن أفضل الأعمال بالقرب منك",
    ku: "Karûbarên baş yên li vir bilî we bibîn",
    image: "https://images.unsplash.com/photo-1552664730-d307ca884978?w=1200&h=400&fit=crop",
  },
  {
    en: "Connect, Review & Share Local Businesses",
    ar: "تواصل واستعرض وشارك الأعمال المحلية",
    ku: "Peywendî, nirxandin û rêvebiriya bijareyan parve bikin",
    image: "https://images.unsplash.com/photo-1552664730-d307ca884978?w=1200&h=400&fit=crop",
  },
];

export default function HeroSection({ businesses: _businesses }: HeroSectionProps) {
  const [currentSlide, setCurrentSlide] = useState(0);
  const [autoPlay, setAutoPlay] = useState(true);

  useEffect(() => {
    if (!autoPlay) return;

    const timer = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % HERO_SLOGANS.length);
    }, 5000);

    return () => clearInterval(timer);
  }, [autoPlay]);

  const handlePrev = () => {
    setAutoPlay(false);
    setCurrentSlide((prev) => (prev - 1 + HERO_SLOGANS.length) % HERO_SLOGANS.length);
  };

  const handleNext = () => {
    setAutoPlay(false);
    setCurrentSlide((prev) => (prev + 1) % HERO_SLOGANS.length);
  };

  const goToSlide = (index: number) => {
    setAutoPlay(false);
    setCurrentSlide(index);
  };

  const slogan = HERO_SLOGANS[currentSlide];

  return (
    <div className="relative w-full h-64 md:h-80 lg:h-96 overflow-hidden bg-gradient-to-r from-[#FF6B35] to-[#004E89]">
      {/* Background Image */}
      <div
        className="absolute inset-0 w-full h-full bg-cover bg-center transition-all duration-700"
        style={{
          backgroundImage: `url('${slogan.image}')`,
          opacity: 0.3,
        }}
      />

      {/* Dark Overlay */}
      <div className="absolute inset-0 bg-gradient-to-r from-[#FF6B35]/80 to-[#004E89]/80" />

      {/* Content */}
      <div className="relative h-full flex flex-col items-center justify-center text-white px-4 text-center">
        <h2 className="text-2xl md:text-4xl lg:text-5xl font-bold mb-2 poppins-bold drop-shadow-lg">
          {slogan.en}
        </h2>

        {/* Arabic Text */}
        <p className="text-lg md:text-2xl font-semibold mb-2 drop-shadow-lg" dir="rtl">
          {slogan.ar}
        </p>

        {/* Kurdish Text */}
        <p className="text-base md:text-lg font-semibold drop-shadow-lg">
          {slogan.ku}
        </p>

        {/* CTA Button */}
        <button className="mt-6 px-6 py-3 bg-[#1AC8ED] hover:bg-[#00a8c9] text-[#004E89] font-bold rounded-lg transition-all duration-300 transform hover:scale-105">
          Explore Now
        </button>
      </div>

      {/* Navigation Arrows */}
      <button
        onClick={handlePrev}
        className="absolute left-4 top-1/2 -translate-y-1/2 z-10 bg-white/30 hover:bg-white/50 text-white p-2 rounded-full transition-all duration-300"
        aria-label="Previous slide"
      >
        <ChevronLeft size={24} />
      </button>

      <button
        onClick={handleNext}
        className="absolute right-4 top-1/2 -translate-y-1/2 z-10 bg-white/30 hover:bg-white/50 text-white p-2 rounded-full transition-all duration-300"
        aria-label="Next slide"
      >
        <ChevronRight size={24} />
      </button>

      {/* Dots Navigation */}
      <div className="absolute bottom-4 left-1/2 -translate-x-1/2 z-10 flex gap-2">
        {HERO_SLOGANS.map((_, index) => (
          <button
            key={index}
            onClick={() => goToSlide(index)}
            className={`h-2 rounded-full transition-all duration-300 ${
              index === currentSlide
                ? "bg-white w-8"
                : "bg-white/50 w-2 hover:bg-white/75"
            }`}
            aria-label={`Go to slide ${index + 1}`}
          />
        ))}
      </div>

      {/* Slide Counter */}
      <div className="absolute top-4 right-4 bg-white/20 text-white px-3 py-1 rounded-full text-sm font-semibold">
        {currentSlide + 1} / {HERO_SLOGANS.length}
      </div>
    </div>
  );
}
