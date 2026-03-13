import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import PageHeader from "@/components/PageHeader";
import BottomTabs from "@/components/BottomTabs";
import { fetchOne } from "@/lib/api";
import { MapPin } from "lucide-react";

const PropertyLocation = () => {
  const { id } = useParams<{ id: string }>();
  const [lat, setLat] = useState("");
  const [lng, setLng] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!id) return;
    fetchOne("DigiVault Property", id)
      .then((d) => {
        setLat(d?.property_latitude || "");
        setLng(d?.property_longitude || "");
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [id]);

  const hasCoords = lat && lng;

  return (
    <div className="flex flex-col min-h-screen bg-background pb-20">
      <PageHeader title="Location" />
      <div className="flex-1">
        {loading ? (
          <div className="flex items-center justify-center h-full">
            <p className="text-muted-foreground text-sm">Loading…</p>
          </div>
        ) : hasCoords ? (
          <iframe
            title="Property Location"
            src={`https://maps.google.com/maps?q=${lat},${lng}&z=15&output=embed`}
            className="w-full h-full border-0"
            allowFullScreen
            loading="lazy"
          />
        ) : (
          <div className="flex flex-col items-center justify-center h-full gap-3">
            <MapPin size={40} className="text-muted-foreground" />
            <p className="text-muted-foreground text-sm">No location data available</p>
          </div>
        )}
      </div>
      <BottomTabs />
    </div>
  );
};

export default PropertyLocation;
