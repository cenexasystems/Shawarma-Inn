import { Bell, CheckCheck } from 'lucide-react';
import { useMemo, useState } from 'react';
import { buildSystemAlerts, readLocalStorage, STORAGE_KEYS, writeLocalStorage } from '../../utils/localStorage';

export default function AdminTopBar() {
  const [open, setOpen] = useState(false);
  const [unread, setUnread] = useState<number>(
    readLocalStorage<number>(STORAGE_KEYS.unreadAlerts, 0),
  );

  const alerts = useMemo(() => buildSystemAlerts(), []);

  const unreadCount = Math.max(alerts.length - unread, 0);

  const markAllRead = () => {
    writeLocalStorage(STORAGE_KEYS.unreadAlerts, alerts.length);
    setUnread(alerts.length);
  };

  return (
    <div className="h-14 border-b border-white/10 px-4 flex items-center justify-end bg-[#0f0f0f]">
      <div className="relative">
        <button
          onClick={() => setOpen((prev) => !prev)}
          className="relative inline-flex items-center justify-center h-9 w-9 rounded-full border border-white/15 text-white/80 hover:text-white hover:border-white/30"
          aria-label="Notifications"
        >
          <Bell className="h-4 w-4" />
          {unreadCount > 0 && (
            <span className="absolute -top-1 -right-1 min-w-[18px] h-[18px] px-1 rounded-full bg-[#f97316] text-[10px] text-black font-bold flex items-center justify-center">
              {unreadCount}
            </span>
          )}
        </button>

        {open && (
          <div className="absolute right-0 mt-2 w-80 rounded-xl border border-white/10 bg-[#171717] shadow-2xl z-20">
            <div className="px-3 py-2 border-b border-white/10 flex items-center justify-between">
              <p className="text-sm font-semibold">Recent Alerts</p>
              <button
                onClick={markAllRead}
                className="text-xs text-white/60 hover:text-white inline-flex items-center gap-1"
              >
                <CheckCheck className="h-3.5 w-3.5" />
                Mark all read
              </button>
            </div>
            <div className="max-h-80 overflow-auto">
              {alerts.length === 0 && (
                <p className="px-3 py-4 text-sm text-white/50">No alerts at the moment.</p>
              )}
              {alerts.map((alert) => (
                <div key={alert.id} className="px-3 py-2 border-b border-white/5">
                  <p className={`text-sm ${alert.level === 'warning' ? 'text-orange-300' : 'text-blue-300'}`}>
                    {alert.message}
                  </p>
                  <p className="text-[11px] text-white/40 mt-1">
                    {new Date(alert.createdAt).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}
                  </p>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
