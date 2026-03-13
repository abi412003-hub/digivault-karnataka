import { useNavigate } from "react-router-dom";
import { ArrowLeft, Bell, MessageSquare, User } from "lucide-react";

interface Props {
  title: string;
  showBack?: boolean;
}

const PageHeader = ({ title, showBack = true }: Props) => {
  const navigate = useNavigate();
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
          <Bell size={18} className="text-primary" />
        </span>
        <span className="w-10 h-10 rounded-full bg-secondary flex items-center justify-center">
          <MessageSquare size={18} className="text-primary" />
        </span>
        <span className="w-10 h-10 rounded-full border border-input bg-muted flex items-center justify-center">
          <User size={18} className="text-muted-foreground" />
        </span>
      </div>
    </div>
  );
};

export default PageHeader;
