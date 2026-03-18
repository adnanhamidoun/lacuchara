import { createContext, useContext, useState, useEffect } from 'react';
import { loadUserLocationLocal, saveUserLocationLocal } from '../services/geolocationService';

const LocationContext = createContext(null);

export function LocationProvider({ children }) {
  const [userLocation, setUserLocation] = useState(null);
  const [locationLoading, setLocationLoading] = useState(false);
  const [locationError, setLocationError] = useState(null);

  // Cargar ubicación guardada al iniciar
  useEffect(() => {
    const cached = loadUserLocationLocal(30);
    if (cached) {
      console.log('📍 Ubicación cargada del cache:', cached);
      setUserLocation(cached);
    }
  }, []);

  const updateLocation = (location) => {
    if (location) {
      saveUserLocationLocal(location);
      setUserLocation(location);
      setLocationError(null);
    }
  };

  const clearLocation = () => {
    setUserLocation(null);
  };

  return (
    <LocationContext.Provider
      value={{
        userLocation,
        locationLoading,
        locationError,
        updateLocation,
        clearLocation,
        setLocationLoading,
        setLocationError,
      }}
    >
      {children}
    </LocationContext.Provider>
  );
}

export function useUserLocation() {
  const context = useContext(LocationContext);
  if (!context) {
    throw new Error('useUserLocation must be used within LocationProvider');
  }
  return context;
}
