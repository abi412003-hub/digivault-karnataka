import { useEffect, useState } from "react";
import { useNavigate, useParams, useSearchParams } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { fetchOne } from "@/lib/api";

const ProjectPropertyReview = () => {
  const navigate = useNavigate();
  const { projectId } = useParams();
  const [searchParams] = useSearchParams();
  const propertyId = searchParams.get("property") || "";
  const projectName = searchParams.get("projectName") || projectId || "";
  const [property, setProperty] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (propertyId) {
      fetchOne("DigiVault Property", propertyId)
        .then((data) => setProperty(data))
        .catch(() => {})
        .finally(() => setLoading(false));
    } else {
      setLoading(false);
    }
  }, [propertyId]);

  return (
    <div className="flex flex-col min-h-screen bg-background">
      {/* Header */}
      <div className="sticky top-0 z-10 flex items-center bg-background border-b border-border px-4 h-14">
        <button onClick={() => navigate(-1)} className="min-h-[44px] min-w-[44px] flex items-center justify-center">
          <ArrowLeft size={22} />
        </button>
      </div>

      <div className="flex-1 px-4 py-6 space-y-5">
        {/* Project info */}
        <div className="text-center">
          <h1 className="text-xl font-bold">{projectName || "Project"}</h1>
          <p className="text-sm text-muted-foreground">{projectId}</p>
        </div>

        {/* Uploaded Property Details pill */}
        <div className="text-center">
          <span className="inline-block px-5 py-2 rounded-full border border-border text-sm text-muted-foreground">
            Uploaded Property Details - 1
          </span>
        </div>

        {loading && <p className="text-center text-muted-foreground">Loading...</p>}

        {property && (
          <div className="space-y-4">
            {/* Property Details heading */}
            <h2 className="text-center text-lg font-bold text-primary">Property Details</h2>

            {/* Detail rows */}
            <div className="space-y-3">
              <div className="flex justify-between">
                <span className="text-sm text-muted-foreground">Property Type</span>
                <span className="text-sm font-medium">{property.property_type || "—"}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-muted-foreground">Title</span>
                <span className="text-sm font-medium">{property.property_title || property.property_name || "—"}</span>
              </div>

              <h3 className="text-sm font-semibold underline">Address</h3>

              <div className="flex justify-between">
                <span className="text-sm text-muted-foreground">State</span>
                <span className="text-sm font-medium">{property.property_state || "Karnataka"}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-muted-foreground">District</span>
                <span className="text-sm font-medium">{property.property_district || "—"}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-muted-foreground">Taluk</span>
                <span className="text-sm font-medium">{property.property_taluk || "—"}</span>
              </div>
            </div>

            {/* Edit link */}
            <div className="text-center">
              <button
                onClick={() => navigate(`/project/${encodeURIComponent(projectId || "")}/property-edit?property=${encodeURIComponent(propertyId)}&name=${encodeURIComponent(projectName)}`)}
                className="text-primary text-sm font-medium"
              >
                Edit
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Bottom buttons */}
      <div className="px-4 pb-6 space-y-3">
        <Button
          className="w-full h-12 bg-primary hover:bg-primary/90 text-white"
          onClick={() => navigate(`/properties/${encodeURIComponent(propertyId)}/select-service?project=${encodeURIComponent(projectId || "")}&projectName=${encodeURIComponent(projectName)}`)}
        >
          Continue for the service selection
        </Button>
        <Button
          className="w-full h-12 bg-purple-700 hover:bg-purple-800 text-white"
          onClick={() => navigate(`/project/${encodeURIComponent(projectId || "")}/property-edit?name=${encodeURIComponent(projectName)}`)}
        >
          Upload Another Property
        </Button>
      </div>
    </div>
  );
};

export default ProjectPropertyReview;
