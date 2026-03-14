import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes, Navigate } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider } from "@/contexts/AuthContext";
import Splash from "./pages/Splash";
import Onboarding from "./pages/Onboarding";
import Login from "./pages/Login";
import RegisterType from "./pages/RegisterType";
import RegisterForm from "./pages/RegisterForm";
import Dashboard from "./pages/Dashboard";
import Properties from "./pages/Properties";
import AddProperty from "./pages/properties/AddProperty";
import PropertyLocation from "./pages/properties/PropertyLocation";
import PropertyPhotos from "./pages/properties/PropertyPhotos";
import PropertyDetails from "./pages/properties/PropertyDetails";
import PropertyServices from "./pages/properties/PropertyServices";
import SelectService from "./pages/properties/SelectService";
import SelectSubService from "./pages/properties/SelectSubService";
import PropertyRequests from "./pages/properties/PropertyRequests";
import CreateProject from "./pages/CreateProject";
import SelectProject from "./pages/SelectProject";
import ProjectPropertyEdit from "./pages/ProjectPropertyEdit";
import ProjectPropertyReview from "./pages/ProjectPropertyReview";
import Orders from "./pages/Orders";
import ServiceRequestDetail from "./pages/ServiceRequestDetail";
import CommonDocs from "./pages/service-request/CommonDocs";
import ServiceDocs from "./pages/service-request/ServiceDocs";
import DocCards from "./pages/service-request/DocCards";
import POA from "./pages/service-request/POA";
import ESign from "./pages/service-request/ESign";
import VideoVerify from "./pages/service-request/VideoVerify";
import SubDocs from "./pages/service-request/SubDocs";
import Payment from "./pages/service-request/Payment";
import ServiceTracker from "./pages/ServiceTracker";
import Transactions from "./pages/Transactions";
import PaymentHistory from "./pages/PaymentHistory";
import GapDocuments from "./pages/GapDocuments";
import MessagesList from "./pages/MessagesList";
import MessageThread from "./pages/MessageThread";
import DocumentListPage from "./pages/DocumentListPage";
import SettingsPage from "./pages/SettingsPage";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <AuthProvider>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<Navigate to="/splash" replace />} />
            <Route path="/splash" element={<Splash />} />
            <Route path="/onboarding" element={<Onboarding />} />
            <Route path="/login" element={<Login />} />
            <Route path="/register-type" element={<RegisterType />} />
            <Route path="/register-form" element={<RegisterForm />} />
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/properties" element={<Properties />} />
            <Route path="/properties/add" element={<AddProperty />} />
            <Route path="/properties/:id/location" element={<PropertyLocation />} />
            <Route path="/properties/:id/photos" element={<PropertyPhotos />} />
            <Route path="/properties/:id/details" element={<PropertyDetails />} />
            <Route path="/properties/:id/services" element={<PropertyServices />} />
            <Route path="/properties/:id/select-service" element={<SelectService />} />
            <Route path="/properties/:id/select-sub-service" element={<SelectSubService />} />
            <Route path="/properties/:id/requests" element={<PropertyRequests />} />
            <Route path="/create-project" element={<CreateProject />} />
            <Route path="/select-project" element={<SelectProject />} />
            <Route path="/project/:projectId/property-edit" element={<ProjectPropertyEdit />} />
            <Route path="/project/:projectId/property-review" element={<ProjectPropertyReview />} />
            <Route path="/orders" element={<Orders />} />
            <Route path="/service-request/:srId/detail" element={<ServiceRequestDetail />} />
            <Route path="/service-request/:srId/common-docs" element={<CommonDocs />} />
            <Route path="/service-request/:srId/service-docs" element={<ServiceDocs />} />
            <Route path="/service-request/:srId/doc-cards" element={<DocCards />} />
            <Route path="/service-request/:srId/poa" element={<POA />} />
            <Route path="/service-request/:srId/esign" element={<ESign />} />
            <Route path="/service-request/:srId/video-verify" element={<VideoVerify />} />
            <Route path="/service-request/:srId/sub-docs/:docName" element={<SubDocs />} />
            <Route path="/service-request/:srId/payment" element={<Payment />} />
            <Route path="/service-request/:srId/track" element={<ServiceTracker />} />
            <Route path="/transactions" element={<Transactions />} />
            <Route path="/payments" element={<PaymentHistory />} />
            <Route path="/gap-documents" element={<GapDocuments />} />
            <Route path="/proposals" element={<DocumentListPage />} />
            <Route path="/estimates" element={<DocumentListPage />} />
            <Route path="/invoices" element={<DocumentListPage />} />
            <Route path="/settings" element={<SettingsPage />} />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </TooltipProvider>
    </AuthProvider>
  </QueryClientProvider>
);

export default App;
