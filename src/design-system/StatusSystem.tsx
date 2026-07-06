

export type StatusType = 'pending' | 'preparing' | 'processing' | 'ready' | 'completed' | 'cancelled' | 'active' | 'expired';

export function StatusPill({ status, label }: { status: StatusType | string; label?: string }) {
  const normalizedStatus = status.toLowerCase();
  
  let colorClass = 'bg-gray-100 text-gray-700'; // Default

  switch (normalizedStatus) {
    case 'pending':
      colorClass = 'bg-erp-warning/10 text-erp-warning';
      break;
    case 'preparing':
    case 'processing':
      colorClass = 'bg-orange-500/10 text-orange-600';
      break;
    case 'ready':
      colorClass = 'bg-purple-500/10 text-purple-600';
      break;
    case 'completed':
    case 'active':
      colorClass = 'bg-erp-success/10 text-erp-success';
      break;
    case 'cancelled':
    case 'expired':
      colorClass = 'bg-erp-danger/10 text-erp-danger';
      break;
  }

  const displayLabel = label || status.toUpperCase();

  return (
    <span className={`inline-flex items-center justify-center px-[8px] py-[4px] rounded-[6px] text-[11px] font-[700] uppercase tracking-[1px] ${colorClass}`}>
      {displayLabel}
    </span>
  );
}
