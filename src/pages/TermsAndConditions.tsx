import { ArrowLeft } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { ScrollArea } from "@/components/ui/scroll-area";

const TermsAndConditions = () => {
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
        <h1 className="text-lg font-bold text-foreground">Terms & Conditions</h1>
      </div>

      <ScrollArea className="flex-1">
        <div className="px-5 py-6 space-y-6 text-sm text-foreground leading-relaxed">
          <div className="text-center space-y-1">
            <h2 className="text-xl font-bold text-primary">e-DigiVault</h2>
            <p className="text-muted-foreground text-xs">Frequently Asked Questions & Terms</p>
          </div>

          {/* FAQ Section */}
          <section className="space-y-4">
            <h3 className="text-base font-bold text-primary border-b border-border pb-2">Frequently Asked Questions (FAQ)</h3>

            <div className="space-y-3">
              {[
                { q: "1. What does e-DigiVault do?", a: "e-DigiVault provides follow-up, coordination, and tracking services for government-related documents such as business registrations, land records, revenue documents, and personal IDs." },
                { q: "2. Will I get government documents directly from e-DigiVault?", a: "No. We only coordinate and follow up with the respective departments. All documents are issued only by the government authorities." },
                { q: "3. How does e-DigiVault ensure document security?", a: "We use a live banking-graded system with encrypted storage and unique OTP-based access for complete security." },
                { q: "4. What services do you cover?", a: "We assist with:\n• Revenue records (Khatha, RTC, Mutation, Tax Paid, EC, etc.)\n• Business records (MSME, Trade License, Land Conversion follow-up, etc.)\n• Personal records (Aadhar, PAN, Voter ID, DL, Birth/Death Certificate, Family Tree)" },
                { q: "5. How long will my work take?", a: "Timelines depend on government department processing, not e-DigiVault. We ensure continuous follow-ups until the process is completed." },
                { q: "6. Do you charge government fees?", a: "No. Government fees must be paid separately by the customer. e-DigiVault charges only for service, follow-up, and coordination." },
                { q: "7. Can I track my work status?", a: "Yes! You can track updates through our e-DigiVault platform and receive regular notifications." },
                { q: "8. What if my application gets rejected?", a: "e-DigiVault is not responsible for rejections, as decisions are made by government departments. However, we will assist with re-submission if possible (service charges may apply)." },
                { q: "9. How can I share documents with you?", a: "You can upload documents securely through our e-DigiVault portal or share them directly via our representative." },
                { q: "10. Do you offer doorstep service?", a: "Yes, for certain services we provide doorstep document collection and guidance (additional charges may apply)." },
              ].map((item, i) => (
                <div key={i} className="bg-secondary/50 rounded-lg p-3 space-y-1">
                  <p className="font-semibold text-foreground">{item.q}</p>
                  <p className="text-muted-foreground whitespace-pre-line">{item.a}</p>
                </div>
              ))}
            </div>
          </section>

          {/* Terms Section */}
          <section className="space-y-4">
            <h3 className="text-base font-bold text-primary border-b border-border pb-2">Terms & Conditions</h3>

            {[
              { t: "1. Service Nature", c: "e-DigiVault provides coordination, tracking, and follow-up services for government and legal documents. We do not create, issue, approve, or guarantee any government documents." },
              { t: "2. User Responsibility", c: "You agree to provide accurate details and submit all necessary documents required by the respective government departments to render the service." },
              { t: "3. Document Safety & Security", c: "Your documents stored in e-DigiVault are 100% safe, encrypted, and protected with OTP-based access. We strictly maintain confidentiality and do not share your documents with anyone without your permission." },
              { t: "4. Service Charges", c: "Our charges cover only service, liaison, legal and follow-up work. Government fees, penalties, or challans must be paid separately by the user. No refunds will be provided once services have initiated." },
              { t: "5. Processing Time", c: "Processing time depends upon government departments. e-DigiVault is not responsible for delays, rejection, portal issues, or policy changes by authorities." },
              { t: "6. Limited Liability", c: "e-DigiVault is not liable for:\n• Rejection or delay of applications or delay in work\n• Technical issues on government portals\n• Errors caused by incorrect information provided by the user" },
              { t: "7. Data Privacy", c: "All user data and documents are stored securely. We do not sell, disclose, or misuse any user information." },
              { t: "8. Consent for Communication", c: "By agreeing to these terms, you allow e-DigiVault to contact you via phone, SMS, WhatsApp, or email for service updates." },
              { t: "9. Verification of Documents", c: "The user is solely responsible for ensuring that all documents submitted are genuine, original, and legally valid. e-DigiVault is not responsible for any issues arising from forged, inaccurate, or incomplete documents." },
              { t: "10. Authorization for Follow-Up", c: "By using our services, you authorize e-DigiVault to follow up on your behalf with government departments, offices, agencies, and officials as required for your application." },
              { t: "11. Change of Government Rules", c: "Government policies, procedures, and document requirements may change at any time. e-DigiVault is not responsible for delays or additional requirements caused due to updated government rules." },
              { t: "12. No Guarantee of Approval", c: "Submission or follow-up does not guarantee approval. Final decisions are entirely made by the respective government authorities." },
              { t: "13. Communication Responsibility", c: "Users must provide correct mobile numbers, email IDs, and supporting documents. e-DigiVault is not responsible for delays caused due to unreachable contact details or missed communication." },
              { t: "14. Payment Terms", c: "All service charges must be paid before or during the processing of work. Incomplete payments may result in work being paused or discontinued." },
              { t: "15. Document Storage & Backup", c: "Documents uploaded to e-DigiVault are securely stored and encrypted. However, users are advised to maintain their own backup copies of essential documents." },
              { t: "16. Termination of Service", c: "e-DigiVault reserves the right to suspend or terminate services in cases of:\n• Misuse of the app\n• Submission of fake documents\n• Abusive or illegal behaviour\n• Failure to follow payment terms" },
              { t: "17. Updates to Terms", c: "e-DigiVault may update or modify these Terms & Conditions from time to time. Continued use of the app implies acceptance of updated terms." },
              { t: "18. Dispute Resolution", c: "Any disputes regarding services shall be resolved through discussion and written communication. Legal jurisdiction will be limited to Bangalore, Karnataka." },
              { t: "19. Third-Party Portal Dependency", c: "e-DigiVault relies on various government portals and department systems. We are not responsible for:\n• Server downtime\n• Portal errors\n• Slow processing\n• Temporary suspension of services by any government website or office." },
              { t: "20. Accuracy of Information", c: "Users must verify the accuracy of information entered into the app. Any errors in spelling, date of birth, property details, property documents or personal details provided by the user are not the responsibility of e-DigiVault." },
              { t: "21. User Identity Verification", c: "For security, e-DigiVault may ask for ID proof, mobile OTP verification, or additional details before processing any request. Failure to provide valid ID may lead to refusal of service." },
              { t: "22. Misuse of Services", c: "Users agree not to use e-DigiVault for:\n• Illegal activities\n• Fraudulent documentation\n• Misrepresentation of identity\n\nViolation may result in permanent account suspension." },
              { t: "23. Service Completion Definition", c: "A service is considered \"completed\" once our team has:\n• Submitted the application\n• Performed follow-up\n• Provided status updates\n• Coordinated with the respective office\n\nEven if the final approval is pending from the government department." },
              { t: "24. No Legal Representation", c: "e-DigiVault does not act as a lawyer, government agent, or legal representative. We only provide coordination and supportive services." },
              { t: "25. Data Retention Policy", c: "Your documents will remain stored in the encrypted e-DigiVault system until:\n• You request deletion, or\n• Your account becomes inactive for a long period (as per company policy)" },
              { t: "26. Account Security", c: "You are responsible for keeping your login credentials safe. Do not share OTPs, passwords, or access with anyone. e-DigiVault is not liable for misuse of your account due to shared credentials." },
              { t: "27. Service Modifications", c: "e-DigiVault reserves the right to:\n• Modify services\n• Add new features\n• Discontinue features\n\nwithout prior notice, to improve functionality." },
              { t: "28. User Conduct", c: "Users must behave respectfully with e-DigiVault staff. Abusive language, threats, or misconduct will lead to service termination and legal action." },
              { t: "29. Digital Signature & Approval", c: "Ticking the checkbox and submitting the form is considered a legally valid digital acceptance of the Terms & Conditions under IT Act, 2000 (India)." },
              { t: "30. Document Sharing Consent", c: "By using our services, you consent to e-DigiVault sharing your documents only with the relevant government departments strictly for processing purposes." },
              { t: "31. Limited Technical Support", c: "Support is provided during business hours only. Emergency or off-hour support may require additional time." },
              { t: "32. No Service Guarantee for Incomplete Documents", c: "If the user submits partial documents or incorrect formats, service delay is unavoidable and not the fault of e-DigiVault." },
              { t: "33. Confidentiality Assurance", c: "All staff members are bound by internal confidentiality agreements. Your documents are never printed, shared, copied, or downloaded unless required for processing." },
              { t: "34. Use of App", c: "You agree not to misuse the app, upload false documents, or engage in any kind of fraudulent activity." },
              { t: "35. Agreement Acceptance", c: "By ticking the checkbox, you confirm that you have read, understood, and agreed to all the above Terms & Conditions of e-DigiVault." },
            ].map((item, i) => (
              <div key={i} className="space-y-1">
                <p className="font-semibold">{item.t}</p>
                <p className="text-muted-foreground whitespace-pre-line">{item.c}</p>
              </div>
            ))}
          </section>

          {/* Payment Terms */}
          <section className="space-y-4">
            <h3 className="text-base font-bold text-primary border-b border-border pb-2">Payment Terms & Conditions</h3>

            {[
              { t: "1. No Responsibility for Failed or Declined Transactions", c: "e-DigiVault is not responsible for payment failures, declined transactions, or unsuccessful payments caused due to:\n• Bank server issues\n• Insufficient balance\n• Incorrect card/UPI details\n• Network failure\n• Payment gateway errors\n• Technical issues during the transaction\n\nIf a transaction fails, the user must retry the payment or contact their respective bank/payment provider." },
              { t: "2. Non-Refundable Service Charges", c: "Once the payment is successfully made and the service process has started:\n• Service charges are non-refundable\n• Fee will not be refunded for delays caused by government departments or portals\n• Any re-submission or additional work may require fresh service charges" },
              { t: "3. Duplicate Payments", c: "If the user makes a duplicate payment by mistake:\n• Proof of transaction must be provided\n• Refund/adjustment will be processed only after verification by our accounts team\n• Processing time may take 7–10 working days" },
              { t: "4. Government Fees Not Included", c: "Payments made here are only for e-DigiVault service charges. All government fees, department fees, penalties, or challans must be paid separately by the customer." },
              { t: "5. Secure Payment Gateway", c: "All online transactions are processed through a secure third-party payment gateway. e-DigiVault does not store any card, UPI, bank, or financial details." },
              { t: "6. Payment Confirmation", c: "A payment is considered successful only when:\n• The transaction status shows \"Successful\"\n• You receive a confirmation message/receipt from e-DigiVault\n\nIf you do not receive confirmation but money has been deducted, please allow 24–48 hours for automatic bank reversal." },
              { t: "7. Work Will Begin Only After Payment", c: "Your application processing, follow-up, and coordination will start only after successful payment confirmation." },
              { t: "8. No Liability for Delayed Bank Settlements", c: "Delays caused by bank settlements, NEFT/IMPS delays, or UPI settlements are not the responsibility of e-DigiVault." },
              { t: "9. User Responsibility for Correct Information", c: "Users must verify that the payment amount, order details, and personal details are correct before making payment. e-DigiVault is not responsible for errors caused by incorrect information entered by the user." },
              { t: "10. Acceptance of Payment Terms", c: "By proceeding to pay, you confirm that you have read and agreed to:\n• e-DigiVault Payment Terms & Conditions\n• Standard e-DigiVault Terms & Conditions\n• Government dependency and limitations of service" },
            ].map((item, i) => (
              <div key={i} className="space-y-1">
                <p className="font-semibold">{item.t}</p>
                <p className="text-muted-foreground whitespace-pre-line">{item.c}</p>
              </div>
            ))}
          </section>

          <div className="bg-primary/10 rounded-lg p-4 text-center">
            <p className="text-xs text-muted-foreground">
              I Accept and Agree to all Terms & Conditions of e-DigiVault, including service limitations, data policies, security rules, and government dependency conditions. I understand that my documents are stored securely with encrypted and OTP-protected access.
            </p>
          </div>
        </div>
      </ScrollArea>
    </div>
  );
};

export default TermsAndConditions;
