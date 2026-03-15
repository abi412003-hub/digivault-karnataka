import { useState, useEffect, useRef } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { ArrowLeft, ArrowUpFromLine, CheckCircle, Users } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { fetchOne } from "@/lib/api";
import { useToast } from "@/hooks/use-toast";

interface UploadPair {
  front: File | null;
  back: File | null;
}

interface JointMember {
  name: string;
  aadhaar: string;
  pan: string;
}

const sections = [
  { name: "Proof of identity", mandatory: true },
  { name: "Proof of Address", mandatory: true },
  { name: "DOB Certificate", mandatory: true },
];

const UploadBtn = ({ label, file, onClick }: { label: string; file: File | null; onClick: () => void }) => (
  <button onClick={onClick}
    className="flex-1 flex items-center justify-between rounded-lg border border-input bg-background px-3 py-3 min-h-[44px] text-sm">
    {file ? (
      <span className="flex items-center gap-1.5 text-[hsl(142_76%_36%)] truncate">
        <CheckCircle size={16} />
        <span className="truncate">{file.name}</span>
      </span>
    ) : (
      <span className="text-muted-foreground">{label}</span>
    )}
    <ArrowUpFromLine size={16} className="text-muted-foreground flex-shrink-0 ml-2" />
  </button>
);

const CommonDocs = () => {
  const { srId } = useParams<{ srId: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [mainService, setMainService] = useState("");
  const [subService, setSubService] = useState("");
  const [uploads, setUploads] = useState<UploadPair[]>(sections.map(() => ({ front: null, back: null })));
  const frontRefs = useRef<(HTMLInputElement | null)[]>([]);
  const backRefs = useRef<(HTMLInputElement | null)[]>([]);

  // Joint member state
  const [ownershipType, setOwnershipType] = useState("Individual");
  const [jointMembers, setJointMembers] = useState<JointMember[]>([]);

  useEffect(() => {
    if (!srId) return;
    fetchOne("DigiVault Service Request", srId)
      .then(async (d) => {
        setMainService(d?.main_service || "");
        setSubService(d?.sub_service || "");
        // Get property to check ownership type
        if (d?.property) {
          const prop = await fetchOne("DigiVault Property", d.property);
          if (prop?.ownership_type === "Joint") {
            setOwnershipType("Joint");
            const count = Number(prop.joint_members_count) || 2;
            setJointMembers(Array.from({ length: count }, () => ({ name: "", aadhaar: "", pan: "" })));
          }
        }
      })
      .catch(() => {});
    
    // Also check localStorage fallback
    try {
      const stored = localStorage.getItem("edv_joint_members");
      if (stored) {
        const data = JSON.parse(stored);
        if (data.ownershipType === "Joint" && data.count > 1) {
          setOwnershipType("Joint");
          setJointMembers(Array.from({ length: data.count }, () => ({ name: "", aadhaar: "", pan: "" })));
        }
      }
    } catch {}
  }, [srId]);

  const handleFile = (sectionIdx: number, side: "front" | "back", file: File | null) => {
    setUploads((prev) => {
      const next = [...prev];
      next[sectionIdx] = { ...next[sectionIdx], [side]: file };
      return next;
    });
  };

  const updateJointMember = (idx: number, field: keyof JointMember, value: string) => {
    setJointMembers((prev) => {
      const next = [...prev];
      next[idx] = { ...next[idx], [field]: value };
      return next;
    });
  };

  const mandatoryCount = sections.filter((s) => s.mandatory).length;
  const mandatoryUploaded = sections.filter((s, i) => s.mandatory && uploads[i].front).length;

  // Joint member validation
  const jointValid = ownershipType !== "Joint" || jointMembers.every((m) => m.name.trim() && m.aadhaar.trim() && m.pan.trim());

  const handleNext = () => {
    if (mandatoryUploaded < mandatoryCount) {
      toast({ title: `Please upload all mandatory documents (${mandatoryUploaded}/${mandatoryCount})`, variant: "destructive" });
      return;
    }
    if (!jointValid) {
      toast({ title: "Please fill Name, Aadhaar & PAN for all joint members", variant: "destructive" });
      return;
    }
    // Store joint member data for the authorization letter
    if (jointMembers.length > 0) {
      localStorage.setItem("edv_joint_member_details", JSON.stringify(jointMembers));
    }
    navigate(`/service-request/${encodeURIComponent(srId!)}/service-docs`, { replace: true });
  };



  return (
    <div className="flex flex-col min-h-screen bg-background">
      <div className="flex items-center px-4 h-14 border-b border-border">
        <button onClick={() => navigate(-1)} className="min-h-[44px] min-w-[44px] flex items-center justify-center -ml-2">
          <ArrowLeft size={22} className="text-foreground" />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto px-4 py-5 pb-28 space-y-5">
        <div className="rounded-xl overflow-hidden border border-border">
          <div className="bg-secondary px-4 py-3">
            <h2 className="text-center font-bold text-foreground text-lg">Upload Common Documents</h2>
          </div>
          <div className="bg-background px-4 py-3 space-y-2">
            <div className="flex justify-between">
              <span className="text-sm font-bold text-foreground">Main Service</span>
              <span className="text-sm text-muted-foreground">{mainService || "—"}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm font-bold text-foreground">Sub Service</span>
              <span className="text-sm text-muted-foreground">{subService || "—"}</span>
            </div>
            {ownershipType === "Joint" && (
              <div className="flex justify-between">
                <span className="text-sm font-bold text-foreground">Ownership</span>
                <span className="text-sm text-amber-600 font-semibold">Joint ({jointMembers.length} members)</span>
              </div>
            )}
          </div>
        </div>

        {/* Progress bar */}
        <div className="space-y-1">
          <p className="text-xs text-muted-foreground">{mandatoryUploaded}/{mandatoryCount} mandatory documents uploaded</p>
          <div className="h-2 rounded-full bg-muted overflow-hidden">
            <div className="h-full rounded-full bg-primary transition-all duration-300"
              style={{ width: `${mandatoryCount ? (mandatoryUploaded / mandatoryCount) * 100 : 0}%` }} />
          </div>
        </div>

        {/* Document upload sections */}
        {sections.map((section, idx) => (
          <div key={section.name} className="space-y-2">
            <label className="text-sm font-bold text-primary">
              {section.name}
              <span className="text-destructive ml-1">*</span>
            </label>
            <div className="flex gap-3">
              <input ref={(el) => { frontRefs.current[idx] = el; }} type="file" accept="image/*,.pdf" className="hidden"
                onChange={(e) => handleFile(idx, "front", e.target.files?.[0] || null)} />
              <input ref={(el) => { backRefs.current[idx] = el; }} type="file" accept="image/*,.pdf" className="hidden"
                onChange={(e) => handleFile(idx, "back", e.target.files?.[0] || null)} />
              <UploadBtn label="Upload Front Side" file={uploads[idx].front} onClick={() => frontRefs.current[idx]?.click()} />
              <UploadBtn label="Upload Back Side" file={uploads[idx].back} onClick={() => backRefs.current[idx]?.click()} />
            </div>
          </div>
        ))}

        {/* Joint Members Section — only shown for Joint ownership */}
        {ownershipType === "Joint" && jointMembers.length > 0 && (
          <div className="space-y-4 pt-2">
            <div className="flex items-center gap-2 border-t border-border pt-4">
              <Users size={20} className="text-primary" />
              <h3 className="text-base font-bold text-foreground">Joint Member Details</h3>
            </div>
            <p className="text-xs text-muted-foreground">
              Please provide Name, Aadhaar and PAN details for all {jointMembers.length} joint owner{jointMembers.length > 1 ? "s" : ""}.
              All fields are mandatory.
            </p>

            {jointMembers.map((member, idx) => (
              <div key={idx} className="rounded-xl border border-border p-4 space-y-3 bg-muted/20">
                <p className="text-sm font-bold text-primary">Member {idx + 1}</p>

                <div className="space-y-1">
                  <label className="text-xs font-bold text-foreground">
                    Full Name <span className="text-destructive">*</span>
                  </label>
                  <Input
                    placeholder="Enter full name"
                    value={member.name}
                    onChange={(e) => updateJointMember(idx, "name", e.target.value)}
                    className={`h-11 ${!member.name.trim() ? "" : "border-green-400"}`}
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-bold text-foreground">
                    Aadhaar No <span className="text-destructive">*</span>
                  </label>
                  <Input
                    placeholder="XXXX XXXX XXXX"
                    value={member.aadhaar}
                    onChange={(e) => {
                      // Auto-format: insert space every 4 digits
                      const raw = e.target.value.replace(/\D/g, "").slice(0, 12);
                      const formatted = raw.replace(/(\d{4})(?=\d)/g, "$1 ");
                      updateJointMember(idx, "aadhaar", formatted);
                    }}
                    maxLength={14}
                    className={`h-11 ${!member.aadhaar.trim() ? "" : "border-green-400"}`}
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-bold text-foreground">
                    PAN No <span className="text-destructive">*</span>
                  </label>
                  <Input
                    placeholder="ABCDE1234F"
                    value={member.pan}
                    onChange={(e) => updateJointMember(idx, "pan", e.target.value.toUpperCase().slice(0, 10))}
                    maxLength={10}
                    className={`h-11 ${!member.pan.trim() ? "" : "border-green-400"}`}
                  />
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="fixed bottom-0 left-0 right-0 bg-background border-t border-border px-4 py-4">
        <Button className="w-full h-12" onClick={handleNext} disabled={!jointValid}>
          Next
        </Button>
      </div>
    </div>
  );
};

export default CommonDocs;
