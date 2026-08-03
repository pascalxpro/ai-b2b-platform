'use client';

import { useSyncExternalStore } from 'react';
import { createPortal } from 'react-dom';

/**
 * Renders children into document.body.
 *
 * Needed because PageTransition wraps every dashboard page in an element with a
 * `transform`, and any non-`none` transform makes that element the containing
 * block for `position: fixed` descendants. Overlays rendered inside a page were
 * therefore positioned against the (full-height) page wrapper instead of the
 * viewport, so a tall page pushed modals partly off-screen — the header could
 * end up scrolled above the top edge and become unreachable.
 *
 * Rendering through a portal puts the overlay outside that transformed subtree,
 * so `position: fixed` resolves against the viewport again.
 */

// Never resubscribes — the value only needs to differ between server and client.
const subscribe = () => () => {};
const isClient = () => true;
const isServer = () => false;

export default function Portal({ children }: { children: React.ReactNode }) {
  // document.body only exists after hydration; useSyncExternalStore gives the
  // server/client split without a setState-in-effect cascade.
  const mounted = useSyncExternalStore(subscribe, isClient, isServer);

  if (!mounted) return null;
  return createPortal(children, document.body);
}
