import { useState, useEffect, useCallback } from 'react';

interface Location {
    lat: number;
    lng: number;
}

interface GeolocationState {
    location: Location | null;
    error: {
        code: number;
        message: string;
    } | null;
    loading: boolean;
}

export function useGeolocation() {
    const [state, setState] = useState<GeolocationState>({
        location: null,
        error: null,
        loading: true,
    });

    const getPosition = useCallback(() => {
        if (!navigator.geolocation) {
            setState(s => ({
                ...s,
                loading: false,
                error: { code: 0, message: 'Geolocation is not supported by your browser' }
            }));
            return;
        }

        setState(s => ({ ...s, loading: true, error: null }));

        navigator.geolocation.getCurrentPosition(
            (pos) => {
                setState({
                    location: { lat: pos.coords.latitude, lng: pos.coords.longitude },
                    error: null,
                    loading: false,
                });
            },
            (err) => {
                setState({
                    location: null,
                    error: { code: err.code, message: err.message },
                    loading: false,
                });
            },
            {
                enableHighAccuracy: true,
                timeout: 5000,
                maximumAge: 0,
            }
        );
    }, []);

    useEffect(() => {
        getPosition();
    }, [getPosition]);

    return { ...state, retry: getPosition };
}
