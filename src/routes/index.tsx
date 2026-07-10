import { createFileRoute, useNavigate } from "@tanstack/react-router";
import {
  ArrowRight,
  Check,
  CheckCircle2,
  Clock,
  FileText,
  Mail,
  MessageSquare,
  Moon,
  Settings2,
  Share2,
  ShieldCheck,
  Sparkles,
  Sun,
  User,
  Wand2,
  Workflow,
  X,
  XCircle,
  Zap,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";

import { ApiError, api } from "../api";
import { CONSTRUCTION_SUBCATEGORIES, INTEGRATIONS } from "../lib/catalog";
import type { ConstructionSubcategory } from "../lib/catalog";
import { IntegrationLogo } from "../components/common/IntegrationLogo";
import { LogoLockup } from "../components/common/LogoLockup";
import { ThemeProvider, useTheme } from "../lib/theme";
import { cn } from "../lib/utils";

export const Route = createFileRoute("/")({
  component: Index,
});

// ---------------- Copilot library ----------------

type CopilotCategory = "RFIs & Change Orders" | "Field Operations" | "Documents & Cost Control";

const COPILOT_CATEGORIES: CopilotCategory[] = [
  "RFIs & Change Orders",
  "Field Operations",
  "Documents & Cost Control",
];

type Copilot = {
  category: CopilotCategory;
  title: string;
  goal: string;
  persona: string;
  approver: string;
  trigger: string;
  actions: string[];
  value: string[];
  // The live trace shown in the modal — each line mirrors what the copilot does.
  trace: { kind: "run" | "ok" | "wait" | "done"; text: string }[];
  runtime: string;
};

const COPILOTS: Copilot[] = [
  {
    category: "RFIs & Change Orders",
    title: "RFI Copilot",
    goal: "Draft technical responses to contractor RFIs using your drawings, specs, and prior answers.",
    persona: "Project Engineer",
    approver: "Project Manager",
    trigger: "A contractor submits an RFI by email or Teams.",
    actions: [
      "Reads the incoming question and any attachments",
      "Pulls the relevant drawing sheets and spec sections",
      "Checks how similar RFIs were answered on this project",
      "Writes a technical summary of the issue",
      "Drafts a response ready for review",
    ],
    value: [
      "Faster answers back to the field",
      "Fewer schedule delays waiting on a response",
      "A written record tied to the right drawing revision",
      "Consistent, accurate technical answers",
    ],
    runtime: "4m 02s",
    trace: [
      { kind: "run", text: "starting connector…" },
      { kind: "ok", text: "reading Teams message" },
      { kind: "ok", text: "drawing sheet A-204 retrieved" },
      { kind: "ok", text: "matched 2 prior RFIs on this scope" },
      { kind: "ok", text: "technical summary ready" },
      { kind: "ok", text: "draft response ready" },
      { kind: "wait", text: "waiting on approval (Project Manager)" },
      { kind: "ok", text: "approved by K. Malik · reply sent" },
      { kind: "done", text: "done in 4m 02s" },
    ],
  },
  {
    category: "RFIs & Change Orders",
    title: "Change Order Copilot",
    goal: "Estimate the cost and schedule impact of a change request before anyone signs off.",
    persona: "Project Manager",
    approver: "Owner's Representative",
    trigger: "A contractor or owner submits a change request.",
    actions: [
      "Reads the requested change and supporting documents",
      "Compares it against the current budget and schedule",
      "Calculates the likely cost impact by line item",
      "Estimates any schedule delay",
      "Writes a plain-language change order summary",
    ],
    value: [
      "Faster change order turnaround",
      "More defensible cost and schedule estimates",
      "Fewer disputes with owners and subcontractors",
      "Tighter budget control across the project",
    ],
    runtime: "3m 40s",
    trace: [
      { kind: "run", text: "starting connector…" },
      { kind: "ok", text: "reading change request" },
      { kind: "ok", text: "compared vs budget + schedule" },
      { kind: "ok", text: "cost impact: +$18,400" },
      { kind: "ok", text: "schedule impact: +4 days" },
      { kind: "wait", text: "waiting on approval (Owner's Rep)" },
      { kind: "ok", text: "approved · CO logged" },
      { kind: "done", text: "done in 3m 40s" },
    ],
  },
  {
    category: "Field Operations",
    title: "Daily Site Report Copilot",
    goal: "Turn the day's photos, notes, and task updates into a finished progress report.",
    persona: "Site Engineer",
    approver: "Project Manager",
    trigger: "End of the workday, automatically.",
    actions: [
      "Collects the day's emails and site photos",
      "Reads handwritten notes on photos",
      "Pulls task and equipment status",
      "Summarizes work completed and any delays",
      "Flags any safety issues that came up",
    ],
    value: [
      "Minutes instead of an hour of paperwork",
      "Consistent daily reporting across every site",
      "Earlier visibility into delays",
      "Better safety tracking",
    ],
    runtime: "2m 08s",
    trace: [
      { kind: "run", text: "starting connector…" },
      { kind: "ok", text: "collected 24 site photos" },
      { kind: "ok", text: "handwritten notes parsed" },
      { kind: "ok", text: "task + equipment status pulled" },
      { kind: "ok", text: "1 safety issue flagged" },
      { kind: "ok", text: "progress report drafted" },
      { kind: "wait", text: "waiting on approval (Project Manager)" },
      { kind: "done", text: "done in 2m 08s" },
    ],
  },
  {
    category: "Documents & Cost Control",
    title: "Subcontractor Invoice Verification",
    goal: "Check subcontractor invoices against the purchase order and completed work before approving payment.",
    persona: "Project Accountant",
    approver: "Finance Manager",
    trigger: "A subcontractor sends an invoice.",
    actions: [
      "Reads invoice details automatically",
      "Matches it to the original purchase order",
      "Compares it against completed work on site",
      "Flags any overbilling",
      "Writes a short discrepancy report",
    ],
    value: [
      "Less risk of overpaying",
      "Faster invoice-to-payment time",
      "Stronger subcontractor relationships",
      "A clean audit trail",
    ],
    runtime: "2m 55s",
    trace: [
      { kind: "run", text: "starting connector…" },
      { kind: "ok", text: "reading subcontractor invoice" },
      { kind: "ok", text: "matched to PO-2214" },
      { kind: "ok", text: "compared vs completed work" },
      { kind: "ok", text: "overbilling flagged: 2 line items" },
      { kind: "wait", text: "waiting on approval (Finance Manager)" },
      { kind: "done", text: "done in 2m 55s" },
    ],
  },
  {
    category: "Documents & Cost Control",
    title: "Project Document Copilot",
    goal: "Find the answer buried in specs, submittals, and correspondence — in seconds, with the source cited.",
    persona: "Project Engineer",
    approver: "Project Manager",
    trigger: "A team member asks a question about specs, submittals, or contracts.",
    actions: [
      "Searches specs, submittals, RFIs, and contracts across the project",
      "Finds the passage that actually answers the question",
      "Cites the exact document, section, and page",
      "Summarizes multi-document answers in plain language",
    ],
    value: [
      "Minutes instead of hours searching PDFs",
      "Every answer traceable to a source document",
      "Less rework from acting on outdated versions",
      "Faster onboarding for new site staff",
    ],
    runtime: "1m 15s",
    trace: [
      { kind: "run", text: "starting connector…" },
      { kind: "ok", text: "reading query: “fire rating for corridor walls, level 3”" },
      { kind: "ok", text: "matched Spec Section 07 84 00" },
      { kind: "ok", text: "matched Submittal #0142 (approved)" },
      { kind: "ok", text: "answer drafted with citations" },
      { kind: "wait", text: "waiting on approval (Project Manager)" },
      { kind: "ok", text: "approved · shared with the team" },
      { kind: "done", text: "done in 1m 15s" },
    ],
  },
  {
    category: "Documents & Cost Control",
    title: "Drawing & Blueprint Copilot",
    goal: "Read drawing sets and answer questions about dimensions, details, and revisions without opening a viewer.",
    persona: "Site Engineer",
    approver: "Project Manager",
    trigger: "A field question comes up about a drawing detail or dimension.",
    actions: [
      "Reads sheets, details, and title blocks across the drawing set",
      "Finds the specific detail or dimension being asked about",
      "Flags when a newer drawing revision supersedes the one in hand",
      "Cross-references related sheets across disciplines",
      "Answers in plain language with the sheet and revision cited",
    ],
    value: [
      "Fewer field errors from working off an outdated sheet",
      "Faster clash checks between trades",
      "Less time spent hunting through drawing sets",
      "A clear citation trail for every answer",
    ],
    runtime: "1m 32s",
    trace: [
      { kind: "run", text: "starting connector…" },
      { kind: "ok", text: "drawing set A-Series loaded (Rev 4)" },
      { kind: "ok", text: "found detail 5/A-501" },
      { kind: "ok", text: "flagged: field copy is Rev 3, superseded" },
      { kind: "ok", text: "answer drafted with sheet + revision cited" },
      { kind: "wait", text: "waiting on approval (Project Manager)" },
      { kind: "ok", text: "approved · answer sent to site" },
      { kind: "done", text: "done in 1m 32s" },
    ],
  },
  {
    category: "Field Operations",
    title: "Schedule Impact Copilot",
    goal: "Check how a delay, RFI, or change request ripples through the master schedule before it becomes a claim.",
    persona: "Scheduler",
    approver: "Project Manager",
    trigger: "A delay, RFI, or change order affects a scheduled activity.",
    actions: [
      "Reads the affected activity from the master schedule",
      "Checks float and downstream dependencies",
      "Estimates the likely delay to the milestone or completion date",
      "Flags activities at risk of becoming critical path",
      "Writes a plain-language schedule impact summary",
    ],
    value: [
      "Earlier warning before a delay becomes critical",
      "Clearer schedule impact data for owner conversations",
      "Fewer surprises at the monthly schedule review",
      "A documented basis for any time-extension request",
    ],
    runtime: "2m 20s",
    trace: [
      { kind: "run", text: "starting connector…" },
      { kind: "ok", text: "reading schedule (Primavera P6)" },
      { kind: "ok", text: "activity 'Level 3 MEP rough-in' has 2 days float" },
      { kind: "ok", text: "delay impact: +3 days, now critical path" },
      { kind: "ok", text: "impact summary drafted" },
      { kind: "wait", text: "waiting on approval (Project Manager)" },
      { kind: "ok", text: "approved · schedule updated" },
      { kind: "done", text: "done in 2m 20s" },
    ],
  },
  {
    category: "Field Operations",
    title: "Safety & Compliance Copilot",
    goal: "Turn field safety observations and incident notes into compliant documentation, ready to file.",
    persona: "Site Safety Officer",
    approver: "EHS Manager",
    trigger: "A safety observation, near-miss, or incident is logged on site.",
    actions: [
      "Reads the observation, photos, and any incident notes",
      "Classifies the issue and severity",
      "Checks it against the site safety plan and regulatory requirements",
      "Drafts the incident or observation report",
      "Flags any issue that needs immediate escalation",
    ],
    value: [
      "Consistent documentation across every site",
      "Faster reporting turnaround",
      "An audit-ready compliance record",
      "Earlier visibility into recurring hazards",
    ],
    runtime: "1m 48s",
    trace: [
      { kind: "run", text: "starting connector…" },
      { kind: "ok", text: "reading incident notes + 3 photos" },
      { kind: "ok", text: "classified: near-miss · fall hazard" },
      { kind: "ok", text: "checked against site safety plan" },
      { kind: "ok", text: "report drafted" },
      { kind: "wait", text: "waiting on approval (EHS Manager)" },
      { kind: "ok", text: "approved · logged to compliance record" },
      { kind: "done", text: "done in 1m 48s" },
    ],
  },
];

// ---------------- Page ----------------

function Index() {
  // The landing page owns its own theme state (light/dark) via the shared
  // ThemeProvider, so the toggle in the nav can switch the whole marketing page.
  return (
    <ThemeProvider>
      <IndexContent />
    </ThemeProvider>
  );
}

function IndexContent() {
  const [authTab, setAuthTab] = useState<"login" | "demo" | null>(null);
  const navigate = useNavigate();
  const { theme } = useTheme();

  const onAuthenticated = () => {
    navigate({ to: "/app" });
  };

  return (
    <div
      className={cn(
        "landing-root min-h-screen bg-background text-foreground",
        theme === "dark" && "dark",
      )}
    >
      <Nav onLogin={() => setAuthTab("login")} onDemo={() => setAuthTab("demo")} />
      <Hero />
      <IntegrationCatalog />
      <CopilotLibrary />
      <CoreDiagram />
      <WorkflowSection />
      <PlatformGrid />
      <CTASection onDemo={() => setAuthTab("demo")} />
      <Footer />
      {authTab && (
        <AuthModal
          defaultTab={authTab}
          onClose={() => setAuthTab(null)}
          onAuthenticated={onAuthenticated}
        />
      )}
    </div>
  );
}

// ---------------- Nav ----------------

function Nav({ onLogin, onDemo }: { onLogin: () => void; onDemo: () => void }) {
  const { theme, toggle } = useTheme();
  return (
    <header className="sticky top-0 z-30 border-b border-border bg-background/80 backdrop-blur">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-5 py-3.5">
        <a href="#" className="flex items-center">
          <LogoLockup className="ml-2" />
        </a>
        <nav className="hidden items-center gap-8 text-sm font-medium text-muted-foreground md:flex">
          <a href="#integrations" className="transition hover:text-foreground">
            Integrations
          </a>
          <a href="#copilots" className="transition hover:text-foreground">
            Copilots
          </a>
          <a href="#platform" className="transition hover:text-foreground">
            Platform
          </a>
          <a href="#workflow" className="transition hover:text-foreground">
            Workflow
          </a>
        </nav>
        <div className="flex items-center gap-2">
          <button
            onClick={toggle}
            aria-label={theme === "dark" ? "Switch to light mode" : "Switch to dark mode"}
            className="rounded-lg p-2 text-muted-foreground transition hover:bg-secondary hover:text-foreground"
          >
            {theme === "dark" ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
          </button>
          <button
            onClick={onLogin}
            className="rounded-lg px-3.5 py-1.5 text-sm font-medium text-foreground transition hover:bg-secondary"
          >
            Log in
          </button>
          <button
            onClick={onDemo}
            className="rounded-lg bg-foreground px-4 py-1.5 text-sm font-semibold text-background transition hover:opacity-90"
          >
            Book Demo
          </button>
        </div>
      </div>
    </header>
  );
}

// ---------------- Hero ----------------

function Hero() {
  return (
    <section className="relative border-b border-border/60">
      {/* Decorative layer is clipped on its own so it never cuts off content below. */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden" aria-hidden>
        <div className="absolute inset-0 grid-bg opacity-60" />
        <div className="absolute -top-40 left-1/2 h-96 w-[52rem] -translate-x-1/2 rounded-full bg-primary/10 blur-3xl" />
      </div>
      <div className="relative mx-auto max-w-7xl px-5 py-20 md:py-28">
        <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-border bg-surface px-3 py-1 text-xs font-medium text-muted-foreground shadow-sm">
          <span className="h-1.5 w-1.5 rounded-full bg-primary" />
          Built for general contractors, EPCs, and subcontractors
        </div>
        <h1 className="max-w-3xl text-4xl font-semibold leading-[1.05] tracking-tight md:text-6xl">
          AI that answers the RFI before the site does.
        </h1>
        <p className="mt-5 max-w-2xl text-base text-muted-foreground md:text-lg">
          RFI responses, change order drafting, daily site reports, and subcontractor invoice
          checks — grounded in your drawings, schedules, and project systems. A named approver
          signs off on every draft before it goes out.
        </p>

        <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:items-stretch">
          <a
            href="#workflow"
            className="inline-flex items-center justify-center rounded-xl bg-foreground px-6 py-3 text-sm font-semibold uppercase tracking-wide text-background transition hover:opacity-90"
          >
            Start building
          </a>
          <a
            href="#integrations"
            className="inline-flex items-center justify-center rounded-xl border border-border bg-surface px-6 py-3 text-sm font-semibold uppercase tracking-wide text-foreground transition hover:border-primary hover:text-primary"
          >
            View integrations
          </a>
          <a
            href="#copilots"
            className="inline-flex items-center justify-center rounded-xl border border-border bg-surface px-6 py-3 text-sm font-semibold uppercase tracking-wide text-foreground transition hover:border-primary hover:text-primary"
          >
            Browse copilots
          </a>
        </div>
      </div>
    </section>
  );
}

// ---------------- Core diagram ----------------

type Pillar = {
  name: string;
  icon: LucideIcon;
  desc: string;
  detail: string;
  whatItDoes: string[];
};

const PILLARS: Pillar[] = [
  {
    name: "Identity",
    icon: ShieldCheck,
    desc: "SSO and role-based access, so subcontractors, PMs, and owners each see only what they should.",
    detail:
      "Single sign-on and role-based access across every project. Subcontractors, project managers, and owners each see exactly the projects, documents, and actions they're allowed to — with a full audit trail behind every decision.",
    whatItDoes: [
      "SSO across your identity provider (Azure AD, Okta, Google Workspace)",
      "Role-based permissions scoped by project, not just by company",
      "Per-project access for subcontractors and owner's reps",
      "Full audit trail on every login and permission change",
    ],
  },
  {
    name: "Site Copilot Chat",
    icon: MessageSquare,
    desc: "Ask about a spec section, a drawing detail, or a schedule item — grounded in this project's own documents.",
    detail:
      "Ask about a spec section, a drawing detail, or a schedule item and get an answer grounded in this project's own documents — not a generic AI guess.",
    whatItDoes: [
      "Grounded answers from drawings, specs, submittals, and schedules",
      "Every answer cites the source document and page",
      "Understands project-specific terminology and history",
      "Available inside every copilot, not just as a standalone chat",
    ],
  },
  {
    name: "Workflow Engine",
    icon: Workflow,
    desc: "Runs RFIs, change orders, and approvals step by step, with a named approver and full history.",
    detail:
      "Runs RFIs, change orders, and approvals step by step — with a named approver, retries on failure, and a complete history of who did what.",
    whatItDoes: [
      "Configurable approval routing by role or dollar threshold",
      "Automatic retries and escalations when a step stalls",
      "Full history and audit trail for every workflow run",
      "Powers every copilot in the library — nothing runs unsupervised",
    ],
  },
  {
    name: "Document Intelligence",
    icon: FileText,
    desc: "Reads drawings, specs, submittals, and scanned field notes, then extracts the structured data.",
    detail:
      "Reads drawings, specs, submittals, and scanned field notes, then extracts the structured data your copilots act on.",
    whatItDoes: [
      "OCR across drawings, PDFs, and handwritten field notes",
      "Automatic revision detection on drawing sets",
      "Structured extraction from specs and submittals",
      "Full-text search across every project document",
    ],
  },
  {
    name: "Connector Hub",
    icon: Share2,
    desc: "One place to securely connect Procore, Autodesk Construction Cloud, and the inbox your team already uses.",
    detail:
      "One place to securely connect Procore, Autodesk Construction Cloud, and the inbox your team already uses. Authenticate once, then every copilot can read and act across your systems.",
    whatItDoes: [
      "Native connections to Procore, Autodesk Construction Cloud & Primavera P6",
      "Email, Teams, and file storage in one config",
      "Two-way sync — copilots read and write back to your systems of record",
      "16 supported integrations, growing by request",
    ],
  },
  {
    name: "Admin",
    icon: Settings2,
    desc: "Control which projects, roles, and cost centers can use AI — with everything in the audit trail.",
    detail:
      "Control which projects, roles, and cost centers can use AI — with usage, cost, and safety visible in one dashboard and everything logged to the audit trail.",
    whatItDoes: [
      "Per-project and per-role AI access controls",
      "Usage and cost visibility across the org",
      "Safety and compliance controls for what AI can act on",
      "Every action logged to a searchable audit trail",
    ],
  },
];

function CoreDiagram() {
  const [selected, setSelected] = useState<Pillar | null>(null);

  return (
    <section id="platform" className="border-b border-border/60 py-20">
      <div className="mx-auto max-w-7xl px-5">
        <div className="mb-12 flex max-w-2xl flex-col gap-3">
          <span className="font-mono text-xs uppercase tracking-wider text-primary">
            The shared core
          </span>
          <h2 className="text-3xl font-semibold tracking-tight md:text-4xl">
            Every copilot runs on the same operating system.
          </h2>
          <p className="text-sm text-muted-foreground md:text-base">
            Instead of rebuilding the basics for every workflow, each copilot inherits the same six
            building blocks. Turn one on and identity, chat, workflows, documents, connectors, and
            admin all come with it — already wired to your project systems.
          </p>
        </div>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {PILLARS.map((s, i) => {
            const Icon = s.icon;
            return (
              <button
                key={s.name}
                onClick={() => setSelected(s)}
                className="group rounded-xl border border-border bg-surface p-5 text-left transition duration-300 hover:-translate-y-1 hover:border-primary/50 hover:shadow-md"
              >
                <div className="mb-4 flex items-center justify-between">
                  <span className="grid h-10 w-10 place-items-center rounded-lg border border-border bg-background text-muted-foreground transition group-hover:border-primary/40 group-hover:text-primary">
                    <Icon className="h-5 w-5" />
                  </span>
                  <span className="font-mono text-xs text-muted-foreground">0{i + 1}</span>
                </div>
                <div className="text-base font-semibold">{s.name}</div>
                <p className="mt-1.5 text-sm text-muted-foreground">{s.desc}</p>
              </button>
            );
          })}
        </div>
      </div>

      {selected && <PillarModal pillar={selected} onClose={() => setSelected(null)} />}
    </section>
  );
}

function PillarModal({ pillar, onClose }: { pillar: Pillar; onClose: () => void }) {
  const Icon = pillar.icon;

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [onClose]);

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 px-4 py-8 backdrop-blur-sm"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-labelledby="pillar-title"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="nice-scroll max-h-[88vh] w-full max-w-md overflow-y-auto rounded-2xl border border-border bg-surface shadow-2xl"
      >
        <div className="flex items-start justify-between gap-4 border-b border-border p-6">
          <div className="flex items-center gap-4">
            <span className="grid h-12 w-12 shrink-0 place-items-center rounded-xl bg-primary/15 text-primary">
              <Icon className="h-6 w-6" />
            </span>
            <div>
              <span className="font-mono text-[10px] font-medium uppercase tracking-wider text-primary">
                Construction Core
              </span>
              <h3 id="pillar-title" className="mt-0.5 text-xl font-semibold tracking-tight">
                {pillar.name}
              </h3>
            </div>
          </div>
          <button
            onClick={onClose}
            aria-label="Close"
            className="shrink-0 rounded-lg p-2 text-muted-foreground transition hover:bg-surface-2 hover:text-foreground"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="space-y-6 p-6">
          <p className="text-sm text-foreground/90">{pillar.detail}</p>

          <div>
            <div className="mb-2 font-mono text-[11px] uppercase tracking-wider text-muted-foreground">
              What it does
            </div>
            <ul className="space-y-2">
              {pillar.whatItDoes.map((w) => (
                <li key={w} className="flex gap-2.5 text-sm text-foreground/90">
                  <Check className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
                  {w}
                </li>
              ))}
            </ul>
          </div>

          <a
            href="#copilots"
            onClick={onClose}
            className="inline-flex w-full items-center justify-center rounded-lg bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground transition hover:opacity-90"
          >
            See the copilots that use it
          </a>
        </div>
      </div>
    </div>
  );
}

// ---------------- Workflow ----------------

// Adds an `in-view` class the first time the element scrolls into the viewport,
// so CSS-driven reveal/draw animations fire on scroll. No-op re-observes after.
function useInView<T extends HTMLElement>(rootMargin = "0px 0px -12% 0px") {
  const ref = useRef<T>(null);
  const [inView, setInView] = useState(false);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const obs = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setInView(true);
          obs.disconnect();
        }
      },
      { rootMargin, threshold: 0.15 },
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, [rootMargin]);
  return { ref, inView };
}

const RFI_WORKFLOW = {
  title: "A multi-hour RFI answer, down to minutes.",
  before: "A PM chasing drawings, spec sections, and prior answers across email and shared drives.",
  after:
    "AI drafts a response grounded in the project record and cites the drawing or spec. The PM reviews and sends.",
  steps: [
    { label: "RFI received", detail: "An email or Teams message from the contractor arrives." },
    {
      label: "Docs parsed",
      detail: "OCR and document intelligence read the attachment and referenced drawings.",
    },
    {
      label: "Project data pulled",
      detail: "Relevant drawings, specs, and schedule data are retrieved from Procore/ACC.",
    },
    {
      label: "Response drafted",
      detail: "AI drafts a response grounded in the project record, citing its sources.",
    },
    { label: "PM approves", detail: "One-click approval, with edits made inline if needed." },
    {
      label: "Reply sent",
      detail: "The response goes back over email or Teams and is logged to the project record.",
    },
  ],
};

function WorkflowSection() {
  const workflow = RFI_WORKFLOW;
  const heading = useInView<HTMLDivElement>();
  const before = useInView<HTMLDivElement>();
  const after = useInView<HTMLDivElement>();
  const timeline = useInView<HTMLDivElement>();

  return (
    <section
      id="workflow"
      className="relative overflow-hidden border-b border-border/60 bg-surface-2 py-20"
    >
      {/* soft ambient glow behind the section */}
      <div
        aria-hidden
        className="pointer-events-none absolute left-1/2 top-0 h-80 w-[46rem] -translate-x-1/2 rounded-full bg-primary/10 blur-3xl"
      />
      <div className="relative mx-auto max-w-5xl px-5">
        <div
          ref={heading.ref}
          className={cn(
            "reveal mb-12 flex flex-col items-center gap-3 text-center",
            heading.inView && "in-view",
          )}
        >
          <span className="inline-flex items-center gap-2 rounded-full border border-primary/25 bg-primary/5 px-3 py-1 font-mono text-xs uppercase tracking-wider text-primary">
            <Sparkles className="h-3 w-3" /> Workflow example
          </span>
          <h2 className="max-w-2xl text-3xl font-semibold tracking-tight md:text-4xl">
            {workflow.title}
          </h2>
          <p className="max-w-xl text-sm text-muted-foreground">
            The same six steps every time — AI does the work, a human stays in control.
          </p>
        </div>

        {/* Before → After contrast */}
        <div className="relative mb-16 grid items-stretch gap-4 md:grid-cols-[1fr_auto_1fr]">
          <div
            ref={before.ref}
            className={cn(
              "reveal rounded-2xl border border-border bg-surface/40 p-6 transition duration-300 hover:-translate-y-1 hover:border-border/80",
              before.inView && "in-view",
            )}
          >
            <div className="mb-3 flex items-center gap-2">
              <XCircle className="h-4 w-4 text-muted-foreground" />
              <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Before
              </span>
            </div>
            <p className="text-sm text-foreground/80">{workflow.before}</p>
          </div>
          <div className="flex items-center justify-center py-2 md:py-0">
            {/* dashed connector + arrow node */}
            <span
              aria-hidden
              className="absolute left-1/2 hidden h-px w-24 -translate-x-1/2 border-t border-dashed border-border md:block"
            />
            <div className="relative z-10 grid h-11 w-11 place-items-center rounded-full border border-primary/40 bg-background text-primary shadow-[0_0_0_5px_var(--surface-2)]">
              <ArrowRight className="arrow-float h-5 w-5" />
            </div>
          </div>
          <div
            ref={after.ref}
            className={cn(
              "reveal rounded-2xl border border-primary/40 bg-primary/5 p-6 shadow-[0_0_30px_-8px_var(--primary)] transition duration-300 hover:-translate-y-1",
              after.inView && "in-view",
            )}
            style={{ transitionDelay: after.inView ? "120ms" : "0ms" }}
          >
            <div className="mb-3 flex items-center gap-2">
              <Sparkles className="h-4 w-4 text-primary" />
              <span className="text-xs font-semibold uppercase tracking-wider text-primary">
                After
              </span>
            </div>
            <p className="text-sm text-foreground/90">{workflow.after}</p>
          </div>
        </div>

        {/* Connected step timeline */}
        <div ref={timeline.ref} className="relative">
          {/* far-left vertical rail + terminating arrow */}
          <span
            aria-hidden
            className={cn(
              "rail-draw absolute left-[19px] top-5 bottom-8 w-0.5 bg-gradient-to-b from-primary/50 via-border to-border",
              timeline.inView && "in-view",
            )}
          />

          <ol className="relative space-y-3">
            {workflow.steps.map((s, i) => {
              const Icon = STEP_ICONS[i] ?? Sparkles;
              return (
                <li key={s.label} className="relative flex items-center gap-3">
                  {/* numbered badge sitting on the rail */}
                  <div className="relative z-10 flex w-10 shrink-0 justify-center">
                    <span
                      className={cn(
                        "reveal grid h-8 w-8 place-items-center rounded-full border border-primary/50 bg-background text-xs font-semibold text-primary shadow-[0_0_0_4px_var(--surface-2),0_0_12px_-2px_var(--primary)]",
                        timeline.inView && "in-view",
                      )}
                      style={{ transitionDelay: `${i * 80}ms` }}
                    >
                      {i + 1}
                    </span>
                  </div>
                  {/* connector dot */}
                  <span aria-hidden className="h-1.5 w-1.5 shrink-0 rounded-full bg-primary/50" />
                  {/* step card */}
                  <div
                    className={cn(
                      "reveal grid flex-1 grid-cols-1 overflow-hidden rounded-xl border border-border/70 bg-gradient-to-br from-surface/70 to-surface-2/50 transition duration-300 hover:-translate-y-0.5 hover:border-primary/30 sm:grid-cols-[minmax(180px,240px)_1fr]",
                      timeline.inView && "in-view",
                    )}
                    style={{ transitionDelay: `${i * 80 + 60}ms` }}
                  >
                    <div className="flex items-center gap-4 px-5 py-4">
                      <span className="grid h-11 w-11 shrink-0 place-items-center rounded-full border border-border bg-background/60 text-muted-foreground">
                        <Icon className="h-5 w-5" />
                      </span>
                      <span className="text-[15px] font-semibold text-foreground">{s.label}</span>
                    </div>
                    <div className="flex items-center border-t border-border/60 px-5 py-4 text-sm text-muted-foreground sm:border-l sm:border-t-0">
                      {s.detail}
                    </div>
                  </div>
                </li>
              );
            })}
          </ol>
        </div>
      </div>
    </section>
  );
}

// Icons for the six-step flow, assigned by position (intake → parse → enrich →
// draft → approve → execute).
const STEP_ICONS: LucideIcon[] = [Mail, FileText, Share2, Wand2, User, CheckCircle2];

// ---------------- Copilot library (interactive catalog + modal) ----------------

function CopilotLibrary() {
  const [active, setActive] = useState<CopilotCategory | "all">("all");
  const [selected, setSelected] = useState<Copilot | null>(null);

  const items = useMemo(
    () => (active === "all" ? COPILOTS : COPILOTS.filter((c) => c.category === active)),
    [active],
  );

  return (
    <section id="copilots" className="border-b border-border/60 bg-surface-2/40 py-20">
      <div className="mx-auto max-w-7xl px-5">
        <div className="mb-8 flex flex-col gap-2">
          <span className="font-mono text-xs uppercase tracking-wider text-primary">
            Copilot library
          </span>
          <h2 className="max-w-2xl text-3xl font-semibold tracking-tight md:text-4xl">
            Pick the copilot for the work you want off your plate.
          </h2>
          <p className="max-w-2xl text-sm text-muted-foreground">
            Every copilot starts on a trigger, drafts the work from your project record, and stops
            for a named approver before anything goes out. Click a card to see how it runs.
          </p>
        </div>

        <div className="mb-6 flex flex-wrap items-center justify-between gap-3 border-b border-border/60 pb-5">
          <div className="flex flex-wrap gap-1.5">
            <CatalogChip label="All" active={active === "all"} onClick={() => setActive("all")} />
            {COPILOT_CATEGORIES.map((cat) => (
              <CatalogChip
                key={cat}
                label={cat}
                active={active === cat}
                onClick={() => setActive(cat)}
              />
            ))}
          </div>
          <div className="font-mono text-xs text-muted-foreground">
            Showing <b className="font-medium text-primary">{items.length}</b> of {COPILOTS.length}{" "}
            copilots
          </div>
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {items.map((c) => (
            <button
              key={c.title}
              onClick={() => setSelected(c)}
              className="group flex flex-col gap-3 rounded-2xl border border-border bg-surface p-5 text-left transition hover:-translate-y-0.5 hover:border-primary/50 hover:shadow-md"
            >
              <div className="flex items-center justify-between">
                <span className="font-mono text-[10px] font-medium uppercase tracking-wider text-primary">
                  {c.category}
                </span>
                <ArrowRight className="h-4 w-4 text-muted-foreground transition group-hover:translate-x-0.5 group-hover:text-primary" />
              </div>
              <h3 className="text-[17px] font-semibold leading-snug tracking-tight">{c.title}</h3>
              <p className="flex-1 text-sm text-muted-foreground">{c.goal}</p>
              <div className="flex items-center justify-between border-t border-dashed border-border pt-3 font-mono text-[11px] text-muted-foreground">
                <span>{c.persona}</span>
                <span className="flex items-center gap-1 text-primary">
                  <ShieldCheck className="h-3 w-3" />
                  {c.approver}
                </span>
              </div>
            </button>
          ))}
        </div>
      </div>

      {selected && <CopilotModal copilot={selected} onClose={() => setSelected(null)} />}
    </section>
  );
}

function CopilotModal({ copilot, onClose }: { copilot: Copilot; onClose: () => void }) {
  const [step, setStep] = useState(0);
  const reduceMotion =
    typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  // Reveal the run trace line by line so the flow reads as something that
  // actually executes, not a static list.
  useEffect(() => {
    setStep(0);
    if (reduceMotion) {
      setStep(copilot.trace.length);
      return;
    }
    let i = 0;
    const id = setInterval(() => {
      i += 1;
      setStep(i);
      if (i >= copilot.trace.length) clearInterval(id);
    }, 340);
    return () => clearInterval(id);
  }, [copilot, reduceMotion]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [onClose]);

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 px-4 py-8 backdrop-blur-sm"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-labelledby="copilot-title"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="nice-scroll max-h-[88vh] w-full max-w-3xl overflow-y-auto rounded-2xl border border-border bg-surface shadow-2xl"
      >
        {/* Header */}
        <div className="flex items-start justify-between gap-4 border-b border-border p-6">
          <div>
            <span className="font-mono text-[10px] font-medium uppercase tracking-wider text-primary">
              {copilot.category}
            </span>
            <h3 id="copilot-title" className="mt-1.5 text-2xl font-semibold tracking-tight">
              {copilot.title}
            </h3>
            <p className="mt-2 max-w-xl text-sm text-muted-foreground">{copilot.goal}</p>
          </div>
          <button
            onClick={onClose}
            aria-label="Close"
            className="shrink-0 rounded-lg p-2 text-muted-foreground transition hover:bg-surface-2 hover:text-foreground"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="grid gap-0 md:grid-cols-[1fr_320px]">
          {/* Left: explanation */}
          <div className="space-y-6 p-6">
            <div>
              <div className="mb-2 flex items-center gap-2 font-mono text-[11px] uppercase tracking-wider text-muted-foreground">
                <Zap className="h-3.5 w-3.5 text-primary" /> Starts when
              </div>
              <p className="text-sm text-foreground/90">{copilot.trigger}</p>
            </div>

            <div>
              <div className="mb-2 font-mono text-[11px] uppercase tracking-wider text-muted-foreground">
                What the AI does
              </div>
              <ul className="space-y-2">
                {copilot.actions.map((a) => (
                  <li key={a} className="flex gap-2.5 text-sm text-foreground/90">
                    <Check className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
                    {a}
                  </li>
                ))}
              </ul>
            </div>

            <div className="flex items-center gap-2.5 rounded-lg border border-primary/25 bg-primary/5 px-4 py-3 text-sm text-foreground/90">
              <ShieldCheck className="h-4 w-4 shrink-0 text-primary" />
              You stay in control — <b className="font-semibold text-primary">
                {copilot.approver}
              </b>{" "}
              approves before anything ships.
            </div>

            <div>
              <div className="mb-2 font-mono text-[11px] uppercase tracking-wider text-muted-foreground">
                What you get
              </div>
              <ul className="grid gap-2 sm:grid-cols-2">
                {copilot.value.map((v) => (
                  <li key={v} className="flex gap-2 text-sm text-muted-foreground">
                    <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
                    {v}
                  </li>
                ))}
              </ul>
            </div>
          </div>

          {/* Right: live run trace */}
          <div className="border-t border-border bg-surface-2/60 p-6 md:border-l md:border-t-0">
            <div className="mb-3 flex items-center justify-between">
              <span className="font-mono text-[11px] uppercase tracking-wider text-muted-foreground">
                Live run
              </span>
              <span className="font-mono text-[11px] text-primary">{copilot.runtime}</span>
            </div>
            <div className="space-y-2 font-mono text-[12.5px] leading-relaxed">
              {copilot.trace.map((line, i) => {
                const shown = i < step;
                return (
                  <div
                    key={i}
                    className={cn(
                      "flex items-start gap-2 transition-opacity duration-300",
                      shown ? "opacity-100" : "opacity-0",
                    )}
                  >
                    <TraceIcon kind={line.kind} />
                    <span
                      className={cn(
                        line.kind === "wait" && "text-amber-500 dark:text-amber-400",
                        line.kind === "done" && "font-semibold text-foreground",
                        line.kind === "run" && "text-muted-foreground",
                        line.kind === "ok" && "text-foreground/80",
                      )}
                    >
                      {line.text}
                    </span>
                  </div>
                );
              })}
            </div>

            <div className="mt-6 flex flex-col gap-2">
              <a
                href="#cta"
                onClick={onClose}
                className="inline-flex items-center justify-center rounded-lg bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground transition hover:opacity-90"
              >
                Get this copilot
              </a>
              <button
                onClick={onClose}
                className="inline-flex items-center justify-center rounded-lg border border-border bg-surface px-4 py-2.5 text-sm font-medium text-foreground transition hover:border-primary/50"
              >
                Browse more
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function TraceIcon({ kind }: { kind: Copilot["trace"][number]["kind"] }) {
  if (kind === "wait")
    return <Clock className="mt-0.5 h-3.5 w-3.5 shrink-0 text-amber-500 dark:text-amber-400" />;
  if (kind === "done") return <Sparkles className="mt-0.5 h-3.5 w-3.5 shrink-0 text-primary" />;
  if (kind === "run")
    return <span className="mt-1 h-3.5 w-3.5 shrink-0 text-muted-foreground">▸</span>;
  return <Check className="mt-0.5 h-3.5 w-3.5 shrink-0 text-primary" />;
}

// ---------------- Integration catalog ----------------

const CONSTRUCTION_INTEGRATIONS = INTEGRATIONS.filter((i) => i.category === "Construction");

function IntegrationCatalog() {
  const [active, setActive] = useState<ConstructionSubcategory | "all">("all");

  const items = useMemo(
    () =>
      active === "all"
        ? CONSTRUCTION_INTEGRATIONS
        : CONSTRUCTION_INTEGRATIONS.filter((i) => i.subcategory === active),
    [active],
  );

  return (
    <section id="integrations" className="border-b border-border/60 py-20">
      <div className="mx-auto max-w-7xl px-5">
        <div className="mb-8 flex flex-col gap-2 text-center">
          <span className="font-mono text-xs uppercase tracking-wider text-primary">
            Integrations
          </span>
          <h2 className="mx-auto max-w-2xl text-3xl font-semibold tracking-tight md:text-4xl">
            Connects to the tools your project team already runs on.
          </h2>
          <p className="mx-auto max-w-2xl text-sm text-muted-foreground">
            Authenticate once, then read and act across your project management, drawing,
            scheduling, and site communication tools — no re-keying, no CSV exports.
          </p>
        </div>

        <div className="mb-8 flex flex-wrap justify-center gap-1.5">
          <CatalogChip label="All" active={active === "all"} onClick={() => setActive("all")} />
          {CONSTRUCTION_SUBCATEGORIES.map((c) => (
            <CatalogChip key={c} label={c} active={active === c} onClick={() => setActive(c)} />
          ))}
        </div>

        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6">
          {items.map((i) => (
            <div
              key={i.slug}
              className="flex flex-col items-center gap-3 rounded-xl border border-border bg-surface p-5 text-center transition hover:border-primary/50 hover:shadow-sm"
            >
              <IntegrationLogo
                name={i.name}
                domain={i.domain}
                logo={i.logo}
                className="h-12 w-12"
              />
              <div className="min-w-0">
                <div className="truncate text-sm font-medium">{i.name}</div>
                <div className="text-[11px] text-muted-foreground">{i.subcategory}</div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function CatalogChip({
  label,
  active,
  onClick,
}: {
  label: string;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className={`rounded-full border px-3 py-1 text-xs font-medium transition ${
        active
          ? "border-primary bg-primary text-primary-foreground"
          : "border-border bg-surface text-muted-foreground hover:border-primary/40 hover:text-foreground"
      }`}
    >
      {label}
    </button>
  );
}

// ---------------- Platform grid ----------------

function PlatformGrid() {
  const rows = [
    { k: "Identity", v: "SSO, RBAC, and audit trails across PMs, subs, and owners." },
    { k: "Site Copilot Chat", v: "Grounded answers from your drawings, specs, and schedule." },
    { k: "Workflow Engine", v: "RFI, change order, and approval routing with escalations." },
    { k: "Document Intelligence", v: "OCR + structured extraction from drawings and field photos." },
    { k: "Connector Hub", v: "Procore, Autodesk Construction Cloud, and email — one config." },
    { k: "Admin", v: "Usage, cost, and safety controls per project." },
  ];
  return (
    <section className="border-b border-border/60 py-20">
      <div className="mx-auto max-w-7xl px-5">
        <div className="mb-10">
          <span className="font-mono text-xs uppercase tracking-wider text-primary">
            Under the hood
          </span>
          <h2 className="mt-2 max-w-2xl text-3xl font-semibold tracking-tight md:text-4xl">
            Every copilot inherits this.
          </h2>
        </div>
        <div className="overflow-hidden rounded-2xl border border-border">
          {rows.map((r, i) => (
            <div
              key={r.k}
              className={`grid grid-cols-1 gap-2 px-5 py-4 md:grid-cols-[220px_1fr] ${
                i !== rows.length - 1 ? "border-b border-border" : ""
              } bg-surface`}
            >
              <div className="font-mono text-xs uppercase tracking-wider text-muted-foreground">
                {r.k}
              </div>
              <div className="text-sm text-foreground/90">{r.v}</div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

// ---------------- CTA ----------------

function CTASection({ onDemo }: { onDemo: () => void }) {
  return (
    <section id="cta" className="py-20">
      <div className="mx-auto max-w-4xl px-5 text-center">
        <h2 className="text-3xl font-semibold tracking-tight md:text-4xl">
          Bring the AI OS to your next project.
        </h2>
        <p className="mx-auto mt-3 max-w-xl text-sm text-muted-foreground">
          Book a demo and we'll walk through it against your own drawings, schedule, and project
          systems.
        </p>
        <button
          onClick={onDemo}
          className="mt-6 inline-flex items-center justify-center rounded-lg bg-primary px-6 py-3 text-sm font-semibold text-primary-foreground transition hover:opacity-90"
        >
          Book Demo
        </button>
      </div>
    </section>
  );
}

// ---------------- Footer ----------------

function Footer() {
  const columns: { title: string; links: string[] }[] = [
    { title: "Product", links: ["Integrations", "Copilots", "Workflow", "Pricing"] },
    { title: "Resources", links: ["Docs", "API reference", "Changelog", "Status"] },
    { title: "Company", links: ["About", "Customers", "Careers", "Contact"] },
  ];
  return (
    <footer className="border-t border-border bg-surface-2">
      <div className="mx-auto max-w-7xl px-5 py-14">
        <div className="grid gap-10 md:grid-cols-[1.5fr_repeat(3,1fr)]">
          <div>
            <div className="flex items-center">
              <LogoLockup />
            </div>
            <p className="mt-4 max-w-xs text-sm text-muted-foreground">
              An AI operating system for construction — RFIs, change orders, site reports, and the
              project systems your team already runs on.
            </p>
          </div>
          {columns.map((col) => (
            <div key={col.title}>
              <div className="mb-3 text-xs font-semibold uppercase tracking-wider text-foreground">
                {col.title}
              </div>
              <ul className="space-y-2.5 text-sm text-muted-foreground">
                {col.links.map((l) => (
                  <li key={l}>
                    <a href="#" className="transition hover:text-foreground">
                      {l}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
        <div className="mt-12 flex flex-col items-center justify-between gap-3 border-t border-border pt-6 text-xs text-muted-foreground md:flex-row">
          <div>© {new Date().getFullYear()} Construction AI OS. All rights reserved.</div>
          <div className="font-mono">Built for general contractors and EPC teams</div>
        </div>
      </div>
    </footer>
  );
}

// ---------------- Auth modal ----------------

function AuthModal({
  defaultTab,
  onClose,
  onAuthenticated,
}: {
  defaultTab: "login" | "demo";
  onClose: () => void;
  onAuthenticated: () => void;
}) {
  const [tab, setTab] = useState<"login" | "demo">(defaultTab);
  const [status, setStatus] = useState<null | string>(null);
  const dialogRef = useRef<HTMLDivElement>(null);
  const firstFieldRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
      if (e.key === "Tab" && dialogRef.current) {
        const focusables = dialogRef.current.querySelectorAll<HTMLElement>(
          'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])',
        );
        if (focusables.length === 0) return;
        const first = focusables[0];
        const last = focusables[focusables.length - 1];
        if (e.shiftKey && document.activeElement === first) {
          e.preventDefault();
          last.focus();
        } else if (!e.shiftKey && document.activeElement === last) {
          e.preventDefault();
          first.focus();
        }
      }
    };
    document.addEventListener("keydown", onKey);
    firstFieldRef.current?.focus();
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [onClose]);

  useEffect(() => {
    firstFieldRef.current?.focus();
    setStatus(null);
  }, [tab]);

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 px-4"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-labelledby="auth-title"
    >
      <div
        ref={dialogRef}
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-md rounded-2xl border border-border bg-surface p-6 shadow-2xl"
      >
        <div className="mb-5 flex items-start justify-between">
          <div>
            <h2 id="auth-title" className="text-lg font-semibold">
              {tab === "login" ? "Welcome back" : "Book a demo"}
            </h2>
            <p className="mt-1 text-xs text-muted-foreground">
              {tab === "login"
                ? "Sign in to your workspace."
                : "Tell us about your projects and we'll set up a walkthrough."}
            </p>
          </div>
          <button
            onClick={onClose}
            aria-label="Close"
            className="rounded-md p-1 text-muted-foreground hover:bg-surface-2 hover:text-foreground"
          >
            ✕
          </button>
        </div>

        <div className="mb-5 grid grid-cols-2 gap-1 rounded-lg bg-background p-1">
          <button
            onClick={() => setTab("login")}
            className={`rounded-md px-3 py-1.5 text-sm font-medium transition ${
              tab === "login" ? "bg-surface text-foreground" : "text-muted-foreground"
            }`}
          >
            Log in
          </button>
          <button
            onClick={() => setTab("demo")}
            className={`rounded-md px-3 py-1.5 text-sm font-medium transition ${
              tab === "demo" ? "bg-surface text-foreground" : "text-muted-foreground"
            }`}
          >
            Book Demo
          </button>
        </div>

        {status ? (
          <div className="rounded-lg border border-primary/40 bg-primary/5 p-4 text-sm">
            {status}
            <div className="mt-4">
              <button
                onClick={onClose}
                className="w-full rounded-md bg-primary py-2 text-sm font-semibold text-primary-foreground hover:opacity-90"
              >
                Close
              </button>
            </div>
          </div>
        ) : tab === "login" ? (
          <LoginForm firstFieldRef={firstFieldRef} onAuthenticated={onAuthenticated} />
        ) : (
          <DemoForm firstFieldRef={firstFieldRef} onSuccess={(m) => setStatus(m)} />
        )}
      </div>
    </div>
  );
}

function Field({
  label,
  error,
  children,
}: {
  label: string;
  error?: string;
  children: React.ReactNode;
}) {
  return (
    <label className="block">
      <div className="mb-1.5 text-xs font-medium text-muted-foreground">{label}</div>
      {children}
      {error && <div className="mt-1 text-xs text-destructive">{error}</div>}
    </label>
  );
}

const inputCls =
  "w-full rounded-md border border-border bg-background px-3 py-2 text-sm outline-none transition focus:border-primary focus:ring-1 focus:ring-primary";

function isEmail(v: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v);
}

async function handleDemoRequest(_: { name: string; email: string; company: string }) {
  // NOTE: there's no CRM/scheduling endpoint on the backend yet to route demo
  // requests to. Left as a stub — captures the lead client-side and confirms —
  // until that integration exists.
  await new Promise((r) => setTimeout(r, 400));
  return { ok: true };
}

function LoginForm({
  firstFieldRef,
  onAuthenticated,
}: {
  firstFieldRef: React.RefObject<HTMLInputElement | null>;
  onAuthenticated: () => void;
}) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [errors, setErrors] = useState<{ email?: string; password?: string; form?: string }>({});
  const [loading, setLoading] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    const errs: typeof errors = {};
    if (!email) errs.email = "Email is required";
    else if (!isEmail(email)) errs.email = "Enter a valid email";
    if (!password) errs.password = "Password is required";
    setErrors(errs);
    if (Object.keys(errs).length) return;
    setLoading(true);
    try {
      await api.login(email, password);
      onAuthenticated(); // navigates into the workspace (/app)
    } catch (err) {
      let msg = "Could not reach the platform. Is the backend running?";
      if (err instanceof ApiError) {
        // The backend replied — show why (bad credentials, no tenant/org, etc.).
        msg = err.status === 401 ? "Invalid email or password." : err.message;
      }
      setErrors({ form: msg });
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={submit} className="space-y-3" noValidate>
      <Field label="Work email" error={errors.email}>
        <input
          ref={firstFieldRef}
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className={inputCls}
          placeholder="you@company.com"
          autoComplete="email"
        />
      </Field>
      <Field label="Password" error={errors.password}>
        <input
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className={inputCls}
          placeholder="••••••••"
          autoComplete="current-password"
        />
      </Field>
      <div className="flex items-center justify-between">
        <button type="button" className="text-xs text-muted-foreground hover:text-foreground">
          Forgot password?
        </button>
      </div>
      {errors.form && (
        <div className="rounded-md border border-destructive/40 bg-destructive/10 px-3 py-2 text-xs text-destructive">
          {errors.form}
        </div>
      )}
      <button
        type="submit"
        disabled={loading}
        className="mt-2 w-full rounded-md bg-primary py-2 text-sm font-semibold text-primary-foreground transition hover:opacity-90 disabled:opacity-60"
      >
        {loading ? "Signing in…" : "Log in"}
      </button>
      <div className="relative my-3">
        <div className="absolute inset-0 flex items-center">
          <div className="h-px w-full bg-border" />
        </div>
        <div className="relative text-center">
          <span className="bg-surface px-2 text-[11px] uppercase tracking-wider text-muted-foreground">
            or
          </span>
        </div>
      </div>
      <button
        type="button"
        onClick={() => setErrors({ form: "SSO isn't wired yet — sign in with email + password." })}
        className="w-full rounded-md border border-border bg-background py-2 text-sm font-medium hover:border-primary"
      >
        Continue with SSO
      </button>
    </form>
  );
}

function DemoForm({
  firstFieldRef,
  onSuccess,
}: {
  firstFieldRef: React.RefObject<HTMLInputElement | null>;
  onSuccess: (msg: string) => void;
}) {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [company, setCompany] = useState("");
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    const errs: Record<string, string> = {};
    if (!name.trim()) errs.name = "Name is required";
    if (!email) errs.email = "Email is required";
    else if (!isEmail(email)) errs.email = "Enter a valid work email";
    if (!company.trim()) errs.company = "Company is required";
    setErrors(errs);
    if (Object.keys(errs).length) return;
    setLoading(true);
    await handleDemoRequest({ name, email, company });
    setLoading(false);
    onSuccess(`Thanks, ${name.split(" ")[0]} — we'll reach out to ${email} to set up a time.`);
  };

  return (
    <form onSubmit={submit} className="space-y-3" noValidate>
      <Field label="Full name" error={errors.name}>
        <input
          ref={firstFieldRef}
          value={name}
          onChange={(e) => setName(e.target.value)}
          className={inputCls}
          placeholder="Ada Lovelace"
        />
      </Field>
      <Field label="Work email" error={errors.email}>
        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className={inputCls}
          placeholder="you@company.com"
          autoComplete="email"
        />
      </Field>
      <Field label="Company" error={errors.company}>
        <input
          value={company}
          onChange={(e) => setCompany(e.target.value)}
          className={inputCls}
          placeholder="Acme Builders"
        />
      </Field>
      <button
        type="submit"
        disabled={loading}
        className="mt-2 w-full rounded-md bg-primary py-2 text-sm font-semibold text-primary-foreground transition hover:opacity-90 disabled:opacity-60"
      >
        {loading ? "Sending…" : "Book Demo"}
      </button>
    </form>
  );
}
