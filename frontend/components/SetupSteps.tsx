const STEPS = ["Administrador", "SMTP"];

const Check = () => (
  <svg viewBox="0 0 24 24" className="size-5" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d="m5 12.5 4.5 4.5L19 7.5" />
  </svg>
);

/**
 * Two numbered circles joined by a line that fills as you move on, with a small
 * label under each. Nothing here wraps or competes for space, so it holds up
 * from a 360px phone to a desktop.
 */
export function SetupSteps({ step }: { step: 1 | 2 }) {
  return (
    <div className="mb-7" role="group" aria-label={`Etapa ${step} de ${STEPS.length}`}>
      <ol className="flex items-center">
        {STEPS.map((title, index) => {
          const number = index + 1;
          const done = step > number;
          const active = step === number;

          return (
            <li
              key={title}
              aria-label={`${number}. ${title}`}
              aria-current={active ? "step" : undefined}
              className={index === 0 ? "flex" : "flex flex-1 items-center"}
            >
              {index > 0 && (
                <span aria-hidden="true" className="mx-3 h-1 flex-1 overflow-hidden rounded-full bg-surface/10 sm:mx-4">
                  <span
                    className={`block h-full rounded-full bg-gradient-to-r from-accent to-accent-2 transition-[width] duration-500 ease-[cubic-bezier(0.4,0,0.2,1)] ${step >= number ? "w-full" : "w-0"}`}
                  />
                </span>
              )}

              <span
                className={`grid size-9 shrink-0 place-items-center rounded-full text-base font-semibold transition duration-300 ${
                  done ? "bg-success/20 text-success" : active ? "bg-accent text-white ring-4 ring-accent/25" : "bg-surface/10 text-muted"
                }`}
              >
                {done ? <Check /> : number}
              </span>
            </li>
          );
        })}
      </ol>

      <div aria-hidden="true" className="mt-2 flex justify-between gap-3 whitespace-nowrap text-sm">
        {STEPS.map((title, index) => (
          <span key={title} className={`transition-colors duration-300 ${step >= index + 1 ? "text-text" : "text-muted"}`}>
            {title}
          </span>
        ))}
      </div>
    </div>
  );
}
