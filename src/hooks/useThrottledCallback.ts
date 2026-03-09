import { useCallback, useRef } from 'react';

/**
 * A hook that returns a throttled version of the callback.
 * Unlike a standard throttle, this one ensures that the LAST call
 * within the delay period is eventually executed.
 */
export function useThrottledCallback<T extends (...args: any[]) => any>(
    callback: T,
    delay: number
): (...args: Parameters<T>) => void {
    const lastRun = useRef<number>(0);
    const timeoutRef = useRef<any>(null);
    const lastArgs = useRef<Parameters<T> | null>(null);

    return useCallback((...args: Parameters<T>) => {
        const now = Date.now();
        lastArgs.current = args;

        const execute = () => {
            if (timeoutRef.current) {
                clearTimeout(timeoutRef.current);
                timeoutRef.current = null;
            }
            lastRun.current = Date.now();
            callback(...(lastArgs.current as Parameters<T>));
            lastArgs.current = null;
        };

        if (now - lastRun.current >= delay) {
            execute();
        } else if (!timeoutRef.current) {
            timeoutRef.current = setTimeout(execute, delay - (now - lastRun.current));
        }
    }, [callback, delay]);
}
