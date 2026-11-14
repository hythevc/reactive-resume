import { useSyncExternalStore } from "react";

const bars = new Map<object, number>();
const listeners = new Set<() => void>();
let height = 0;

/** Focused bars publish their measured height, including safe area. Zero releases that owner's inset. */
export function setBottomBarHeight(owner: object, next: number) {
	if (next > 0 && Number.isFinite(next)) bars.set(owner, next);
	else bars.delete(owner);
	const measured = Math.max(0, ...bars.values());
	if (measured === height) return;
	height = measured;
	for (const notify of listeners) notify();
}

export function useBottomBarHeight() {
	return useSyncExternalStore(
		(notify) => {
			listeners.add(notify);
			return () => listeners.delete(notify);
		},
		() => height,
		() => 0,
	);
}
