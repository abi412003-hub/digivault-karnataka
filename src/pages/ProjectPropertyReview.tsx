import { useEffect, useState } from "react";
import { useNavigate, useParams, useSearchParams } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/AuthContext";
import { fetchOne, fetchList } from "@/lib/api";

const Row = ({ label, value }: { label: string; value: string }) => (
  <div className="flex justify-between py-1">
    <span className="text-sm text-muted-foreground">{label}</span>
    <span className="text-sm font-medium text-right max-w-[55%]">{value || "—"}</span>
  </div>
);

const ProjectPropertyReview = () => {
  const navigate = useNavigate();
  const { projectId } = useParams();
  const [searchParams] = useSearchParams();
  const propertyIdParam = searchParams.get("property") || "";
  const projectNameParam = searchParams.get("projectName") || "";
  const { auth } = useAuth();

  const [property, setProperty] = useState<any>(null);
  const [project, setProject] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      try {
        // Fetch project details
        if (projectId) {
          const projData = await fetchOne("DigiVault Project", projectId);
          if (projData) setProject(projData);
        }

        // Fetch property — either from query param or find linked to this project
        if (propertyIdParam) {
          const propData = await fetchOne("DigiVault Property", propertyIdParam);
          if (propData) setProperty(propData);
        } else if (auth.client_id) {
          // Find latest property for this client
          const props = await fetchList(
            "DigiVault Property",
            ["name", "property_name", "property_type", "property_title", "property_state", "property_district", "property_taluk", "property_pincode", "property_address", "property_size", "property_latitude", "property_longitude"],
            [["client", "=", auth.client_id]],
            1,
            "creation desc"
          );
          if (props?.length) setProperty(props[0]);
        }
      } catch {
        // keep empty
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [projectId, propertyIdParam, auth.client_id]);

  const displayProjectName = projectNameParam || project?.project_name || projectId || "Project";
  const propertyId = propertyIdParam || property?.name || "";

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
          <h1 className="text-xl font-bold">{displayProjectName}</h1>
          <p className="text-sm text-muted-foreground">{projectId}</p>
        </div>

        {/* Uploaded Property Details pill */}
        <div className="text-center">
          <span className="inline-block px-5 py-2 rounded-full border border-border text-sm text-muted-foreground">
            Uploaded Property Details - {property ? 1 : 0}
          </span>
        </div>

        {loading && <p className="text-center text-muted-foreground py-8">Loading property details...</p>}

        {!loading && !property && (
          <div className="text-center py-8 space-y-3">
            <p className="text-muted-foreground">No property added yet</p>
            <Button
              onClick={() => navigate(`/project/${encodeURIComponent(projectId || "")}/property-edit?name=${encodeURIComponent(displayProjectName)}`)}
            >
              Add Property
            </Button>
          </div>
        )}

        {property && (
          <div className="space-y-4">
            {/* Property Details heading */}
            <h2 className="text-center text-lg font-bold text-primary">Property Details</h2>

            {/* Detail rows */}
            <div className="space-y-1 border border-border rounded-xl p-4">
              <Row label="Property Type" value={property.property_type} />
              <Row label="Title" value={property.property_title || property.property_name} />

              {property.property_size && (
                <Row label="Size" value={property.property_size} />
              )}

              <div className="h-px bg-border my-2" />
              <h3 className="text-sm font-semibold underline pb-1">Address</h3>

              <Row label="State" value={property.property_state || "Karnataka"} />
              <Row label="District" value={property.property_district} />
              <Row label="Taluk" value={property.property_taluk} />

              {property.property_pincode && (
                <Row label="Pincode" value={property.property_pincode} />
              )}

              {property.property_address && (
                <div className="pt-2">
                  <span className="text-xs text-muted-foreground">Full address</span>
                  <p className="text-sm mt-1">{property.property_address}</p>
                </div>
              )}

              {(property.property_latitude || property.property_longitude) && (
                <Row label="Coordinates" value={`${property.property_latitude || ""}, ${property.property_longitude || ""}`} />
              )}
            </div>

            {/* Edit link */}
            <div className="text-center">
              <button
                onClick={() => navigate(`/project/${encodeURIComponent(projectId || "")}/property-edit?property=${encodeURIComponent(propertyId)}&name=${encodeURIComponent(displayProjectName)}`)}
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
          disabled={!propertyId}
          onClick={() => navigate(`/properties/${encodeURIComponent(propertyId)}/select-service?project=${encodeURIComponent(projectId || "")}&projectName=${encodeURIComponent(displayProjectName)}`)}
        >
          Continue for the service selection
        </Button>
        <Button
          className="w-full h-12 bg-purple-700 hover:bg-purple-800 text-white"
          onClick={() => navigate(`/project/${encodeURIComponent(projectId || "")}/property-edit?name=${encodeURIComponent(displayProjectName)}`)}
        >
          Upload Another Property
        </Button>
      </div>
    </div>
  );
};

export default ProjectPropertyReview;
