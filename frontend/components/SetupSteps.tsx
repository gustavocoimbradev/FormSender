const STEPS = ["Administrador", "SMTP"];

/**
 * Two small bars, one per step, each with its label underneath. A bar fills as
 * its step is reached. Short labels, side by side: it holds up from a 360px
 * phone to a desktop.
 */
export function SetupSteps({ step }: { step: 1 | 2 }) {
  return (
    <div className="mb-7" role="group" aria-label={`Etapa ${step} de ${STEPS.length}`}>
      <ol className="grid grid-cols-2 gap-3">
        {STEPS.map((title, index) => {
          const number = index + 1;
          const reached = step >= number;

          return (
            <li key={title} aria-label={`${number}. ${title}`} aria-current={step === number ? "step" : undefined} className="min-w-0">
              <span className="block h-1.5 overflow-hidden rounded-full bg-surface/10">
                <span
                  className={`block h-full rounded-full bg-gradient-to-r from-accent to-accent-2 transition-[width] duration-500 ease-[cubic-bezier(0.4,0,0.2,1)] ${reached ? "w-full" : "w-0"}`}
                />
              </span>

              <span
                aria-hidden="true"
                className={`mt-2 block truncate whitespace-nowrap text-sm transition-colors duration-300 ${reached ? "text-text" : "text-muted"}`}
              >
                {title}
              </span>
            </li>
          );
        })}
      </ol>
    </div>
  );
}
