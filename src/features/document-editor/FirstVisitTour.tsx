'use client';

import { useEffect, useState } from 'react';
import { Dialog } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Compass } from 'lucide-react';

const STORAGE_KEY = 'attuned:tour:applicationWorkspace:v1';

const STEPS: { title: string; body: string }[] = [
  {
    title: 'Welcome to the Application Builder',
    body: 'Each application walks through the same flow: see your match against the job, generate a tailored resume and cover letter, edit them, pick a design, then export. This quick tour points out the parts that are easy to miss.',
  },
  {
    title: 'Overview & Match Score',
    body: 'The Overview tab shows how your current resume stacks up against this job, with gaps and recommendations. Generating a tailored resume and re-checking the match shows how much it improved.',
  },
  {
    title: 'Editor: click the preview to edit',
    body: 'In the Editor tab, you can click directly on any section of the live preview -- a bullet, your skills, an achievement -- to jump straight to editing it. No need to hunt through the side nav.',
  },
  {
    title: 'Sections: reorder and toggle',
    body: 'Above the editor, "Sections" lets you show/hide and reorder resume sections (Summary, Experience, Achievements, etc). We suggest an order based on your strongest evidence, but it’s entirely your call.',
  },
  {
    title: 'Resume + Cover Letter',
    body: 'If you generated both, use the Resume / Cover Letter tabs at the top of the editor to switch between them -- each has its own Save Changes button and AI assist.',
  },
  {
    title: 'Design & Export',
    body: 'The Design tab lets you preview a template on real content before choosing it. Export gives you PDF, DOCX, or a full application package, using whatever sections and order you set up in the editor.',
  },
];

export function FirstVisitTour() {
  const [open, setOpen] = useState(false);
  const [step, setStep] = useState(0);

  useEffect(() => {
    try {
      if (!localStorage.getItem(STORAGE_KEY)) setOpen(true);
    } catch {
      // localStorage unavailable (private browsing, etc.) -- just skip the tour rather than erroring.
    }
  }, []);

  function dismiss() {
    setOpen(false);
    try {
      localStorage.setItem(STORAGE_KEY, 'dismissed');
    } catch {
      // best-effort only
    }
  }

  const current = STEPS[step];
  const isLast = step === STEPS.length - 1;

  return (
    <Dialog open={open} onClose={dismiss} className="max-w-md">
      <div className="space-y-4">
        <div className="flex items-center gap-2 text-primary">
          <Compass className="h-5 w-5" />
          <span className="text-xs font-medium uppercase tracking-wide">Step {step + 1} of {STEPS.length}</span>
        </div>
        <div>
          <h3 className="text-lg font-semibold">{current.title}</h3>
          <p className="mt-1.5 text-sm text-muted-foreground">{current.body}</p>
        </div>
        <div className="flex items-center justify-between pt-2">
          <button type="button" onClick={dismiss} className="text-sm text-muted-foreground underline-offset-4 hover:underline">
            Skip tour
          </button>
          <div className="flex gap-2">
            {step > 0 && (
              <Button size="sm" variant="outline" onClick={() => setStep((s) => s - 1)}>Back</Button>
            )}
            <Button size="sm" onClick={() => (isLast ? dismiss() : setStep((s) => s + 1))}>
              {isLast ? 'Got it' : 'Next'}
            </Button>
          </div>
        </div>
      </div>
    </Dialog>
  );
}
