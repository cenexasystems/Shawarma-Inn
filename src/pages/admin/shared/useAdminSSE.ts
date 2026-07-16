import { useEffect, useRef } from 'react';

export type AdminSSEEvent =
  | 'new_order' | 'order_status' | 'customer_registered'
  | 'franchise_lead_created' | 'review_submitted' | 'coupon_created' | 'menu_updated';

export function playNewOrderBeep() {
  try {
    const ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.frequency.setValueAtTime(880, ctx.currentTime);
    osc.frequency.setValueAtTime(1100, ctx.currentTime + 0.1);
    osc.frequency.setValueAtTime(880, ctx.currentTime + 0.2);
    gain.gain.setValueAtTime(0.3, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.4);
    osc.start(ctx.currentTime);
    osc.stop(ctx.currentTime + 0.4);
  } catch { /* AudioContext unavailable */ }
}

export function useAdminSSE(
  token: string | null | undefined,
  handlers: Partial<Record<AdminSSEEvent, (data: any) => void>>,
) {
  const handlersRef = useRef(handlers);
  handlersRef.current = handlers;

  useEffect(() => {
    if (!token) return;
    const es = new EventSource(`/api/admin/events?token=${encodeURIComponent(token)}`);

    const events: AdminSSEEvent[] = [
      'new_order', 'order_status', 'customer_registered',
      'franchise_lead_created', 'review_submitted', 'coupon_created', 'menu_updated',
    ];

    const listeners = events.map((eventName) => {
      const listener = (e: MessageEvent) => {
        let data: any = {};
        try { data = JSON.parse(e.data || '{}'); } catch { /* ignore */ }
        handlersRef.current[eventName]?.(data);
      };
      es.addEventListener(eventName, listener as EventListener);
      return { eventName, listener };
    });

    return () => {
      listeners.forEach(({ eventName, listener }) => es.removeEventListener(eventName, listener as EventListener));
      es.close();
    };
  }, [token]);
}
