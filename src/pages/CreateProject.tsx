import { useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useAuth } from "@/contexts/AuthContext";
import { createRecord } from "@/lib/api";
import { useToast } from "@/hooks/use-toast";

const CreateProject = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const propertyId = searchParams.get("property") || "";
  const mainService = searchParams.get("main_service") || "";
  const subService = searchParams.get("sub_service") || "";
  const { auth } = useAuth();
  const { toast } = useToast();

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [saving, setSaving] = useState(false);

  const handleNext = async () => {
    if (!title.trim()) {
      toast({ title: "Please enter a project title", variant: "destructive" });
      return;
    }
    setSaving(true);
    try {
      const projRes = await createRecord("DigiVault Project", {
        project_name: title,
        project_description: description,
        client: auth.client_id,
        project_status: "Draft",
      });
      const projectName = projRes?.data?.name;

      if (!projectName) {
        toast({ title: "Failed to create project — no ID returned", variant: "destructive" });
        setSaving(false);
        return;
      }

      toast({ title: "Project created!" });
      navigate(`/project/${encodeURIComponent(projectName)}/property-edit?name=${encodeURIComponent(title)}`, { replace: true });
    } catch {
      toast({ title: "Failed to create project", variant: "destructive" });
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="flex flex-col min-h-screen bg-background">
      {/* Header */}
      <div className="flex items-center px-4 h-14 border-b border-border">
        <button onClick={() => navigate(-1)} className="min-h-[44px] min-w-[44px] flex items-center justify-center -ml-2">
          <ArrowLeft size={22} className="text-foreground" />
        </button>
      </div>

      <div className="flex-1 px-4 py-6 space-y-6">
        {/* Welcome */}
        <div className="text-center space-y-1">
          <h1 className="text-xl font-bold text-foreground">Welcome to e-DigiVault</h1>
          <p className="text-sm text-muted-foreground">Secure Access to Documents</p>
        </div>

        <div className="h-px bg-border" />

        {/* Form */}
        <div className="space-y-5">
          <h2 className="text-base font-bold text-foreground">Create New Project</h2>

          <div className="space-y-2">
            <label className="text-sm font-medium text-foreground">Project Title</label>
            <Input
              placeholder="Enter your Project Title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium text-foreground">Project Description</label>
            <Input
              placeholder="Write the description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            />
          </div>

          <div className="flex justify-end">
            <Button
              onClick={handleNext}
              disabled={saving}
              className="w-[120px] bg-[hsl(217_91%_53%)] hover:bg-[hsl(217_91%_45%)] text-white"
            >
              {saving ? "Creating…" : "Next"}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CreateProject;
