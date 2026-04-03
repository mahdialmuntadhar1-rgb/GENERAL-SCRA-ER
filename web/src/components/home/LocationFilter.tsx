import { useState } from "react";
import { ChevronDown } from "lucide-react";
import { useHomeStore } from "@/stores/homeStore";

const GOVERNORATES = [
  { name: "Baghdad", nameAr: "بغداد", nameKu: "Bexdayê" },
  { name: "Erbil", nameAr: "أربيل", nameKu: "Hewlêr" },
  { name: "Dohuk", nameAr: "دهوك", nameKu: "Duhok" },
  { name: "Sulaymaniyah", nameAr: "السليمانية", nameKu: "Silêmanî" },
  { name: "Basra", nameAr: "البصرة", nameKu: "Besre" },
  { name: "Mosul", nameAr: "الموصل", nameKu: "Mûsil" },
  { name: "Tikrit", nameAr: "تكريت", nameKu: "Tekrît" },
  { name: "Najaf", nameAr: "النجف", nameKu: "Necef" },
  { name: "Karbala", nameAr: "كربلاء", nameKu: "Kerbela" },
  { name: "Hilla", nameAr: "الحلة", nameKu: "Hille" },
];

const CITIES_BY_GOVERNORATE: Record<string, string[]> = {
  Baghdad: ["Central", "Kadhimiya", "Adhamiyah", "Sadr City", "Rusafa"],
  Erbil: ["Erbil Center", "Ankawa", "Ainkawa", "Pirmam"],
  Dohuk: ["Dohuk Center", "Zakho", "Amedi"],
  Sulaymaniyah: ["Sulaymaniyah Center", "Chamchamal", "Halabja"],
  Basra: ["Basra City", "Um Qasr", "Fao"],
  Mosul: ["Mosul Center", "West Mosul", "East Mosul"],
  Tikrit: ["Tikrit Center", "Samarra"],
  Najaf: ["Najaf Center", "Kufa"],
  Karbala: ["Karbala Center", "Abu Ghurab"],
  Hilla: ["Hilla Center", "Kifl"],
};

export default function LocationFilter() {
  const { selectedGovernorate, selectedCity, setGovernorate, setCity } = useHomeStore();
  const [governorateOpen, setGovernorateOpen] = useState(false);
  const [cityOpen, setCityOpen] = useState(false);

  const governorateObj = GOVERNORATES.find((g) => g.name === selectedGovernorate);
  const cities = CITIES_BY_GOVERNORATE[selectedGovernorate] || [];

  return (
    <div className="sticky top-16 z-40 bg-white border-b border-gray-200 shadow-sm">
      <div className="max-w-6xl mx-auto px-4 py-4">
        {/* Label */}
        <p className="text-sm font-semibold text-[#1A1A1A] mb-3">
          Select Your Location
        </p>

        <div className="flex flex-col sm:flex-row gap-3">
          {/* Governorate Dropdown */}
          <div className="relative flex-1">
            <button
              onClick={() => {
                setGovernorateOpen(!governorateOpen);
                setCityOpen(false);
              }}
              className="w-full px-4 py-3 bg-[#F7F7F7] border-2 border-[#004E89] rounded-lg flex items-center justify-between hover:bg-gray-100 transition-colors duration-200"
            >
              <span className="font-semibold text-[#1A1A1A]">
                {governorateObj?.name || "Select Governorate"}
              </span>
              <ChevronDown
                size={20}
                className={`text-[#004E89] transition-transform duration-200 ${
                  governorateOpen ? "rotate-180" : ""
                }`}
              />
            </button>

            {/* Governorate Dropdown Menu */}
            {governorateOpen && (
              <div className="absolute top-full left-0 right-0 mt-2 bg-white border-2 border-[#004E89] rounded-lg shadow-lg z-50 max-h-60 overflow-y-auto">
                {GOVERNORATES.map((gov) => (
                  <button
                    key={gov.name}
                    onClick={() => {
                      setGovernorate(gov.name);
                      setCity(CITIES_BY_GOVERNORATE[gov.name]?.[0] || "");
                      setGovernorateOpen(false);
                    }}
                    className={`w-full px-4 py-3 text-left hover:bg-[#FF6B35]/20 transition-colors duration-150 border-b border-gray-100 last:border-b-0 ${
                      selectedGovernorate === gov.name
                        ? "bg-[#FF6B35]/30 font-semibold text-[#004E89]"
                        : "text-[#1A1A1A]"
                    }`}
                  >
                    <span className="block font-semibold">{gov.name}</span>
                    <span className="text-xs text-gray-500">{gov.nameAr}</span>
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* City Dropdown */}
          <div className="relative flex-1">
            <button
              onClick={() => {
                setCityOpen(!cityOpen);
                setGovernorateOpen(false);
              }}
              className="w-full px-4 py-3 bg-[#F7F7F7] border-2 border-[#1AC8ED] rounded-lg flex items-center justify-between hover:bg-gray-100 transition-colors duration-200"
            >
              <span className="font-semibold text-[#1A1A1A]">
                {selectedCity || "Select City"}
              </span>
              <ChevronDown
                size={20}
                className={`text-[#1AC8ED] transition-transform duration-200 ${
                  cityOpen ? "rotate-180" : ""
                }`}
              />
            </button>

            {/* City Dropdown Menu */}
            {cityOpen && (
              <div className="absolute top-full left-0 right-0 mt-2 bg-white border-2 border-[#1AC8ED] rounded-lg shadow-lg z-50 max-h-60 overflow-y-auto">
                {cities.length > 0 ? (
                  cities.map((city) => (
                    <button
                      key={city}
                      onClick={() => {
                        setCity(city);
                        setCityOpen(false);
                      }}
                      className={`w-full px-4 py-3 text-left hover:bg-[#1AC8ED]/20 transition-colors duration-150 border-b border-gray-100 last:border-b-0 font-semibold ${
                        selectedCity === city
                          ? "bg-[#1AC8ED]/30 text-[#004E89]"
                          : "text-[#1A1A1A]"
                      }`}
                    >
                      {city}
                    </button>
                  ))
                ) : (
                  <div className="px-4 py-3 text-gray-500 text-center">
                    No cities available
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Reset Button */}
          <button className="px-6 py-3 bg-[#FF6B35] hover:bg-[#e55a24] text-white font-semibold rounded-lg transition-colors duration-200">
            Search
          </button>
        </div>

        {/* Info Text */}
        {selectedGovernorate && selectedCity && (
          <p className="text-sm text-gray-600 mt-3">
            Showing results in <span className="font-semibold text-[#004E89]">{selectedCity}, {selectedGovernorate}</span>
          </p>
        )}
      </div>
    </div>
  );
}
