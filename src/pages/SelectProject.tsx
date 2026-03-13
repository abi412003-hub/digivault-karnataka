import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { CheckCircle, Hourglass, Clock, Eye, FileText, FolderOpen } from "lucide-react";
import { Button } from "@/components/ui/button";
import PageHeader from "@/components/PageHeader";
import BottomTabs from "@/components/BottomTabs";
import { useAuth } from "@/contexts/AuthContext";
import { fetchList } from "@/lib/api";

interface ProjectData {
  name: string;
  project_name: string;
  project_status: string;
}

interface StatusCounts {
  completed: number;
  ongoing: number;
  pending: number;
}

const SelectProject = () => {
  const navigate = useNavigate();
  const { auth } = useAuth();
  const [projects, setProjects] = useState<ProjectData[]>([]);
  const [statusMap, setStatusMap] = useState<Record<string, StatusCounts>>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!auth.client_id) return;
    const load = async () => {
      try {
        const projs = await fetchList(
          "DigiVault Project",
          ["name", "project_name", "project_status"],
          [["client", "=", auth.client_id]]
        );
        setProjects(projs || []);

        // Fetch service request counts per project
        const srs = await fetchList(
          "DigiVault Service Request",
          ["name", "project", "request_status"],
          [["client", "=", auth.client_id]]
        );
        const map: Record<string, StatusCounts> = {};
        for (const sr of srs || []) {
          const proj = sr.project || "";
          if (!map[proj]) map[proj] = { completed: 0, ongoing: 0, pending: 0 };
          if (sr.request_status === "Completed") map[proj].completed++;
          else if (sr.request_status === "In Progress") map[proj].ongoing++;
          else map[proj].pending++;
        }
        setStatusMap(map);
      } catch {
        // keep empty
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [auth.client_id]);

  return (
    <div className="flex flex-col min-h-screen bg-background pb-20">
      <PageHeader title="Details" />

      <div className="px-4 py-4 space-y-4">
        {/* Select Project header + Add Project button */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <FileText size={18} className="text-foreground" />
            <span className="font-bold text-foreground">Select Project</span>
          </div>
          <Button
            onClick={() => navigate("/create-project")}
            className="bg-orange-500 hover:bg-orange-600 text-white rounded-lg px-4 h-9 text-sm font-bold"
          >
            Add Project
          </Button>
        </div>

        {loading && <p className="text-center text-muted-foreground py-8">Loading projects...</p>}

        {!loading && projects.length === 0 && (
          <div className="text-center py-12 space-y-4">
            <FolderOpen size={48} className="mx-auto text-muted-foreground" />
            <p className="text-muted-foreground">No projects yet</p>
            <Button onClick={() => navigate("/create-project")} className="bg-orange-500 hover:bg-orange-600 text-white">
              Create your first project
            </Button>
          </div>
        )}

        {/* Project cards */}
        {projects.map((proj) => {
          const counts = statusMap[proj.name] || { completed: 0, ongoing: 0, pending: 0 };
          return (
            <div key={proj.name} className="border border-border rounded-2xl p-4 space-y-3 bg-background">
              {/* Project name + ID */}
              <div className="text-center">
                <h2 className="text-lg font-bold text-foreground">{proj.project_name}</h2>
                <p className="text-sm text-muted-foreground">{proj.name}</p>
              </div>

              {/* Action buttons row */}
              <div className="flex justify-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  className="rounded-full border-foreground text-foreground text-xs h-8 gap-1"
                  onClick={() => navigate(`/project/${encodeURIComponent(proj.name)}/property-review`)}
                >
                  <Eye size={14} /> View details
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  className="rounded-full border-foreground text-foreground text-xs h-8 gap-1"
                >
                  <FileText size={14} /> Project opinion
                </Button>
              </div>

              {/* e-files button */}
              <div className="flex justify-center">
                <Button
                  size="sm"
                  className="rounded-full bg-green-600 hover:bg-green-700 text-white text-xs h-8 gap-1 px-6"
                  onClick={() => navigate(`/orders?project=${encodeURIComponent(proj.name)}`)}
                >
                  <FileText size={14} /> e-files
                </Button>
              </div>

              {/* Status cards row */}
              <div className="flex gap-2 justify-center">
                <div className="flex items-center gap-1.5 bg-green-50 rounded-xl px-3 py-2 min-w-[90px]">
                  <CheckCircle size={18} className="text-green-600" />
                  <span className="text-lg font-bold text-green-600">{counts.completed}</span>
                  <span className="text-[11px] text-green-600 leading-tight">Completed</span>
                </div>
                <div className="flex items-center gap-1.5 bg-blue-50 rounded-xl px-3 py-2 min-w-[90px]">
                  <Hourglass size={18} className="text-blue-600" />
                  <span className="text-lg font-bold text-blue-600">{counts.ongoing}</span>
                  <span className="text-[11px] text-blue-600 leading-tight">Ongoing</span>
                </div>
                <div className="flex items-center gap-1.5 bg-amber-50 rounded-xl px-3 py-2 min-w-[90px]">
                  <Clock size={18} className="text-amber-600" />
                  <span className="text-lg font-bold text-amber-600">{counts.pending}</span>
                  <span className="text-[11px] text-amber-600 leading-tight">Pending</span>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      <BottomTabs />
    </div>
  );
};

export default SelectProject;
