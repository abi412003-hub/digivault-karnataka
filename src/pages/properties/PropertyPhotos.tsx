import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import PageHeader from "@/components/PageHeader";
import BottomTabs from "@/components/BottomTabs";
import { fetchOne } from "@/lib/api";
import { Camera } from "lucide-react";

interface Photo {
  photo: string;
  photo_label?: string;
}

const PropertyPhotos = () => {
  const { id } = useParams<{ id: string }>();
  const [photos, setPhotos] = useState<Photo[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!id) return;
    fetchOne("DigiVault Property", id)
      .then((d) => setPhotos(d?.property_photos ?? []))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [id]);

  return (
    <div className="flex flex-col min-h-screen bg-background pb-20">
      <PageHeader title="Photos" />

      <div className="flex-1 px-4 py-4">
        {loading && <p className="text-center text-muted-foreground text-sm py-8">Loading…</p>}

        {!loading && photos.length === 0 && (
          <div className="flex flex-col items-center justify-center py-16 gap-3">
            <Camera size={40} className="text-muted-foreground" />
            <p className="text-muted-foreground text-sm">No photos uploaded yet</p>
          </div>
        )}

        {!loading && photos.length > 0 && (
          <div className="grid grid-cols-2 gap-4">
            {photos.map((p, i) => (
              <div key={i} className="rounded-lg overflow-hidden bg-muted">
                <img
                  src={p.photo.startsWith("http") ? p.photo : `https://xorgsduvbpaokegawhbd.supabase.co${p.photo}`}
                  alt={`Picture ${i + 1}`}
                  className="w-full aspect-square object-cover"
                />
                <div className="py-1.5 px-2 text-center text-xs font-medium" style={{ backgroundColor: "#D4B896", color: "#fff" }}>
                  {p.photo_label || `Picture ${i + 1}`}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <BottomTabs />
    </div>
  );
};

export default PropertyPhotos;
