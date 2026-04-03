import { useState, useEffect } from "react";
import HeroSection from "@/components/home/HeroSection";
import LocationFilter from "@/components/home/LocationFilter";
import CategoryGrid from "@/components/home/CategoryGrid";
import TrendingSection from "@/components/home/TrendingSection";
import FeedComponent from "@/components/home/FeedComponent";
import { useHomeStore } from "@/stores/homeStore";
import { getBusinesses, type Business } from "@/lib/supabase";
import { toast } from "sonner";

export default function HomePage() {
  const [businesses, setBusinesses] = useState<Business[]>([]);
  const [loading, setLoading] = useState(true);
  const { selectedGovernorate, selectedCity } = useHomeStore();

  useEffect(() => {
    const loadBusinesses = async () => {
      setLoading(true);
      try {
        // Fetch REAL data from Supabase (production table)
        const result = await getBusinesses({
          governorate: selectedGovernorate && selectedGovernorate !== "all" ? selectedGovernorate : undefined,
          city: selectedCity && selectedCity !== "all" ? selectedCity : undefined,
          limit: 100,
        });
        setBusinesses(result.data || []);
      } catch (error) {
        console.error("Failed to load businesses:", error);
        toast.error("Failed to load businesses");
        // Fallback to mock data if Supabase fails
        setBusinesses(generateMockBusinesses());
      } finally {
        setLoading(false);
      }
    };

    loadBusinesses();
  }, [selectedGovernorate, selectedCity]);

  return (
    <div className="min-h-screen bg-[#F7F7F7]">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-white border-b border-gray-200 shadow-sm">
        <div className="max-w-full mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <div className="w-10 h-10 bg-gradient-to-br from-[#FF6B35] to-[#004E89] rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-lg">H</span>
            </div>
            <h1 className="text-xl font-bold text-[#1A1A1A] hidden sm:block">HUMUS</h1>
          </div>

          {/* Search Bar - Minimal */}
          <div className="flex-1 mx-4 max-w-xs hidden md:block">
            <input
              type="text"
              placeholder="Search businesses..."
              className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:border-[#1AC8ED]"
            />
          </div>

          {/* Account Icon */}
          <button className="w-10 h-10 rounded-full bg-gray-200 hover:bg-gray-300 flex items-center justify-center">
            <span className="text-gray-600">👤</span>
          </button>
        </div>
      </header>

      {/* Hero Section with Carousel */}
      <HeroSection businesses={businesses} />

      {/* Location Filter Bar */}
      <LocationFilter />

      {/* Category Chips Grid */}
      <CategoryGrid />

      {/* Trending Section */}
      {businesses.length > 0 && (
        <TrendingSection businesses={businesses.filter(b => b.isFeatured).slice(0, 5)} />
      )}

      {/* Main Feed */}
      <div className="max-w-full">
        <FeedComponent businesses={businesses} loading={loading} />
      </div>

      {/* Footer */}
      <footer className="bg-white border-t border-gray-200 py-6 mt-8">
        <div className="max-w-6xl mx-auto px-4">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 text-sm text-gray-600">
            <div>
              <h3 className="font-semibold text-[#1A1A1A] mb-2">HUMUS</h3>
              <p className="text-xs">Iraq's Business Directory</p>
            </div>
            <div>
              <p className="font-semibold text-[#1A1A1A]">About</p>
            </div>
            <div>
              <p className="font-semibold text-[#1A1A1A]">Contact</p>
            </div>
            <div>
              <p className="font-semibold text-[#1A1A1A]">Privacy</p>
            </div>
          </div>
          <div className="border-t border-gray-200 mt-4 pt-4 text-center text-xs text-gray-500">
            <p>&copy; 2024 HUMUS. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}

// Mock data generator
function generateMockBusinesses(): Business[] {
  return [
    {
      id: "1",
      name: "Abu Ali Restaurant",
      nameAr: "مطعم أبو علي",
      nameKu: "Restoran Abu Ali",
      category: "food_drink",
      governorate: "Baghdad",
      city: "Kadhimiya",
      address: "Baghdad, Kadhimiya",
      phone: "+9647701234567",
      rating: 4.8,
      reviewCount: 120,
      isFeatured: true,
      image: "https://images.unsplash.com/photo-1504674900759-b58551b1efc8?w=400&h=300&fit=crop",
      website: "https://abuali.com",
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
    {
      id: "2",
      name: "Coffee House",
      nameAr: "كافية",
      nameKu: "Kava House",
      category: "food_drink",
      governorate: "Baghdad",
      city: "Adhamiyah",
      address: "Baghdad, Adhamiyah",
      phone: "+9647702234567",
      rating: 4.5,
      reviewCount: 85,
      isFeatured: false,
      image: "https://images.unsplash.com/photo-1495521821757-a1efb6729352?w=400&h=300&fit=crop",
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
    {
      id: "3",
      name: "Clinic Dr. Fatima",
      nameAr: "عيادة د. فاطمة",
      nameKu: "Klinika Dr. Fatima",
      category: "health",
      governorate: "Baghdad",
      city: "Adhamiyah",
      address: "Baghdad, Adhamiyah",
      phone: "+9647703234567",
      rating: 4.9,
      reviewCount: 89,
      isFeatured: true,
      image: "https://images.unsplash.com/photo-1576091160550-112173f31c74?w=400&h=300&fit=crop",
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
    {
      id: "4",
      name: "Fashion Store Erbil",
      nameAr: "متجر الموضة",
      nameKu: "Fashion Store",
      category: "shopping",
      governorate: "Erbil",
      city: "Erbil Center",
      address: "Erbil, City Center",
      phone: "+9647704234567",
      rating: 4.3,
      reviewCount: 45,
      isFeatured: false,
      image: "https://images.unsplash.com/photo-1555529669-e69e7fa0ba9b?w=400&h=300&fit=crop",
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
    {
      id: "5",
      name: "Basra Tech Services",
      nameAr: "خدمات تقنية البصرة",
      nameKu: "Basra Tech Services",
      category: "technology",
      governorate: "Basra",
      city: "Basra City",
      address: "Basra, City Center",
      phone: "+9647705234567",
      rating: 4.6,
      reviewCount: 120,
      isFeatured: true,
      image: "https://images.unsplash.com/photo-1517694712202-14dd9538aa97?w=400&h=300&fit=crop",
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
  ];
}
