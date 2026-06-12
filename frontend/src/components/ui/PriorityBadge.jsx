import clsx from 'clsx';

const PRIORITY_CONFIG = {
  low:    { label: 'Low',    color: 'bg-slate-100 text-slate-700' },
  medium: { label: 'Medium', color: 'bg-sky-100 text-sky-700' },
  high:   { label: 'High',   color: 'bg-amber-100 text-amber-700' },
  urgent: { label: 'Urgent', color: 'bg-rose-100 text-rose-700' },
};

const PriorityBadge = ({ priority }) => {
  const config = PRIORITY_CONFIG[priority] || PRIORITY_CONFIG.low;
  return <span className={clsx('badge', config.color)}>{config.label}</span>;
};

export default PriorityBadge;