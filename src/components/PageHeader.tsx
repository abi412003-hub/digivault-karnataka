import { useNavigate } from "react-router-dom";
import { ArrowLeft, Bell, MessageSquare, User } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { useEffect, useState } from "react";
import { fetchOne, getFileUrl } from "@/lib/api";

interface Props {
  title: string;
  showBack?: boolean;
}

const PageHeader = ({ title, showBack = true }: Props) => {
  const navigate = useNavigate();
  const { auth } = useAuth();
  const [photoUrl, setPhotoUrl] = useState("");

  useEffect(() => {
    if (auth.client_id) {
      fetchOne("DigiVault Client", auth.client_id)
        .then((data: any) => {
          if (data?.client_photo) {
            setPhotoUrl(getFileUrl(data.client_photo));
          }
        })
        .catch(() => {});
    }
  }, [auth.client_id]);

  return (
    <div className="sticky top-0 z-10 flex items-center justify-between bg-background px-4 h-14 border-b border-border">
      <div className="flex items-center gap-2">
        {showBack && (
          <button onClick={() => navigate(-1)} className="min-h-[44px] min-w-[44px] flex items-center justify-center -ml-2">
            <ArrowLeft size={22} className="text-foreground" />
          </button>
        )}
        <h1 className="text-lg font-bold text-foreground">{title}</h1>
      </div>
      <div className="flex items-center gap-3">
        <span className="w-10 h-10 rounded-full bg-secondary flex items-center justify-center">
          <MessageSquare size={18} className="text-primary" />
        </span>
        <span className="w-10 h-10 rounded-full bg-secondary flex items-center justify-center">
          <Bell size={18} className="text-primary" />
        </span>
        <span className="w-10 h-10 rounded-full border border-input bg-muted flex items-center justify-center overflow-hidden">
          {photoUrl ? (
            <img src={photoUrl} alt="Profile" className="w-full h-full object-cover" />
          ) : (
            <User size={18} className="text-muted-foreground" />
          )}
        </span>
      </div>
    </div>
  );
};

export default PageHeader;
