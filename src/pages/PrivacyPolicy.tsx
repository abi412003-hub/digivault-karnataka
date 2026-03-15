import { ArrowLeft } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { ScrollArea } from "@/components/ui/scroll-area";

const PrivacyPolicy = () => {
  const navigate = useNavigate();

  return (
    <div className="flex flex-col min-h-screen bg-background">
      <div className="sticky top-0 z-10 bg-background border-b border-border px-4 py-3 flex items-center gap-3">
        <button
          onClick={() => navigate(-1)}
          className="min-h-[44px] min-w-[44px] flex items-center justify-center"
        >
          <ArrowLeft size={22} className="text-foreground" />
        </button>
        <h1 className="text-lg font-bold text-foreground">Privacy Policy</h1>
      </div>

      <ScrollArea className="flex-1">
        <div className="px-5 py-6 space-y-6 text-sm text-foreground leading-relaxed">
          <div className="text-center space-y-1">
            <h2 className="text-xl font-bold text-primary">e-DigiVault</h2>
            <p className="text-muted-foreground text-xs">Privacy Policy · Last Updated: 20th November 2025</p>
          </div>

          <p className="text-muted-foreground">
            e-DigiVault ("we", "our", "us") is a coordination and follow-up service provider that assists individuals and businesses in tracking, managing, and monitoring government-related documentation and application processes. We do not create, modify, or issue any official documents. All documents are issued solely by the respective government authorities.
          </p>
          <p className="text-muted-foreground">
            We are committed to protecting your privacy and ensuring that your personal information is handled securely and responsibly. This Privacy Policy explains how we collect, use, store, protect, and disclose your information while using our services.
          </p>

          <section className="space-y-4">
            <h3 className="text-base font-bold text-primary border-b border-border pb-2">1. Information We Collect</h3>
            <p className="text-muted-foreground">We collect information only for the purpose of providing coordination, follow-up, and tracking services.</p>

            <div className="space-y-1">
              <p className="font-semibold">1.1 Personal Information</p>
              <ul className="list-disc pl-5 text-muted-foreground space-y-1">
                <li>Name, address, phone number, email ID</li>
                <li>Aadhar number, application numbers, registration numbers (only when required for tracking)</li>
                <li>Date of birth (for personal records follow-up)</li>
                <li>Account/portal login IDs shared for follow-up (we never store passwords)</li>
              </ul>
            </div>

            <div className="space-y-1">
              <p className="font-semibold">1.2 Document Information</p>
              <p className="text-muted-foreground">We may collect copies or details of documents required for tracking purposes, including:</p>
              <ul className="list-disc pl-5 text-muted-foreground space-y-1">
                <li>Business documents</li>
                <li>Revenue/property records and documents</li>
                <li>Personal documents (Aadhar, Voter ID, PAN, etc.)</li>
                <li>Application receipts, acknowledgment slips, challans</li>
              </ul>
            </div>

            <div className="space-y-1">
              <p className="font-semibold">1.3 System Information</p>
              <ul className="list-disc pl-5 text-muted-foreground space-y-1">
                <li>IP address</li>
                <li>Device information</li>
                <li>Browser information</li>
                <li>App usage data</li>
                <li>Location (only if you voluntarily submit GPS photos for attendance or verification)</li>
              </ul>
            </div>
          </section>

          <section className="space-y-3">
            <h3 className="text-base font-bold text-primary border-b border-border pb-2">2. How We Use Your Information</h3>
            <p className="text-muted-foreground">We use your information strictly for lawful and service-related purposes such as:</p>
            <ul className="list-disc pl-5 text-muted-foreground space-y-1">
              <li>Coordinating with government departments</li>
              <li>Tracking the status of applications/documents</li>
              <li>Updating you about progress, delays, or required corrections</li>
              <li>Improving service accuracy and response time</li>
              <li>Maintaining internal records and logs</li>
              <li>Ensuring security and fraud prevention</li>
            </ul>
            <p className="text-muted-foreground font-medium">We never use your information for marketing without your consent.</p>
          </section>

          <section className="space-y-3">
            <h3 className="text-base font-bold text-primary border-b border-border pb-2">3. How We Store & Protect Your Information</h3>
            <p className="text-muted-foreground">We take extensive measures to safeguard your information through:</p>
            <ul className="list-disc pl-5 text-muted-foreground space-y-1">
              <li>End-to-end data encryption</li>
              <li>Secure servers and protected storage systems</li>
              <li>OTP-based access control</li>
              <li>Live banking-graded security features</li>
              <li>Restricted internal access to authorized staff only</li>
              <li>Regular audits and monitoring</li>
            </ul>
            <div className="bg-primary/10 rounded-lg p-3 space-y-1">
              <p className="text-muted-foreground text-xs">✓ We never store passwords or OTPs.</p>
              <p className="text-muted-foreground text-xs">✓ We never share your information without your permission.</p>
              <p className="text-muted-foreground text-xs">✓ We never sell or misuse your data.</p>
            </div>
          </section>

          <section className="space-y-3">
            <h3 className="text-base font-bold text-primary border-b border-border pb-2">4. Sharing of Information</h3>

            <div className="space-y-1">
              <p className="font-semibold">4.1 With Government Departments</p>
              <p className="text-muted-foreground">Only when necessary to check application status, submit corrections, track follow-ups, or resolve pending issues.</p>
            </div>

            <div className="space-y-1">
              <p className="font-semibold">4.2 With Service Partners</p>
              <p className="text-muted-foreground">Only with verified partners who assist with fieldwork, support documentation follow-up, or provide backend technical support. All partners follow strict confidentiality agreements.</p>
            </div>

            <div className="space-y-1">
              <p className="font-semibold">4.3 Legal Requirement</p>
              <p className="text-muted-foreground">We may share information when required by law, ordered by a court, or needed to prevent fraud or misuse.</p>
            </div>

            <p className="text-muted-foreground font-medium">We never share your information with third-party advertisers.</p>
          </section>

          <section className="space-y-3">
            <h3 className="text-base font-bold text-primary border-b border-border pb-2">5. User Rights</h3>
            <p className="text-muted-foreground">You have the right to:</p>
            <ul className="list-disc pl-5 text-muted-foreground space-y-1">
              <li>Access the data we store</li>
              <li>Request correction of incorrect information</li>
              <li>Request deletion of your stored documents</li>
              <li>Withdraw consent anytime</li>
              <li>Ask for clarification or details of your data usage</li>
            </ul>
            <p className="text-muted-foreground">All requests will be addressed within 7–15 working days.</p>
          </section>

          <section className="space-y-3">
            <h3 className="text-base font-bold text-primary border-b border-border pb-2">6. Data Retention</h3>
            <p className="text-muted-foreground">We retain your data only as long as necessary for tracking and follow-up, legal and audit requirements, and service continuity. You may request permanent deletion at any time.</p>
          </section>

          <section className="space-y-3">
            <h3 className="text-base font-bold text-primary border-b border-border pb-2">7. Consent</h3>
            <p className="text-muted-foreground">By using e-DigiVault services, website, mobile application, or submitting documents/data, you agree to the terms in this Privacy Policy.</p>
          </section>

          <section className="space-y-3">
            <h3 className="text-base font-bold text-primary border-b border-border pb-2">8. Policy Updates</h3>
            <p className="text-muted-foreground">We may update this Privacy Policy as needed due to new services, legal changes, or system improvements. Users will be notified of major changes through email/SMS/app notifications.</p>
          </section>

          <section className="space-y-3">
            <h3 className="text-base font-bold text-primary border-b border-border pb-2">9. Contact Us</h3>
            <p className="text-muted-foreground">For privacy-related queries or data removal requests, contact the e-DigiVault Data Protection Officer.</p>
          </section>
        </div>
      </ScrollArea>
    </div>
  );
};

export default PrivacyPolicy;
