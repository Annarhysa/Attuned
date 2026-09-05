'use client';

import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Compass, X } from 'lucide-react';

const STORAGE_KEY = 'attuned:tour:applicationWorkspace:v2';

interface TourStep {
  /** Switches to this tab before showing the step, so the target element actually exists. */
  tabKey?: string;
  /** CSS selector (a data-tour attribute) for the real element to spotlight. Omitted for the intro step, which is just centered. */
  target?: string;
  title: string;
  body: string;
}

const STEPS: TourStep[] = [
  {
    title: 'Welcome to the Application Builder',
    body: 'This tour points at the real controls as you go -- each step highlights exactly what it\'s talking about. Overview -> Generate -> Editor -> Design -> Export is the usual path.',
  },
  {
    tabKey: 'overview',
    target: 'match-score',
    title: 'Your match score',
    body: 'This shows how your current resume stacks up against this job. Once you generate a tailored version, it shows the before/after side by side.',
  },
  {
    tabKey: 'overview',
    target: 'generate-buttons',
    title: 'Pick what to generate',
    body: 'Choose resume, cover letter, or both right here -- it carries your choice straight into the Generate tab instead of asking twice.',
  },
  {
    tabKey: 'keywords',
    target: 'keyword-map',
    title: 'Keyword map',
    body: 'This is what your match score is built from -- every requirement the job mentions, and whether your profile backs it up. Gaps are listed first; use the button at the bottom to generate a resume that addresses them.',
  },
  {
    tabKey: 'editor',
    target: 'doc-tabs',
    title: 'Resume and cover letter',
    body: 'If you generated both, switch between them here. Each has its own Save Changes and AI assist.',
  },
  {
    tabKey: 'editor',
    target: 'resume-preview',
    title: 'Edit directly on the preview',
    body: 'Click any section -- a bullet, your skills, an achievement -- to jump straight to editing it. Hover a section to drag it into a new order or hide it from the resume entirely.',
  },
  {
    tabKey: 'design',
    target: 'design-grid',
    title: 'Preview before you pick',
    body: 'Click a template to see a full sample resume in that design before choosing it -- not just a color swatch.',
  },
  {
    tabKey: 'export',
    target: 'export-panel',
    title: 'Export',
    body: 'PDF, DOCX, or a full application package -- all using whatever sections, order, and design you set up in the earlier tabs.',
  },
];

export function FirstVisitTour({ currentTab, onNavigateTab }: { currentTab: string; onNavigateTab: (tab: string) => void }) {
  const [active, setActive] = useState(false);
  const [step, setStep] = useState(0);
  const [rect, setRect] = useState<DOMRect | null>(null);

  useEffect(() => {
    try {
      if (!localStorage.getItem(STORAGE_KEY)) setActive(true);
    } catch {
      // localStorage unavailable -- just skip the tour rather than erroring.
    }
  }, []);

  const current = STEPS[step];

  useEffect(() => {
    if (!active) return;
    if (current.tabKey && current.tabKey !== currentTab) {
      onNavigateTab(current.tabKey);
      return; // wait for the tab switch to land, then the next effect run measures the target
    }
    if (!current.target) {
      setRect(null);
      return;
    }
    let raf = 0;
    let tries = 0;
    const measure = () => {
      const el = document.querySelector(`[data-tour="${current.target}"]`);
      if (el) {
        el.scrollIntoView({ behavior: 'smooth', block: 'center' });
        setRect(el.getBoundingClientRect());
      } else if (tries < 20) {
        // Tab content can take a render pass to mount -- retry briefly.
        tries += 1;
        raf = requestAnimationFrame(measure);
      }
    };
    raf = requestAnimationFrame(measure);
    return () => cancelAnimationFrame(raf);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [active, step, currentTab]);

  useEffect(() => {
    if (!active || !current.target) return;
    const onScrollOrResize = () => {
      const el = document.querySelector(`[data-tour="${current.target}"]`);
      if (el) setRect(el.getBoundingClientRect());
    };
    window.addEventListener('scroll', onScrollOrResize, true);
    window.addEventListener('resize', onScrollOrResize);
    return () => {
      window.removeEventListener('scroll', onScrollOrResize, true);
      window.removeEventListener('resize', onScrollOrResize);
    };
  }, [active, current.target]);

  function dismiss() {
    setActive(false);
    try {
      localStorage.setItem(STORAGE_KEY, 'dismissed');
    } catch {
      // best-effort only
    }
  }

  if (!active) return null;

  const isLast = step === STEPS.length - 1;
  const pad = 8;

  // Tooltip position: below the spotlight if there's room, else above; centered horizontally on it but kept on-screen.
  const tooltipWidth = 320;
  let tooltipTop = rect ? rect.bottom + pad + 12 : window.innerHeight / 2 - 80;
  let tooltipLeft = rect ? Math.min(Math.max(rect.left, 16), window.innerWidth - tooltipWidth - 16) : window.innerWidth / 2 - tooltipWidth / 2;
  if (rect && tooltipTop + 180 > window.innerHeight) tooltipTop = Math.max(16, rect.top - 12 - 180);

  return (
    <div className="fixed inset-0 z-[100]">
      {/* Backdrop with a spotlight cutout around the target (or full backdrop for the centered intro step). */}
      <div
        className="fixed inset-0 transition-all duration-300"
        style={
          rect
            ? {
                boxShadow: `0 0 0 9999px rgba(15,23,42,0.55)`,
                position: 'fixed',
                top: rect.top - pad,
                left: rect.left - pad,
                width: rect.width + pad * 2,
                height: rect.height + pad * 2,
                borderRadius: 10,
                pointerEvents: 'none',
              }
            : { background: 'rgba(15,23,42,0.55)' }
        }
      />
      {rect && <div className="pointer-events-none fixed rounded-lg ring-2 ring-primary" style={{ top: rect.top - pad, left: rect.left - pad, width: rect.width + pad * 2, height: rect.height + pad * 2 }} />}

      <div
        className="fixed z-[101] w-80 space-y-3 rounded-xl border border-border bg-background p-4 shadow-xl"
        style={{ top: tooltipTop, left: tooltipLeft }}
      >
        <div className="flex items-start justify-between gap-2">
          <div className="flex items-center gap-2 text-primary">
            <Compass className="h-4 w-4" />
            <span className="text-xs font-medium uppercase tracking-wide">Step {step + 1} of {STEPS.length}</span>
          </div>
          <button type="button" onClick={dismiss} className="text-muted-foreground hover:text-foreground" aria-label="Close tour">
            <X className="h-4 w-4" />
          </button>
        </div>
        <div>
          <h3 className="text-sm font-semibold">{current.title}</h3>
          <p className="mt-1 text-sm text-muted-foreground">{current.body}</p>
        </div>
        <div className="flex items-center justify-between pt-1">
          <button type="button" onClick={dismiss} className="text-xs text-muted-foreground underline-offset-4 hover:underline">
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
    </div>
  );
}
