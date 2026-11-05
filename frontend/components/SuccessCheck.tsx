/** A check that draws itself, with a soft ring that expands once. */
export function SuccessCheck() {
  return (
    <span className="relative grid size-20 place-items-center">
      <span className="absolute inset-0 animate-ring rounded-full bg-success/40" />
      <svg viewBox="0 0 52 52" className="relative size-20" fill="none" aria-hidden="true">
        <circle cx="26" cy="26" r="24" className="fill-success/10 stroke-success/60" strokeWidth="2" />
        <path
          d="M15 27.5 22.5 35 37 18.5"
          className="animate-draw stroke-success"
          strokeWidth="3.5"
          strokeLinecap="round"
          strokeLinejoin="round"
          style={{ strokeDasharray: 40, strokeDashoffset: 40 }}
          pathLength={40}
        />
      </svg>
    </span>
  );
}
