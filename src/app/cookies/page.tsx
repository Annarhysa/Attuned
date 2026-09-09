import { LegalPage, LegalSection } from '@/components/legal-page';

export const metadata = { title: 'Cookie Policy — Attuned' };

export default function CookiePolicyPage() {
  return (
    <LegalPage title="Cookie Policy" updated="September 2026">
      <LegalSection title="Essential cookies only">
        <p>
          Attuned uses a single essential cookie: the session cookie set by our authentication system, which keeps
          you signed in between page loads. Its lifetime depends on whether you selected &quot;Remember me&quot; at
          login — otherwise it expires when you close your browser.
        </p>
      </LegalSection>

      <LegalSection title="No tracking or advertising cookies">
        <p>
          We don&apos;t use third-party analytics, advertising, or tracking cookies of any kind.
        </p>
      </LegalSection>

      <LegalSection title="Theme preference">
        <p>
          Your light/dark mode choice is stored in your browser&apos;s local storage, not a cookie. It stays on
          your device and is never sent to our servers.
        </p>
      </LegalSection>

      <LegalSection title="Managing cookies">
        <p>
          Because the session cookie is required to keep you signed in, there&apos;s no separate opt-out for it —
          blocking or clearing cookies in your browser will simply sign you out and require logging in again.
        </p>
      </LegalSection>
    </LegalPage>
  );
}
