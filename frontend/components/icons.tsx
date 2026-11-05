import type { ReactNode } from "react";

type IconProps = { className?: string };

function icon(children: ReactNode) {
  return function Icon({ className = "size-5" }: IconProps) {
    return (
      <svg viewBox="0 0 24 24" className={className} fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        {children}
      </svg>
    );
  };
}

export const MailIcon = icon(
  <>
    <rect x="3" y="5" width="18" height="14" rx="2.5" />
    <path d="m4 7 8 6 8-6" />
  </>,
);

export const FormsIcon = icon(
  <>
    <rect x="4" y="3" width="16" height="18" rx="3" />
    <path d="M8 8h8M8 12h8M8 16h5" />
  </>,
);

export const UsersIcon = icon(
  <>
    <circle cx="9" cy="8" r="3.5" />
    <path d="M2.5 20c.6-3.4 3.200-5 6.500-5s5.900 1.600 6.500 5" />
    <path d="M16 4.500a3.500 3.500 0 0 1 0 7M18 15.300c1.900.7 3.100 2.200 3.500 4.700" />
  </>,
);

export const ServerIcon = icon(
  <>
    <rect x="3" y="4" width="18" height="7" rx="2.500" />
    <rect x="3" y="13" width="18" height="7" rx="2.500" />
    <path d="M7 7.500h.01M7 16.500h.01" />
  </>,
);

export const BookIcon = icon(
  <>
    <path d="M5 4.500A2.500 2.500 0 0 1 7.500 2H19v16H7.500A2.500 2.500 0 0 0 5 20.500v-16Z" />
    <path d="M5 20.500A2.500 2.500 0 0 0 7.500 23H19v-5" />
  </>,
);

export const LogoutIcon = icon(
  <>
    <path d="M9 4H6a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h3" />
    <path d="m16 8 4 4-4 4M20 12H9" />
  </>,
);

export const PlusIcon = icon(<path d="M12 5v14M5 12h14" />);

export const TrashIcon = icon(
  <>
    <path d="M4 7h16M10 11v6M14 11v6" />
    <path d="M6 7l1 12a2 2 0 0 0 2 2h6a2 2 0 0 0 2-2l1-12M9 7V4h6v3" />
  </>,
);

export const PencilIcon = icon(
  <>
    <path d="M4 20h4L19 9a2.800 2.800 0 0 0-4-4L4 16v4Z" />
    <path d="m13.500 6.500 4 4" />
  </>,
);

export const CopyIcon = icon(
  <>
    <rect x="9" y="9" width="11" height="11" rx="2.500" />
    <path d="M5 15V6a2 2 0 0 1 2-2h9" />
  </>,
);

export const CheckIcon = icon(<path d="m5 12.500 4.500 4.500L19 7.500" />);

export const ChevronIcon = icon(<path d="m9 6 6 6-6 6" />);

export const ExternalIcon = icon(
  <>
    <path d="M14 4h6v6M20 4l-9 9" />
    <path d="M18 14v4a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4" />
  </>,
);

export const MenuIcon = icon(<path d="M4 7h16M4 12h16M4 17h16" />);

export const CloseIcon = icon(<path d="M6 6l12 12M18 6 6 18" />);

export const RefreshIcon = icon(
  <>
    <path d="M20 12a8 8 0 1 1-2.500-5.800" />
    <path d="M20 4v5h-5" />
  </>,
);

export const ArrowUpIcon = icon(<path d="m6 14 6-6 6 6" />);

export const ArrowDownIcon = icon(<path d="m6 10 6 6 6-6" />);

export const InboxIcon = icon(
  <>
    <path d="M3 13l2.500-7.500A2 2 0 0 1 7.400 4h9.200a2 2 0 0 1 1.900 1.500L21 13" />
    <path d="M3 13v5a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-5h-5l-1.500 2.500h-5L8 13H3Z" />
  </>,
);

export const SearchIcon = icon(
  <>
    <circle cx="11" cy="11" r="7" />
    <path d="m20 20-3.500-3.500" />
  </>,
);

export const TemplateIcon = icon(
  <>
    <rect x="3" y="4" width="18" height="16" rx="2.500" />
    <path d="M3 9h18M9 9v11" />
  </>,
);
