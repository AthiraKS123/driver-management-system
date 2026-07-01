import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import { useEffect } from 'react';

// Fix for default marker icon in react-leaflet
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
});

const MapBoundsManager = ({ drivers }) => {
  const map = useMap();

  useEffect(() => {
    const locations = drivers
      .filter(d => (d.status === 'online' || d.status === 'idle') && d.currentLocation && d.currentLocation.lat)
      .map(d => [d.currentLocation.lat, d.currentLocation.lng]);

    if (locations.length > 0) {
      if (locations.length === 1) {
        map.flyTo(locations[0], 14, { animate: true, duration: 1.5 });
      } else {
        const bounds = L.latLngBounds(locations);
        map.flyToBounds(bounds, { animate: true, duration: 1.5, padding: [50, 50] });
      }
    }
  }, [drivers, map]);

  return null;
};

const LiveMap = ({ drivers }) => {
  // Center map on the first driver with location, or default to some coordinates
  const defaultCenter = [40.7128, -74.0060]; // New York as default
  
  const center = drivers.find(d => d.currentLocation && d.currentLocation.lat)? 
    [drivers.find(d => d.currentLocation && d.currentLocation.lat).currentLocation.lat, drivers.find(d => d.currentLocation && d.currentLocation.lat).currentLocation.lng] : 
    defaultCenter;

  return (
    <div className="h-[600px] w-full rounded-3xl overflow-hidden border border-slate-700/50 shadow-2xl relative z-10">
      <MapContainer center={center} zoom={10} style={{ height: '100%', width: '100%', zIndex: 10 }}>
        <MapBoundsManager drivers={drivers} />
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        {drivers.map(driver => {
          if ((driver.status === 'online' || driver.status === 'idle') && driver.currentLocation && driver.currentLocation.lat) {
            return (
              <Marker key={driver._id} position={[driver.currentLocation.lat, driver.currentLocation.lng]}>
                <Popup>
                  <div className="text-slate-900 font-medium">
                    <p className="font-bold">{driver.name}</p>
                    <p className="text-sm">Status: {driver.status}</p>
                    <p className="text-sm text-slate-500">{driver.city}</p>
                  </div>
                </Popup>
              </Marker>
            );
          }
          return null;
        })}
      </MapContainer>
    </div>
  );
};

export default LiveMap;
