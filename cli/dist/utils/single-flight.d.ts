/**
 * Runs a load and applies its result, but starts nothing while a previous load is still running. A poll on a timer
 * therefore never overlaps itself: results cannot arrive out of order, and a slow Tilt cannot make every poll get
 * superseded before it finishes.
 */
export declare function singleFlight<T>(apply: (value: T) => void): (load: () => Promise<T>) => Promise<void>;
//# sourceMappingURL=single-flight.d.ts.map