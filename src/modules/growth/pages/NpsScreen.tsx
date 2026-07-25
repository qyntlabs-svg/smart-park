// Screen: G-06 · Primitives: Review, Notification
// Route: /growth/nps
// Standalone destination for the NPS prompt (e.g. deep-linked from push).

import { useNavigate } from "react-router-dom";
import { useState } from "react";
import { ArrowLeft } from "lucide-react";
import NpsModal, { loadNpsResponses } from "../components/NpsModal";

const NpsScreen = () => {
  const navigate = useNavigate();
  const [open, setOpen] = useState(true);
  const responses = loadNpsResponses();

  return (
    <div className="min-h-[100dvh] w-full max-w-md mx-auto bg-background flex flex-col">
      <header className="h-[56px] flex items-center px-4 border-b border-border">
        <button
          onClick={() => navigate(-1)}
          className="touch-target flex items-center justify-center"
          aria-label="Back"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
        <span className="ml-2 text-body font-bold">Share feedback</span>
      </header>

      <div className="p-4 flex-1">
        {open ? (
          <p className="text-[13px] text-muted-foreground">
            Loading feedback prompt…
          </p>
        ) : responses.length > 0 ? (
          <div className="space-y-3">
            <div className="rounded-lg border border-emerald-500/30 bg-emerald-500/10 p-3 text-[13px]">
              Thanks — your response is saved.
            </div>
            <h3 className="text-[12px] uppercase tracking-wider text-muted-foreground">
              Your past feedback
            </h3>
            <ul className="space-y-2">
              {responses.slice(0, 5).map((r) => (
                <li
                  key={r.submittedAt}
                  className="rounded border border-border bg-card p-3"
                >
                  <div className="flex items-center gap-2 text-[13px]">
                    <span className="font-bold tabular-nums">{r.score}/10</span>
                    <span className="text-muted-foreground text-[11px]">
                      {new Date(r.submittedAt).toLocaleString()}
                    </span>
                    {r.context ? (
                      <span className="ml-auto text-[10px] rounded bg-muted px-1.5 py-0.5">
                        {r.context}
                      </span>
                    ) : null}
                  </div>
                  {r.reason ? (
                    <p className="text-[12px] text-muted-foreground mt-1">
                      {r.reason}
                    </p>
                  ) : null}
                </li>
              ))}
            </ul>
            <button
              onClick={() => setOpen(true)}
              className="w-full rounded-full bg-primary text-primary-foreground py-2.5 text-[13px] font-semibold"
            >
              Submit another
            </button>
          </div>
        ) : (
          <div className="text-center text-[13px] text-muted-foreground py-10">
            No feedback yet.
            <div>
              <button
                onClick={() => setOpen(true)}
                className="mt-3 rounded-full bg-primary text-primary-foreground px-4 py-2 text-[13px] font-semibold"
              >
                Give feedback
              </button>
            </div>
          </div>
        )}
      </div>

      <NpsModal
        open={open}
        context="deep-linked"
        onDismiss={() => setOpen(false)}
        onSubmit={() => setOpen(false)}
      />
    </div>
  );
};

export default NpsScreen;
