type BookHostProfileProps = {
  compact?: boolean;
};

const HostAvatar = ({ compact = false }: { compact?: boolean }) => (
  <svg
    aria-label="Tota avatar"
    className={compact ? 'h-12 w-12' : 'h-16 w-16'}
    role="img"
    viewBox="0 0 64 64"
    xmlns="http://www.w3.org/2000/svg"
  >
    <rect fill="#f6f7fb" height="64" rx="16" width="64" />
    <circle cx="32" cy="24" fill="#ffd5b8" r="12" />
    <path d="M16 34a16 16 0 0 1 32 0v8H16z" fill="#f4a261" />
    <path d="M12 44a20 20 0 0 0 40 0z" fill="#2a9d8f" />
    <circle cx="26" cy="23" fill="#1f2937" r="1.8" />
    <circle cx="38" cy="23" fill="#1f2937" r="1.8" />
  </svg>
);

export const BookHostProfile = ({ compact = false }: BookHostProfileProps) => (
  <div className="flex items-center gap-3" data-testid="book-host-profile">
    <HostAvatar compact={compact} />
    <div>
      <p className={`font-semibold text-foreground ${compact ? 'text-base' : 'text-lg'}`}>Tota</p>
      <p className="text-xs text-muted-foreground">Host</p>
    </div>
  </div>
);
