import fs from 'fs';
import path from 'path';
import { LegalPage } from '@/components/legal-page';

export const metadata = { title: 'License — Attuned' };

export default function LicensePage() {
  const licenseText = fs.readFileSync(path.join(process.cwd(), 'LICENSE'), 'utf-8');

  return (
    <LegalPage title="License" updated="September 2026">
      <p className="text-muted-foreground">Attuned is open source, released under the MIT License:</p>
      <pre className="whitespace-pre-wrap rounded-lg border border-border bg-secondary/30 p-4 font-mono text-xs leading-relaxed text-foreground">
        {licenseText}
      </pre>
    </LegalPage>
  );
}
