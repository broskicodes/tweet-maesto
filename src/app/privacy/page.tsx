import { Header } from "@/components/layout/header";
import Footer from "@/components/layout/footer";

export default function PrivacyPolicy() {
  return (
    <main className="min-h-screen flex flex-col">
      <Header />
      <div className="container mx-auto py-8 grow">
        <h1 className="text-3xl font-bold mb-6">Privacy Policy</h1>

        <p className="mb-4">
          <strong>Effective Date: October 24, 2024</strong>
        </p>

        <p className="mb-4">
          {
            'Builder Epidemic ("The Company") are committed to protecting your privacy. This Privacy Policy explains how we collect, use, disclose, and safeguard your information when you use our services, including our website, applications, and related services (collectively, "The Product"). By accessing or using The Product, you agree to this Privacy Policy.'
          }
        </p>

        <h2 className="text-2xl font-semibold mt-6 mb-2">Information We Collect</h2>
        <p className="mb-4">
          When you sign up for Builder Epidemic via OAuth, we attempt to collect the following
          personal information:
        </p>
        <ul className="list-disc list-inside mb-4">
          <li>Email Address: To create and manage your account, and for communication purposes.</li>
          <li>Name: To personalize your profile and for identification purposes.</li>
          <li>Profile Picture: To enhance your profile and provide a personalized experience.</li>
        </ul>
        <p>
          If available, we store this information in our database to create your new profile,
          pre-filled with the data from the OAuth provider.
        </p>

        <h2 className="text-2xl font-semibold mt-6 mb-2">Use of Information</h2>
        <p className="mb-4">We use the information we collect for the following purposes:</p>
        <ul className="list-disc list-inside mb-4">
          <li>Account Creation and Management: To create and manage your user account.</li>
          <li>
            Personalization: To personalize your experience and provide you with tailored content.
          </li>
          <li>
            Communication: To communicate with you about your account, including updates, security
            alerts, and administrative messages.
          </li>
          <li>
            Improvement of Services: To improve our services, troubleshoot issues, and analyze
            usage.
          </li>
        </ul>

        <h2 className="text-2xl font-semibold mt-6 mb-2">Data Storage and Security</h2>
        <p className="mb-4">
          We store your personal information in our secure database. We use industry-standard
          security measures to protect your data from unauthorized access, disclosure, alteration,
          and destruction. Despite these measures, we cannot guarantee absolute security.
        </p>

        <h2 className="text-2xl font-semibold mt-6 mb-2">User Rights</h2>
        <p className="mb-4">
          <strong>Access and Control:</strong> You can access your personal information at any time
          through your account settings.
        </p>
        <p className="mb-4">
          <strong>Data Deletion:</strong> You can request the deletion of your profile by contacting
          our support team at hello@builderepidemic.com. Upon receiving your request, we will delete
          your profile and personal information from our database.
        </p>

        <h2 className="text-2xl font-semibold mt-6 mb-2">Disclosure of Information</h2>
        <p className="mb-4">
          We do not sell, trade, or otherwise transfer your personal information to outside parties
          without your consent, except in the following circumstances:
        </p>
        <ul className="list-disc list-inside mb-4">
          <li>
            Legal Requirements: If required by law or in response to valid requests by public
            authorities (e.g., a court or a government agency).
          </li>
          <li>
            Protection of Rights: To protect and defend the rights or property of Builder Epidemic,
            including enforcing our Terms of Service.
          </li>
        </ul>

        <h2 className="text-2xl font-semibold mt-6 mb-2">Third-Party Services</h2>
        <p className="mb-4">
          The Product may contain links to third-party websites and services. We are not responsible
          for the privacy practices or the content of these third parties. We encourage you to
          review the privacy policies of any third-party services you use.
        </p>

        <h2 className="text-2xl font-semibold mt-6 mb-2">{"Children's Privacy"}</h2>
        <p className="mb-4">
          Our services are not intended for people under the age of 18. We do not knowingly collect
          personal information from people under 18.
        </p>

        <h2 className="text-2xl font-semibold mt-6 mb-2">Changes to This Privacy Policy</h2>
        <p className="mb-4">
          We may update this Privacy Policy from time to time to reflect changes in our practices or
          for other operational, legal, or regulatory reasons. We will notify you of any changes by
          posting the new Privacy Policy on our website. Your continued use of The Product after any
          such changes constitutes your acceptance of the new Privacy Policy.
        </p>

        <h2 className="text-2xl font-semibold mt-6 mb-2">Contact Us</h2>
        <p className="mb-4">
          If you have any questions about this Privacy Policy, please contact us by email at:
          hello@builderepidemic.com
        </p>
      </div>
      <Footer />
    </main>
  );
}
