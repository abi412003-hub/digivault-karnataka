import { useState, useEffect, useRef } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useAuth } from "@/contexts/AuthContext";
import { createRecord } from "@/lib/api";
import { useToast } from "@/hooks/use-toast";
import { useFormDraft, hasDraft } from "@/hooks/useFormDraft";
import { validateForm, type FormRules } from "@/lib/validation";
import { RequiredLabel, OptionalLabel } from "@/components/RequiredLabel";
import DraftIndicator from "@/components/DraftIndicator";

const DRAFT_KEY = "create-project";

const CreateProject = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const propertyId = searchParams.get("property") || "";
  const { auth } = useAuth();
  const { toast } = useToast();

  const hadDraft = useRef(hasDraft(DRAFT_KEY));
  const [form, setField, clearDraft, , lastSaved] = useFormDraft(DRAFT_KEY, { title: "", description: "" });
  const [saving, setSaving] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [shakeBtn, setShakeBtn] = useState(false);

  useEffect(() => {
    if (hadDraft.current) toast({ title: "Draft found — continuing your project" });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleNext = async () => {
    const rules: FormRules = { title: { required: true, minLength: 2, message: "Project title is required" } };
    const result = validateForm(form, rules);
    setErrors(result.errors);
    if (!result.valid) {
      setShakeBtn(true);
      setTimeout(() => setShakeBtn(false), 400);
      return;
    }

    setSaving(true);
    try {
      const projRes = await createRecord("DigiVault Project", {
        project_name: form.title,
        project_description: form.description,
        client: auth.client_id,
        project_status: "Draft",
      });
      const projectName = projRes?.data?.name;
      if (!projectName) {
        toast({ title: "Failed to create project — no ID returned", variant: "destructive" });
        setSaving(false);
        return;
      }
      clearDraft();
      toast({ title: "Project created!" });
      // Store project context for the property creation step
      localStorage.setItem("edv_current_project", JSON.stringify({ id: projectName, name: form.title }));
      navigate(`/properties/add?project=${encodeURIComponent(projectName)}&projectName=${encodeURIComponent(form.title)}`, { replace: true });
    } catch {
      toast({ title: "Failed to create project", variant: "destructive" });
    } finally {
      setSaving(false);
    }
  };

  const handleStartFresh = () => {
    clearDraft();
    setField("title", "");
    setField("description", "");
    setErrors({});
  };

  return (
    <div className="flex flex-col min-h-screen bg-background">
      <div className="flex items-center px-4 h-14 border-b border-border">
        <button onClick={() => navigate(-1)} className="min-h-[44px] min-w-[44px] flex items-center justify-center -ml-2">
          <ArrowLeft size={22} className="text-foreground" />
        </button>
      </div>

      <div className="flex-1 px-4 py-6 space-y-6">
        <div className="text-center space-y-1">
          <h1 className="text-xl font-bold text-foreground">Welcome to e-DigiVault</h1>
          <p className="text-sm text-muted-foreground">Secure Access to Documents</p>
        </div>

        <div className="h-px bg-border" />

        <div className="space-y-5">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-bold text-foreground">Create New Project</h2>
          </div>
          <DraftIndicator lastSaved={lastSaved} onStartFresh={handleStartFresh} showStartFresh={hadDraft.current} />

          <div className="space-y-2" data-field="title">
            <RequiredLabel>Project Title</RequiredLabel>
            <Input
              placeholder="Enter your Project Title"
              value={form.title}
              onChange={(e) => setField("title", e.target.value)}
              className={errors.title ? "border-destructive ring-1 ring-destructive" : ""}
            />
            {errors.title && <p className="text-xs text-destructive mt-1">{errors.title}</p>}
          </div>

          <div className="space-y-2">
            <OptionalLabel>Project Description</OptionalLabel>
            <Input
              placeholder="Write the description"
              value={form.description}
              onChange={(e) => setField("description", e.target.value)}
            />
          </div>

          <div className="flex justify-end">
            <Button
              onClick={handleNext}
              disabled={saving}
              className={`w-[120px] bg-[hsl(217_91%_53%)] hover:bg-[hsl(217_91%_45%)] text-white ${shakeBtn ? "animate-[shake_0.3s]" : ""}`}
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
