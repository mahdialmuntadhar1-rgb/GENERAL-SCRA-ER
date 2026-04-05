import { useHomeStore } from "@/stores/homeStore";

const CATEGORIES = [
  { id: "dining_cuisine", name: "Dining & Cuisine", icon: "🍽️", color: "#FF6B35" },
  { id: "cafe_coffee", name: "Cafe & Coffee", icon: "☕", color: "#FF6B35" },
  { id: "shopping_retail", name: "Shopping & Retail", icon: "🛍️", color: "#004E89" },
  { id: "entertainment_events", name: "Entertainment & Events", icon: "🎬", color: "#1AC8ED" },
  { id: "accommodation_stays", name: "Accommodation & Stays", icon: "🏨", color: "#FF6B35" },
  { id: "culture_heritage", name: "Culture & Heritage", icon: "🏛️", color: "#004E89" },
  { id: "business_services", name: "Business & Services", icon: "💼", color: "#1AC8ED" },
  { id: "health_wellness", name: "Health & Wellness", icon: "⚕️", color: "#FF6B35" },
  { id: "doctors", name: "Doctors", icon: "👨‍⚕️", color: "#004E89" },
  { id: "hospitals", name: "Hospitals", icon: "🏥", color: "#1AC8ED" },
  { id: "clinics", name: "Clinics", icon: "🏥", color: "#FF6B35" },
  { id: "transport_mobility", name: "Transport & Mobility", icon: "🚗", color: "#004E89" },
  { id: "public_essential", name: "Public & Essential", icon: "🏛️", color: "#1AC8ED" },
  { id: "lawyers", name: "Lawyers", icon: "⚖️", color: "#FF6B35" },
  { id: "education", name: "Education", icon: "🎓", color: "#004E89" },
];

export default function CategoryGrid() {
  const { selectedCategory, setCategory } = useHomeStore();

  return (
    <div className="bg-white border-b border-gray-200 py-6">
      <div className="max-w-6xl mx-auto px-4">
        {/* Label */}
        <p className="text-sm font-semibold text-[#1A1A1A] mb-4">Browse Categories</p>

        {/* Category Grid - 5 columns on mobile, 8 on tablet, auto-wrap on desktop */}
        <div className="grid gap-3" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(80px, 1fr))' }}>
          {CATEGORIES.map((category) => (
            <button
              key={category.id}
              onClick={() => setCategory(selectedCategory === category.id ? null : category.id)}
              className={`flex flex-col items-center justify-center p-3 rounded-lg transition-all duration-200 transform hover:scale-105 ${
                selectedCategory === category.id
                  ? "bg-[#FF6B35]/20 border-2 border-[#FF6B35] scale-105"
                  : "bg-[#F7F7F7] border-2 border-transparent hover:border-[#1AC8ED]"
              }`}
              title={category.name}
            >
              <div className="text-2xl mb-1">{category.icon}</div>
              <span className="text-xs font-semibold text-[#1A1A1A] text-center line-clamp-2">
                {category.name}
              </span>
            </button>
          ))}
        </div>

        {/* Info text */}
        <p className="text-xs text-gray-500 mt-4 text-center">
          {CATEGORIES.length} categories available
        </p>
      </div>
    </div>
  );
}
