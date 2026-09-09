import Link from 'next/link';
import { LegalPage, LegalSection } from '@/components/legal-page';

export const metadata = { title: 'About — Attuned' };

export default function AboutPage() {
  return (
    <LegalPage title="About Attuned" updated="September 2026">
      <LegalSection title="What it is">
        <p>
          Attuned turns a job description into a resume and cover letter tailored to that specific role — matched
          against your real experience with evidence, not generic keyword-stuffing. Anything a job asks for that
          isn&apos;t backed by your profile is flagged as a gap, never invented.
        </p>
      </LegalSection>

      <LegalSection title="Maintainer">
        <p>Built and maintained by Annarhysa Albert.</p>
      </LegalSection>

      <LegalSection title="Open source">
        <p>
          Attuned is released under the MIT License — see the full text on the{' '}
          <Link href="/license" className="text-foreground underline underline-offset-2">License</Link> page.
        </p>
      </LegalSection>

      <LegalSection title="Legal">
        <p>
          <Link href="/privacy" className="text-foreground underline underline-offset-2">Privacy Policy</Link>
          {' · '}
          <Link href="/cookies" className="text-foreground underline underline-offset-2">Cookie Policy</Link>
        </p>
      </LegalSection>
    </LegalPage>
  );
}
