import { LegalPage, LegalSection } from '@/components/legal-page';

export const metadata = { title: 'Privacy Policy — Attuned' };

export default function PrivacyPolicyPage() {
  return (
    <LegalPage title="Privacy Policy" updated="September 2026">
      <LegalSection title="Overview">
        <p>
          Attuned helps you tailor a resume and cover letter to a specific job description. This policy explains
          what information we collect, how it&apos;s used, and the choices you have. Attuned is an independently
          maintained project currently at v1.0 — this policy will be updated as the product evolves.
        </p>
      </LegalSection>

      <LegalSection title="What we collect">
        <ul className="list-disc space-y-1 pl-5">
          <li>Account details: your email address and a securely hashed password.</li>
          <li>Your candidate profile: resume content you upload or enter, work history, education, skills, and projects.</li>
          <li>Job data: job descriptions you paste or upload, and the applications you create from them.</li>
          <li>Generated content: tailored resumes and cover letters produced from the above.</li>
        </ul>
      </LegalSection>

      <LegalSection title="How we use it">
        <p>
          Your profile and job data are used to compute a match score, identify gaps, and generate tailored
          documents. By default, this analysis runs entirely on a local heuristic engine — nothing leaves our
          servers. If you optionally connect a third-party AI provider (e.g. OpenAI or Anthropic), the relevant
          text is sent to that provider under its own privacy policy, and only when you&apos;ve explicitly enabled it.
        </p>
        <p>
          The AI is only ever permitted to use information already present in your candidate profile — it does not
          fabricate experience, skills, or metrics you haven&apos;t provided.
        </p>
      </LegalSection>

      <LegalSection title="What we don't do">
        <ul className="list-disc space-y-1 pl-5">
          <li>We don&apos;t sell or rent your personal data.</li>
          <li>We don&apos;t share your resume or job data with third parties for advertising.</li>
          <li>We don&apos;t use your data to train third-party models.</li>
        </ul>
      </LegalSection>

      <LegalSection title="Storage">
        <p>
          Account and application data is stored in a Postgres database. Uploaded files (e.g. resume PDFs/DOCX) are
          stored via the app&apos;s configured storage driver, either local disk or S3-compatible object storage.
        </p>
      </LegalSection>

      <LegalSection title="Your control over your data">
        <p>
          You can review and edit your profile at any time from your dashboard. You can permanently delete your
          account and all associated data — profile, resumes, job data, and generated documents — from
          Settings → Danger Zone. This action cannot be undone.
        </p>
      </LegalSection>

      <LegalSection title="Contact">
        <p>
          For privacy questions, reach out via the project&apos;s GitHub repository — see the
          <a href="/about" className="mx-1 text-foreground underline underline-offset-2">About</a>
          page for details.
        </p>
      </LegalSection>
    </LegalPage>
  );
}
