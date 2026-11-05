import type { ReactNode } from "react";

const STEPS = ["Administrador", "SMTP"];

type SetupStepsProps = {
  step: 1 | 2;
  /** When given, the first step can be clicked to go back to it. */
  onBack?: () => void;
};

/**
 * Two small bars, one per step, each with its label underneath. A bar fills as
 * its step is reached. Once past the first step, clicking its bar or label goes back.
 */
export function SetupSteps({ step, onBack }: SetupStepsProps) {
  return (
    <div className="mb-7" role="group" aria-label={`Etapa ${step} de ${STEPS.length}`}>
      <ol className="grid grid-cols-2 gap-3">
        {STEPS.map((title, index) => {
          const number = index + 1;
          const reached = step >= number;
          const goesBack = number === 1 && step === 2 && onBack !== undefined;

          const content: ReactNode = (
            <>
              <span className="block h-1.5 overflow-hidden rounded-full bg-surface/10">
                <span
                  className={`block h-full rounded-full bg-gradient-to-r from-accent to-accent-2 transition-[width] duration-500 ease-[cubic-bezier(0.4,0,0.2,1)] ${reached ? "w-full" : "w-0"}`}
                />
              </span>

              <span
                aria-hidden="true"
                className={`mt-2 block truncate whitespace-nowrap text-sm transition-colors duration-300 ${reached ? "text-text" : "text-muted"} ${goesBack ? "group-hover:text-accent" : ""}`}
              >
                {title}
              </span>
            </>
          );

          return (
            <li key={title} aria-label={`${number}. ${title}`} aria-current={step === number ? "step" : undefined} className="min-w-0">
              {goesBack ? (
                // Padding makes the touch target at least 44px tall without moving the layout.
                <button
                  type="button"
                  onClick={onBack}
                  aria-label={`Voltar para ${title}`}
                  className="group -my-3 block w-full min-w-0 rounded-control py-3 text-left"
                >
                  {content}
                </button>
              ) : (
                content
              )}
            </li>
          );
        })}
      </ol>
    </div>
  );
}
