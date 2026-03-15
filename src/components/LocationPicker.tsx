import { useEffect, useRef, useState, useCallback } from "react";
import { ArrowLeft, MapPin, Crosshair, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

interface LocationPickerProps {
  isOpen: boolean;
  onClose: () => void;
  onSelect: (lat: number, lng: number, address?: string) => void;
  initialLat?: number;
  initialLng?: number;
}

const BENGALURU_LAT = 12.9716;
const BENGALURU_LNG = 77.5946;

const LocationPicker = ({
  isOpen,
  onClose,
  onSelect,
  initialLat,
  initialLng,
}: LocationPickerProps) => {
  const mapRef = useRef<L.Map | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const { toast } = useToast();

  const [center, setCenter] = useState({ lat: initialLat || BENGALURU_LAT, lng: initialLng || BENGALURU_LNG });
  const [address, setAddress] = useState("");
  const [locating, setLocating] = useState(false);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Reverse geocode via Nominatim
  const reverseGeocode = useCallback((lat: number, lng: number) => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(async () => {
      try {
        const res = await fetch(
          `https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lng}&format=json`
        );
        const data = await res.json();
        if (data?.display_name) setAddress(data.display_name);
        else setAddress("");
      } catch {
        setAddress("");
      }
    }, 500);
  }, []);

  // Init map
  useEffect(() => {
    if (!isOpen || !containerRef.current) return;

    // Small delay to let the DOM render
    const timer = setTimeout(() => {
      if (mapRef.current) {
        mapRef.current.remove();
        mapRef.current = null;
      }

      const startLat = initialLat || BENGALURU_LAT;
      const startLng = initialLng || BENGALURU_LNG;

      const map = L.map(containerRef.current!, {
        center: [startLat, startLng],
        zoom: 13,
        zoomControl: true,
      });

      L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
        attribution: "© OpenStreetMap contributors",
      }).addTo(map);

      setCenter({ lat: startLat, lng: startLng });
      reverseGeocode(startLat, startLng);

      map.on("moveend", () => {
        const c = map.getCenter();
        setCenter({ lat: c.lat, lng: c.lng });
        reverseGeocode(c.lat, c.lng);
      });

      mapRef.current = map;

      // Try GPS on first open if no initial coords
      if (!initialLat && !initialLng) {
        navigator.geolocation?.getCurrentPosition(
          (pos) => {
            map.flyTo([pos.coords.latitude, pos.coords.longitude], 15);
          },
          () => {
            // silent — user denied or unavailable
          }
        );
      }
    }, 100);

    return () => {
      clearTimeout(timer);
      if (debounceRef.current) clearTimeout(debounceRef.current);
      if (mapRef.current) {
        mapRef.current.remove();
        mapRef.current = null;
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen]);

  const handleUseMyLocation = () => {
    if (!navigator.geolocation) {
      toast({ title: "Geolocation not supported by your browser", variant: "destructive" });
      return;
    }
    setLocating(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        mapRef.current?.flyTo([pos.coords.latitude, pos.coords.longitude], 16);
        setLocating(false);
      },
      () => {
        toast({ title: "Location access denied. You can manually pan the map.", variant: "destructive" });
        setLocating(false);
      }
    );
  };

  const handleConfirm = () => {
    onSelect(center.lat, center.lng, address || undefined);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-background flex flex-col animate-fade-in">
      {/* Top bar */}
      <div className="flex items-center bg-background border-b border-border px-4 h-14 shrink-0">
        <button
          onClick={onClose}
          className="min-h-[44px] min-w-[44px] flex items-center justify-center"
        >
          <ArrowLeft size={22} className="text-foreground" />
        </button>
        <h1 className="flex-1 text-center text-lg font-bold text-foreground">Select Location</h1>
        <Button size="sm" onClick={handleConfirm} className="text-sm">
          Confirm
        </Button>
      </div>

      {/* Map container */}
      <div className="flex-1 relative">
        <div ref={containerRef} className="w-full h-full" />

        {/* Center crosshair pin */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-full z-[1000] pointer-events-none flex flex-col items-center">
          <MapPin size={36} className="text-destructive drop-shadow-lg" fill="hsl(var(--destructive))" strokeWidth={1.5} />
          {/* Pulsing dot */}
          <span className="w-3 h-3 rounded-full bg-destructive/40 animate-[pulse_2s_cubic-bezier(0.4,0,0.6,1)_infinite] -mt-1" />
        </div>
      </div>

      {/* Bottom info card */}
      <div className="bg-background border-t border-border rounded-t-2xl px-5 pt-4 pb-6 space-y-3 shrink-0">
        <div className="text-center">
          <p className="text-sm font-bold text-foreground">
            {center.lat.toFixed(6)}°N, {center.lng.toFixed(6)}°E
          </p>
          {address && (
            <p className="text-xs text-muted-foreground mt-1 line-clamp-2">{address}</p>
          )}
        </div>

        <Button
          variant="outline"
          className="w-full gap-2"
          onClick={handleUseMyLocation}
          disabled={locating}
        >
          {locating ? <Loader2 size={16} className="animate-spin" /> : <Crosshair size={16} />}
          Use My Location
        </Button>
      </div>
    </div>
  );
};

export default LocationPicker;
