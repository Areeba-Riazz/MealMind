import { useState, useEffect } from 'react';

interface GeolocationState {
  lat: number | null;
  lng: number | null;
  denied: boolean;
  loading: boolean;
}

export function useGeolocation(): GeolocationState {
  const [state, setState] = useState<GeolocationState>({
    lat: null,
    lng: null,
    denied: false,
    loading: true,
  });

  useEffect(() => {
    if (!navigator.geolocation) {
      setState({ lat: null, lng: null, denied: true, loading: false });
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        setState({
          lat: position.coords.latitude,
          lng: position.coords.longitude,
          denied: false,
          loading: false,
        });
      },
      (error) => {
        const denied = error.code === GeolocationPositionError.PERMISSION_DENIED;
        setState({ lat: null, lng: null, denied, loading: false });
      }
    );
  }, []);

  return state;
}
