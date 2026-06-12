import clsx from 'clsx';

const STATUS_CONFIG = {
  submitted:     { label: 'Submitted',     color: 'bg-sky-100 text-sky-700' },
  under_review:  { label: 'Under Review',  color: 'bg-amber-100 text-amber-700' },
  in_progress:   { label: 'In Progress',   color: 'bg-indigo-100 text-indigo-700' },
  resolved:      { label: 'Resolved',      color: 'bg-emerald-100 text-emerald-700' },
  closed:        { label: 'Closed',        color: 'bg-slate-100 text-slate-700' },
  rejected:      { label: 'Rejected',      color: 'bg-rose-100 text-rose-700' },
};

const StatusBadge = ({ status }) => {
  const config = STATUS_CONFIG[status] || STATUS_CONFIG.submitted;
  return (
    <span className={clsx('badge', config.color)}>
      <span className="w-1.5 h-1.5 rounded-full bg-current"></span>
      {config.label}
    </span>
  );
};

export default StatusBadge;