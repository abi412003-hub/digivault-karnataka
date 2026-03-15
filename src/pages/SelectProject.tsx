import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { CheckCircle, Hourglass, Clock, Eye, FileText, FolderOpen, MapPin, Plus, Wrench, ChevronDown, ChevronUp, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import PageHeader from "@/components/PageHeader";
import BottomTabs from "@/components/BottomTabs";
import { useAuth } from "@/contexts/AuthContext";
import { fetchList, deleteRecord } from "@/lib/api";
import { useToast } from "@/hooks/use-toast";

interface ProjectData {
  name: string;
  project_name: string;
  project_status: string;
}

interface PropertyData {
  name: string;
  property_name: string;
  property_type: string;
  property_district: string;
  property_taluk: string;
}

interface SRData {
  name: string;
  project: string;
  property: string;
  main_service: string;
  sub_service: string;
  request_status: string;
}

const SelectProject = () => {
  const navigate = useNavigate();
  const { auth } = useAuth();
  const [projects, setProjects] = useState<ProjectData[]>([]);
  const [propertiesByProject, setPropertiesByProject] = useState<Record<string, PropertyData[]>>({});
  const [srsByProperty, setSrsByProperty] = useState<Record<string, SRData[]>>({});
  const [expandedProject, setExpandedProject] = useState<string | null>(null);
  const [expandedProperty, setExpandedProperty] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [deleteConfirm, setDeleteConfirm] = useState<{ name: string; projectName: string } | null>(null);
  const [deleting, setDeleting] = useState(false);
  const { toast } = useToast();

  const handleDeleteProject = async (projName: string) => {
    setDeleting(true);
    try {
      // Delete all service requests under this project
      const srs = srsByProperty;
      const projectProps = propertiesByProject[projName] || [];
      for (const prop of projectProps) {
        const propSRs = srs[prop.name] || [];
        for (const sr of propSRs) {
          await deleteRecord("DigiVault Service Request", sr.name).catch(() => {});
        }
        // Delete the property
        await deleteRecord("DigiVault Property", prop.name).catch(() => {});
      }
      // Also delete any SRs directly linked to this project but no property
      const allSRs = await fetchList(
        "DigiVault Service Request",
        ["name"],
        [["project", "=", projName]]
      );
      for (const sr of allSRs || []) {
        await deleteRecord("DigiVault Service Request", sr.name).catch(() => {});
      }
      // Delete the project itself
      await deleteRecord("DigiVault Project", projName);
      
      // Remove from local state
      setProjects((prev) => prev.filter((p) => p.name !== projName));
      setPropertiesByProject((prev) => { const n = { ...prev }; delete n[projName]; return n; });
      setDeleteConfirm(null);
      toast({ title: "Project deleted successfully" });
    } catch {
      toast({ title: "Failed to delete project", variant: "destructive" });
    } finally {
      setDeleting(false);
    }
  };

  useEffect(() => {
    if (!auth.client_id) return;
    const load = async () => {
      try {
        // Fetch projects
        const projs = await fetchList(
          "DigiVault Project",
          ["name", "project_name", "project_status"],
          [["client", "=", auth.client_id]]
        );
        setProjects(projs || []);

        // Fetch ALL properties for this client
        const props = await fetchList(
          "DigiVault Property",
          ["name", "property_name", "property_type", "property_district", "property_taluk", "project"],
          [["client", "=", auth.client_id]]
        );
        // Group by project
        const propMap: Record<string, PropertyData[]> = {};
        for (const p of props || []) {
          const proj = (p as any).project || "unassigned";
          if (!propMap[proj]) propMap[proj] = [];
          propMap[proj].push(p);
        }
        setPropertiesByProject(propMap);

        // Fetch ALL service requests for this client
        const srs = await fetchList(
          "DigiVault Service Request",
          ["name", "project", "property", "main_service", "sub_service", "request_status"],
          [["client", "=", auth.client_id]]
        );
        // Group by property
        const srMap: Record<string, SRData[]> = {};
        for (const sr of srs || []) {
          const prop = sr.property || "unassigned";
          if (!srMap[prop]) srMap[prop] = [];
          srMap[prop].push(sr);
        }
        setSrsByProperty(srMap);

        // Auto-expand first project
        if (projs?.length) setExpandedProject(projs[0].name);
      } catch {}
      setLoading(false);
    };
    load();
  }, [auth.client_id]);

  const statusColor = (status: string) => {
    if (status === "Completed" || status === "Closed") return "text-green-600 bg-green-50";
    if (status === "In Progress") return "text-blue-600 bg-blue-50";
    return "text-amber-600 bg-amber-50";
  };

  return (
    <div className="flex flex-col min-h-screen bg-background pb-20">
      <PageHeader title="My Projects" />

      <div className="px-4 py-4 space-y-4">
        {/* Add Project button */}
        <div className="flex justify-end">
          <Button
            onClick={() => navigate("/create-project")}
            className="bg-primary hover:bg-primary/90 text-white rounded-lg px-4 h-9 text-sm font-bold gap-1"
          >
            <Plus size={16} /> New Project
          </Button>
        </div>

        {loading && <p className="text-center text-muted-foreground py-8">Loading projects...</p>}

        {!loading && projects.length === 0 && (
          <div className="text-center py-12 space-y-4">
            <FolderOpen size={48} className="mx-auto text-muted-foreground" />
            <p className="text-muted-foreground">No projects yet</p>
            <Button onClick={() => navigate("/create-project")} className="bg-primary text-white">
              Create your first project
            </Button>
          </div>
        )}

        {/* Project → Property → Orders hierarchy */}
        {projects.map((proj) => {
          const isExpanded = expandedProject === proj.name;
          const properties = propertiesByProject[proj.name] || [];
          const allSRs = properties.flatMap((p) => srsByProperty[p.name] || []);
          const completed = allSRs.filter((sr) => sr.request_status === "Completed").length;
          const ongoing = allSRs.filter((sr) => sr.request_status === "In Progress").length;
          const pending = allSRs.length - completed - ongoing;

          return (
            <div key={proj.name} className="border border-border rounded-2xl overflow-hidden bg-background">
              {/* Project header — tap to expand/collapse */}
              <div className="w-full px-4 py-3 flex items-center gap-3">
                <button
                  onClick={() => setExpandedProject(isExpanded ? null : proj.name)}
                  className="flex items-center gap-3 flex-1 min-w-0 text-left"
                >
                  <FolderOpen size={20} className="text-primary flex-shrink-0" />
                  <div className="flex-1 min-w-0">
                    <h2 className="text-base font-bold text-foreground truncate">{proj.project_name}</h2>
                    <p className="text-xs text-muted-foreground">{proj.name} • {properties.length} properties • {allSRs.length} orders</p>
                  </div>
                  {isExpanded ? <ChevronUp size={18} className="text-muted-foreground" /> : <ChevronDown size={18} className="text-muted-foreground" />}
                </button>
                {/* Delete project button */}
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setDeleteConfirm({ name: proj.name, projectName: proj.project_name });
                  }}
                  className="w-9 h-9 rounded-full border border-red-200 flex items-center justify-center flex-shrink-0 hover:bg-red-50 transition-colors"
                  title="Delete project"
                >
                  <Trash2 size={15} className="text-destructive" />
                </button>
              </div>

              {/* Status counts */}
              <div className="px-4 pb-2 flex gap-2">
                <span className="text-[11px] px-2 py-0.5 rounded-full bg-green-50 text-green-600 font-semibold">{completed} done</span>
                <span className="text-[11px] px-2 py-0.5 rounded-full bg-blue-50 text-blue-600 font-semibold">{ongoing} ongoing</span>
                <span className="text-[11px] px-2 py-0.5 rounded-full bg-amber-50 text-amber-600 font-semibold">{pending} pending</span>
              </div>

              {/* Expanded: show properties */}
              {isExpanded && (
                <div className="border-t border-border">
                  {properties.length === 0 ? (
                    <div className="px-4 py-6 text-center">
                      <p className="text-sm text-muted-foreground mb-3">No properties added yet</p>
                      <Button
                        size="sm"
                        onClick={() => navigate(`/properties/add?project=${encodeURIComponent(proj.name)}`)}
                        className="bg-primary text-white gap-1"
                      >
                        <Plus size={14} /> Add Property
                      </Button>
                    </div>
                  ) : (
                    <div className="divide-y divide-border">
                      {properties.map((prop) => {
                        const propSRs = srsByProperty[prop.name] || [];
                        const isPropExpanded = expandedProperty === prop.name;

                        return (
                          <div key={prop.name}>
                            {/* Property row */}
                            <button
                              onClick={() => setExpandedProperty(isPropExpanded ? null : prop.name)}
                              className="w-full px-4 py-3 flex items-center gap-3 text-left bg-muted/30"
                            >
                              <MapPin size={16} className="text-destructive flex-shrink-0" />
                              <div className="flex-1 min-w-0">
                                <p className="text-sm font-semibold text-foreground truncate">{prop.property_name}</p>
                                <p className="text-xs text-muted-foreground">{prop.property_type} • {prop.property_district}, {prop.property_taluk} • {propSRs.length} orders</p>
                              </div>
                              {isPropExpanded ? <ChevronUp size={16} className="text-muted-foreground" /> : <ChevronDown size={16} className="text-muted-foreground" />}
                            </button>

                            {/* Property expanded: show orders + add service button */}
                            {isPropExpanded && (
                              <div className="bg-muted/10 px-4 py-2 space-y-2">
                                {propSRs.length === 0 ? (
                                  <p className="text-xs text-muted-foreground py-2 text-center">No services ordered yet</p>
                                ) : (
                                  propSRs.map((sr) => (
                                    <button
                                      key={sr.name}
                                      onClick={() => navigate(`/service-request/${encodeURIComponent(sr.name)}/detail`)}
                                      className="w-full flex items-center gap-2 px-3 py-2 rounded-lg border border-border bg-background text-left"
                                    >
                                      <FileText size={14} className="text-primary flex-shrink-0" />
                                      <div className="flex-1 min-w-0">
                                        <p className="text-xs font-semibold text-foreground truncate">{sr.main_service}</p>
                                        {sr.sub_service && <p className="text-[11px] text-muted-foreground truncate">{sr.sub_service}</p>}
                                      </div>
                                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${statusColor(sr.request_status)}`}>
                                        {sr.request_status}
                                      </span>
                                    </button>
                                  ))
                                )}

                                {/* Add new service to this property */}
                                <Button
                                  variant="outline"
                                  size="sm"
                                  className="w-full h-9 text-xs gap-1 border-primary text-primary"
                                  onClick={() => navigate(`/properties/${encodeURIComponent(prop.name)}/select-service?project=${encodeURIComponent(proj.name)}`)}
                                >
                                  <Wrench size={14} /> Add New Service
                                </Button>
                              </div>
                            )}
                          </div>
                        );
                      })}

                      {/* Add another property to this project */}
                      <div className="px-4 py-3">
                        <Button
                          variant="outline"
                          size="sm"
                          className="w-full h-9 text-xs gap-1"
                          onClick={() => navigate(`/properties/add?project=${encodeURIComponent(proj.name)}`)}
                        >
                          <Plus size={14} /> Add Another Property
                        </Button>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>

      <BottomTabs />

      {/* Delete Confirmation Dialog */}
      {deleteConfirm && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-6">
          <div className="bg-background rounded-2xl max-w-sm w-full p-5 space-y-4" onClick={(e) => e.stopPropagation()}>
            <div className="text-center space-y-2">
              <div className="w-14 h-14 rounded-full bg-red-50 flex items-center justify-center mx-auto">
                <Trash2 size={24} className="text-destructive" />
              </div>
              <h3 className="text-lg font-bold text-foreground">Delete Project?</h3>
              <p className="text-sm text-muted-foreground">
                This will permanently delete <span className="font-semibold text-foreground">{deleteConfirm.projectName}</span> along
                with all its properties, orders, and documents.
              </p>
              <p className="text-xs text-destructive font-semibold">This action cannot be undone.</p>
            </div>
            <div className="flex gap-3">
              <Button
                variant="outline"
                className="flex-1 h-11"
                onClick={() => setDeleteConfirm(null)}
                disabled={deleting}
              >
                Cancel
              </Button>
              <Button
                className="flex-1 h-11 bg-destructive hover:bg-destructive/90 text-white"
                onClick={() => handleDeleteProject(deleteConfirm.name)}
                disabled={deleting}
              >
                {deleting ? "Deleting..." : "Delete"}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default SelectProject;
