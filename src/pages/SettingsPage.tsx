import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import {
  User,
  ChevronRight,
  Bell,
  Type,
  ShieldCheck,
  MessageSquare,
  Headphones,
  Smartphone,
  HelpCircle,
  LogOut,
  Camera,
} from "lucide-react";
import BottomTabs from "@/components/BottomTabs";
import { useAuth } from "@/contexts/AuthContext";
import { fetchOne, uploadFile, updateRecord, getFileUrl } from "@/lib/api";
import { useToast } from "@/hooks/use-toast";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

const menuItems = [
  { icon: Bell, label: "Notifications" },
  { icon: Type, label: "Language preference" },
  { icon: ShieldCheck, label: "Privacy Settings" },
  { icon: MessageSquare, label: "Feedback" },
  { icon: Headphones, label: "Contact Support" },
  { icon: Smartphone, label: "User Manual" },
  { icon: HelpCircle, label: "FAQ/Help" },
];

const SettingsPage = () => {
  const navigate = useNavigate();
  const { auth, logout } = useAuth();
  const { toast } = useToast();
  const [clientPhoto, setClientPhoto] = useState("");
  const [clientName, setClientName] = useState(auth.name || "User");

  const fileInputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    if (auth.client_id) {
      fetchOne("DigiVault Client", auth.client_id)
        .then((data: any) => {
          if (data?.client_photo) {
            setClientPhoto(getFileUrl(data.client_photo));
          }
          if (data?.client_name) setClientName(data.client_name);
        })
        .catch(() => {});
    }
  }, [auth.client_id]);

  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !auth.client_id) return;

    setUploading(true);
    try {
      const uploadRes = await uploadFile(file, "DigiVault Client", auth.client_id, "client_photo");
      const fileUrl = uploadRes?.message?.file_url;
      if (fileUrl) {
        await updateRecord("DigiVault Client", auth.client_id, { client_photo: fileUrl });
        setClientPhoto(getFileUrl(fileUrl));
        toast({ title: "Profile photo updated" });
      } else {
        throw new Error("Upload failed");
      }
    } catch {
      toast({ title: "Failed to upload photo", variant: "destructive" });
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  const handleLogout = async () => {
    await logout();
    navigate("/login", { replace: true });
  };

  return (
    <div className="flex flex-col min-h-screen bg-background pb-20">
      {/* Blue profile header */}
      <div className="relative bg-primary rounded-b-2xl px-4 pt-5 pb-8 flex flex-col items-center" style={{ minHeight: 200 }}>
        <button onClick={() => navigate(-1)} className="absolute top-4 left-4 min-h-[44px] min-w-[44px] flex items-center justify-center">
          <ChevronRight size={22} className="text-primary-foreground rotate-180" />
        </button>

        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={handlePhotoUpload}
        />
        <div className="relative mt-4">
          <div className="w-20 h-20 rounded-full border-[3px] border-primary-foreground bg-muted flex items-center justify-center overflow-hidden">
            {clientPhoto ? (
              <img src={clientPhoto} alt="Profile" className="w-full h-full object-cover" />
            ) : (
              <User size={36} className="text-primary-foreground" />
            )}
          </div>
          <button
            onClick={() => fileInputRef.current?.click()}
            disabled={uploading}
            className="absolute bottom-0 right-0 w-7 h-7 rounded-full bg-accent border-2 border-primary-foreground flex items-center justify-center"
          >
            <Camera size={14} className="text-accent-foreground" />
          </button>
        </div>
        <span className="mt-3 text-xl font-bold text-primary-foreground">{clientName}</span>
      </div>

      {/* Settings menu */}
      <div className="px-4 py-4">
        <h2 className="text-lg font-bold text-foreground mb-4">Settings</h2>

        <div className="space-y-0">
          {menuItems.map((item) => {
            const Icon = item.icon;
            return (
              <button
                key={item.label}
                onClick={() => toast({ title: "Coming soon" })}
                className="w-full flex items-center gap-3 py-4 border-b border-border/50"
              >
                <span className="w-10 h-10 rounded-full bg-secondary flex items-center justify-center flex-shrink-0">
                  <Icon size={20} className="text-primary" />
                </span>
                <span className="flex-1 text-left text-base text-foreground">{item.label}</span>
                <ChevronRight size={18} className="text-muted-foreground" />
              </button>
            );
          })}

          {/* Logout */}
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <button className="w-full flex items-center gap-3 py-4">
                <span className="w-10 h-10 rounded-full bg-destructive/10 flex items-center justify-center flex-shrink-0">
                  <LogOut size={20} className="text-destructive" />
                </span>
                <span className="flex-1 text-left text-base text-destructive font-medium">Logout</span>
                <ChevronRight size={18} className="text-muted-foreground" />
              </button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Are you sure you want to logout?</AlertDialogTitle>
                <AlertDialogDescription>You will be redirected to the login page.</AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction onClick={handleLogout} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
                  Logout
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
      </div>

      <BottomTabs />
    </div>
  );
};

export default SettingsPage;
