import { useEffect } from 'react';
import { MapContainer, Marker, Popup, TileLayer, useMap } from 'react-leaflet';
import { LatLngBounds, Icon } from 'leaflet';
import markerIcon2xUrl from 'leaflet/dist/images/marker-icon-2x.png';
import markerIconUrl from 'leaflet/dist/images/marker-icon.png';
import markerShadowUrl from 'leaflet/dist/images/marker-shadow.png';
import { formatDate, formatTime } from '../lib/utils';
import type { Sighting } from '../types';

const sightingMarkerIcon = new Icon({
  iconRetinaUrl: markerIcon2xUrl,
  iconUrl: markerIconUrl,
  shadowUrl: markerShadowUrl,
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
});

export interface MappableSighting extends Sighting {
  latitude: number;
  longitude: number;
}

export default function SightingsMap({
  sightings,
  onSelect,
}: {
  sightings: MappableSighting[];
  onSelect: (sighting: Sighting) => void;
}) {
  const defaultCenter: [number, number] = sightings.length > 0
    ? [sightings[0].latitude, sightings[0].longitude]
    : [37.8, -96.9];

  return (
    <div className="sighting-map overflow-hidden rounded-2xl border border-forest-800 bg-forest-950">
      <MapContainer
        center={defaultCenter}
        zoom={5}
        scrollWheelZoom={false}
        className="h-80 w-full"
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        <FitSightingsBounds sightings={sightings} />
        {sightings.map((sighting) => (
          <Marker
            key={sighting.id}
            position={[sighting.latitude, sighting.longitude]}
            icon={sightingMarkerIcon}
          >
            <Popup>
              <div className="space-y-2">
                <div>
                  <p className="font-semibold text-forest-100">{sighting.speciesNameSnapshot ?? 'Unknown bird'}</p>
                  <p className="text-xs text-forest-400">
                    {formatDate(sighting.createdAt)} · {formatTime(sighting.createdAt)}
                  </p>
                </div>
                {sighting.notes && (
                  <p className="text-xs text-forest-300">{sighting.notes}</p>
                )}
                <button
                  onClick={() => onSelect(sighting)}
                  className="rounded-lg bg-forest-700 px-3 py-1.5 text-xs font-medium text-forest-100 transition-colors hover:bg-forest-600"
                >
                  Open sighting
                </button>
              </div>
            </Popup>
          </Marker>
        ))}
      </MapContainer>
    </div>
  );
}

function FitSightingsBounds({ sightings }: { sightings: MappableSighting[] }) {
  const map = useMap();

  useEffect(() => {
    if (sightings.length === 0) {
      return;
    }

    const bounds = new LatLngBounds(
      sightings.map((sighting) => [sighting.latitude, sighting.longitude] as [number, number]),
    );

    map.fitBounds(bounds, { padding: [24, 24], maxZoom: 11 });
  }, [map, sightings]);

  return null;
}