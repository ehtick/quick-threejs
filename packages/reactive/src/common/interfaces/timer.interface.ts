/**
 * @description Timing values emitted on each animation frame.
 *
 * @note Must remain structured-clone-safe for worker ↔ main thread observables.
 */
export interface TimerFramePayload {
	fps: number;
	frame: number;
	initialTime: number;
	elapsed: number;
	previousDelta: number;
	delta: number;
	deltaRatio: number;
	enabled: boolean;
}
