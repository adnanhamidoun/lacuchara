import React, { useState, useEffect } from 'react';
import { MapPin, AlertCircle, CheckCircle2, Clock } from 'lucide-react';
import {
  requestGeolocationPermission,
  getUserLocation,
  getGeolocationErrorMessage,
  saveUserLocationLocal,
  loadUserLocationLocal
} from '../services/geolocationService';

/**
 * Componente que solicita permisos de geolocalización
 * Aparece al cargar la aplicación
 */
export function GeolocationPrompt({ onLocationReceived, onDismiss }) {
  const [status, setStatus] = useState('idle'); // idle, loading, success, denied, error
  const [message, setMessage] = useState('');
  const [location, setLocation] = useState(null);

  useEffect(() => {
    // Verificar si ya tenemos ubicación guardada
    const cached = loadUserLocationLocal(30);
    if (cached) {
      setStatus('success');
      setLocation(cached);
      onLocationReceived?.(cached);
      return;
    }

    // Verificar permisos
    checkPermissionStatus();
  }, []);

  const checkPermissionStatus = async () => {
    try {
      const permission = await requestGeolocationPermission();
      console.log("Estado de permisos:", permission);
      
      if (permission === 'denied') {
        setStatus('denied');
        setMessage('Permisos de ubicación denegados. Puedes habilitarlos en la configuración de tu navegador.');
      }
    } catch (error) {
      console.error("Error verificando permisos:", error);
    }
  };

  const handleRequestLocation = async () => {
    setStatus('loading');
    setMessage('Obteniendo tu ubicación...');

    try {
      const coords = await getUserLocation();
      setLocation(coords);
      saveUserLocationLocal(coords);
      setStatus('success');
      setMessage('¡Ubicación obtenida!');
      
      onLocationReceived?.(coords);

      // Auto-cerrar después de 2 segundos si tiene éxito
      setTimeout(() => {
        handleDismiss();
      }, 2000);
    } catch (error) {
      setStatus('error');
      setMessage(getGeolocationErrorMessage(error));
      console.error("Error:", error);
    }
  };

  const handleDismiss = () => {
    onDismiss?.();
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6 space-y-4">
        {/* Header icon */}
        <div className="flex items-center gap-3">
          <MapPin className="w-6 h-6 text-blue-500" />
          <h2 className="text-xl font-bold text-gray-900">Geolocalización</h2>
        </div>

        {/* Content */}
        <div className="space-y-3">
          {status === 'idle' && (
            <p className="text-gray-700">
              Activa la geolocalización para ver restaurantes cercanos. Te mostraremos la distancia a cada uno.
            </p>
          )}

          {status === 'loading' && (
            <div className="flex items-center gap-2 text-blue-600">
              <Clock className="w-5 h-5 animate-spin" />
              <p>{message}</p>
            </div>
          )}

          {status === 'success' && (
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-green-600 mb-3">
                <CheckCircle2 className="w-5 h-5" />
                <span className="font-medium">{message}</span>
              </div>
              <p className="text-sm text-gray-600">
                📍 Latitud: {location?.latitude.toFixed(4)}<br/>
                📍 Longitud: {location?.longitude.toFixed(4)}
              </p>
            </div>
          )}

          {status === 'denied' && (
            <div className="flex items-start gap-2 text-amber-600 bg-amber-50 p-3 rounded">
              <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
              <p className="text-sm">{message}</p>
            </div>
          )}

          {status === 'error' && (
            <div className="flex items-start gap-2 text-red-600 bg-red-50 p-3 rounded">
              <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
              <p className="text-sm">{message}</p>
            </div>
          )}
        </div>

        {/* Actions */}
        <div className="flex gap-3 pt-2">
          {(status === 'idle' || status === 'error') && (
            <button
              onClick={handleRequestLocation}
              disabled={status === 'denied'}
              className="flex-1 bg-blue-500 hover:bg-blue-600 disabled:bg-gray-300 text-white font-medium py-2 px-4 rounded-lg transition"
            >
              Compartir ubicación
            </button>
          )}

          <button
            onClick={handleDismiss}
            className="flex-1 bg-gray-200 hover:bg-gray-300 text-gray-900 font-medium py-2 px-4 rounded-lg transition"
          >
            {status === 'success' ? 'Cerrar' : 'O después'}
          </button>
        </div>

        {/* Help text */}
        <p className="text-xs text-gray-500 text-center">
          Tu ubicación se guardará localmente y se usará para mostrar restaurantes cercanos.
        </p>
      </div>
    </div>
  );
}

export default GeolocationPrompt;
