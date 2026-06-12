import { Inbox } from 'lucide-react';

const EmptyState = ({ icon: Icon = Inbox, title = 'No data', message = 'Nothing to show here yet.', action }) => (
  <div className="flex flex-col items-center justify-center py-16 text-center">
    <div className="w-20 h-20 bg-slate-100 rounded-2xl flex items-center justify-center mb-4">
      <Icon className="w-10 h-10 text-slate-400" />
    </div>
    <h3 className="font-semibold text-slate-900 mb-2">{title}</h3>
    <p className="text-sm text-slate-500 mb-6 max-w-sm">{message}</p>
    {action}
  </div>
);

export default EmptyState;