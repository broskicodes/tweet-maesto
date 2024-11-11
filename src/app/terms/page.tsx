import { Header } from "@/components/layout/header";
import Footer from "@/components/layout/footer";

export default function TermsOfService() {
  return (
    <main className="min-h-screen flex flex-col">
      <Header />
      <div className="container mx-auto py-8 grow">
        <h1 className="text-3xl font-bold mb-6">Terms of Service</h1>

        <p className="mb-4">
          {
            'Builder Epidemic ("The Company") is granting access to the Builder Epidemic product ("The Product") to you as the individual, company, or legal entity ("The Customer") on the condition that you accept all of the terms of this ("Terms of Service", "TOS") as defined below. This TOS constitutes a legal and enforceable contract between The Customer and The Company. By using Builder Epidemic and related services you implicitly agree to this Terms of Service. If The Customer does not agree to this Terms of Service, they should make no further use of The Product.'
          }
        </p>

        <h2 className="text-2xl font-semibold mt-6 mb-2">Ownership of Platform</h2>
        <p className="mb-4">
          The Customer acknowledges that the Builder Epidemic platform is a product and use of The
          Product does not convey any rights to intellectual property of the platform itself.
        </p>

        <h2 className="text-2xl font-semibold mt-6 mb-2">Data Privacy</h2>
        <p className="mb-4">
          By engaging with The Product, The Customer consents to Builder Epidemic storing account
          information on their behalf. Builder Epidemic is compliant with GDPR regulatory
          requirements. If you intend to initiate a Right of Access Request please contact our team
          at the following email hello@builderepidemic.com.
        </p>

        <h2 className="text-2xl font-semibold mt-6 mb-2">Term</h2>
        <p className="mb-4">
          {
            "This Terms of Service will be effective upon The Customer's first access of The Product and shall remain in force during the applicable throughout The Customer's continued use of The Product, as applicable."
          }
        </p>

        <h2 className="text-2xl font-semibold mt-6 mb-2">Governing Law and Jurisdiction</h2>
        <p className="mb-4">
          The governing jurisdiction for this contract is Estonia. Each Party agrees to the
          applicable governing law below without regard to choice or conflicts of law rules, and to
          the exclusive jurisdiction of the applicable courts below with respect to any dispute,
          claim, action, suit or proceeding (including non-contractual disputes or claims) arising
          out of or in connection with this Terms of Service, or its subject matter or formation. To
          the extent not prohibited by applicable law, each of the Parties hereby irrevocably waives
          any and all right to trial by jury in any legal proceeding arising out of or related to
          this Terms of Service.
        </p>

        <h2 className="text-2xl font-semibold mt-6 mb-2">Waiver</h2>
        <p className="mb-4">
          The Customer agrees that neither they, nor any person, organization, or any other entity
          acting on his behalf will file, charge, claim, sue Builder Epidemic or permit to be filed,
          charged or claimed, any action for damages or other relief (including injunctive,
          declaratory, monetary relief or other) against Builder Epidemic, involving any matter
          occurring in the past up to the date of this Terms of Service or involving any continuing
          effects of actions or practices which arose prior to the date of this Terms of Service, or
          involving and based upon any claims, demands, causes of action, obligations, damages or
          liabilities which are the subject of these Terms of Service.
        </p>
      </div>
      <Footer />
    </main>
  );
}
