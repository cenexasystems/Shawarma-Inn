

export type StatusType = 'pending' | 'processing' | 'completed' | 'cancelled' | 'active' | 'expired';

export function StatusPill({ status, label }: { status: StatusType | string; label?: string }) {
  const normalizedStatus = status.toLowerCase();
  
  let colorClass = 'bg-gray-100 text-gray-700 border-gray-200'; // Default

  switch (normalizedStatus) {
    case 'pending':
      colorClass = 'bg-erp-warning/10 text-erp-warning border-erp-warning/20';
      break;
    case 'processing':
      colorClass = 'bg-erp-blue/10 text-erp-blue border-erp-blue/20';
      break;
    case 'completed':
    case 'active':
      colorClass = 'bg-erp-success/10 text-erp-success border-erp-success/20';
      break;
    case 'cancelled':
    case 'expired':
      colorClass = 'bg-erp-danger/10 text-erp-danger border-erp-danger/20';
      break;
  }

  const displayLabel = label || status.toUpperCase();

  return (
    <span className={`inline-flex h-[36px] items-center justify-center px-[14px] rounded-full border text-[13px] font-[600] uppercase tracking-[0.02em] ${colorClass}`}>
      {displayLabel}
    </span>
  );
}
