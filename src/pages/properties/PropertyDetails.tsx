import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import PageHeader from "@/components/PageHeader";
import BottomTabs from "@/components/BottomTabs";
import { Button } from "@/components/ui/button";
import { fetchOne } from "@/lib/api";

interface PropertyData {
  property_name: string;
  property_type: string;
  property_title: string;
  property_district: string;
  property_taluk: string;
  property_rtc: string;
  property_size: string;
  property_pincode: string;
  property_latitude: string;
  property_longitude: string;
}

const Row = ({ label, value }: { label: string; value: string }) => (
  <div className="flex justify-between py-2 border-b border-border last:border-0">
    <span className="text-sm text-muted-foreground">{label}</span>
    <span className="text-sm font-medium text-foreground text-right">{value || "—"}</span>
  </div>
);

const PropertyDetails = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [data, setData] = useState<PropertyData | null>(null);
  const [loading, setLoading] = useState(true);
  const [showMore, setShowMore] = useState(false);

  useEffect(() => {
    if (!id) return;
    fetchOne("DigiVault Property", id)
      .then((d) => setData(d))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [id]);

  if (loading) {
    return (
      <div className="flex flex-col min-h-screen bg-background pb-20">
        <PageHeader title="Details" />
        <p className="text-center text-muted-foreground text-sm py-12">Loading…</p>
        <BottomTabs />
      </div>
    );
  }

  return (
    <div className="flex flex-col min-h-screen bg-background pb-20">
      <PageHeader title={data?.property_name || "Details"} />

      <div className="flex-1 px-4 py-6 space-y-5">
        <h2 className="text-base font-bold text-foreground text-center">Property Details</h2>

        <div className="rounded-xl bg-muted p-4 space-y-3">
          <span className="inline-block bg-background rounded-full px-3 py-1 text-xs text-muted-foreground">
            Uploaded Property Details - 1
          </span>

          <Row label="Property Type" value={data?.property_type || ""} />
          <Row label="Title" value={data?.property_title || ""} />

          <p className="text-sm font-bold text-foreground underline pt-2">Address</p>
          <Row label="State" value="Karnataka" />
          <Row label="District" value={data?.property_district || ""} />
          <Row label="Taluk" value={data?.property_taluk || ""} />

          {!showMore && (
            <button onClick={() => setShowMore(true)} className="text-sm text-primary font-medium pt-1">
              View More
            </button>
          )}

          {showMore && (
            <>
              <Row label="RTC" value={data?.property_rtc || ""} />
              <Row label="Size" value={data?.property_size || ""} />
              <Row label="Pincode" value={data?.property_pincode || ""} />
              <Row label="Latitude" value={data?.property_latitude || ""} />
              <Row label="Longitude" value={data?.property_longitude || ""} />
              <Row
                label="Coordinates"
                value={data?.property_latitude && data?.property_longitude ? `${data.property_latitude}, ${data.property_longitude}` : ""}
              />
              <button onClick={() => setShowMore(false)} className="text-sm text-primary font-medium pt-1">
                View Less
              </button>
            </>
          )}
        </div>

        <div className="flex justify-center">
          <Button size="sm" className="w-[120px]">Edit</Button>
        </div>

        <Button className="w-full h-12" onClick={() => navigate(`/properties/${encodeURIComponent(id!)}/select-service`)}>
          Continue for the service selection
        </Button>
      </div>

      <BottomTabs />
    </div>
  );
};

export default PropertyDetails;
