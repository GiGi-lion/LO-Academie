import React, { useEffect, useRef } from 'react';
import { createRoot } from 'react-dom/client';
import { Course, Organizer } from '../types';
import * as L from 'leaflet';
import { Calendar } from 'lucide-react';

interface MapViewProps {
  courses: Course[];
  onSelectCourse: (course: Course) => void;
}

// Helper to estimate coordinates based on Dutch city names
const getCoordinates = (location: string, region: string): [number, number] => {
  const loc = location.toLowerCase();
  
  if (loc.includes('nijmegen')) return [51.8449, 5.8676];
  if (loc.includes('amsterdam')) return [52.3676, 4.9041];
  if (loc.includes('meppel') || loc.includes('wanneperveen')) return [52.6936, 6.1945];
  if (loc.includes('alkmaar')) return [52.6296, 4.7571];
  if (loc.includes('zeist')) return [52.0907, 5.2328];
  if (loc.includes('houten')) return [52.0283, 5.1600];
  if (loc.includes('ede')) return [52.0305, 5.6664];
  if (loc.includes('rotterdam')) return [51.9244, 4.4777];
  if (loc.includes('leiden') || loc.includes('vlietland')) return [52.1601, 4.4970];
  if (loc.includes('zwolle')) return [52.5168, 6.0830];
  if (loc.includes('groningen')) return [53.2194, 6.5665];
  if (loc.includes('eindhoven') || loc.includes('fontys')) return [51.4416, 5.4697];
  if (loc.includes('tilburg')) return [51.5555, 5.0913];
  if (loc.includes('maastricht')) return [50.8514, 5.6910];
  if (loc.includes('utrecht')) return [52.0907, 5.1214];
  if (loc.includes('arnhem')) return [51.9851, 5.8987];
  if (loc.includes('den haag') || loc.includes('s-gravenhage')) return [52.0705, 4.3007];

  // Region Fallbacks
  if (region === 'Noord') return [53.0, 6.5]; 
  if (region === 'Oost') return [52.2, 6.5]; 
  if (region === 'Zuid') return [51.5, 5.0]; 
  if (region === 'West') return [52.1, 4.5]; 
  
  return [52.1326, 5.2913]; // Center of NL
};

// Helper to add slight random offset to prevent exact overlap
const jitter = (coord: number): number => {
    return coord + (Math.random() - 0.5) * 0.005;
};

const PopupContent: React.FC<{ course: Course; onSelect: () => void }> = ({ course, onSelect }) => {
    const orgColorClass = course.organizer === Organizer.KVLO ? 'text-[#7AB800]' : course.organizer === Organizer.ALO ? 'text-[#00C1D4]' : 'text-purple-600';
    const dateStr = new Date(course.date).toLocaleDateString('nl-NL');

    return (
        <div className="w-[280px] p-0 font-sans flex flex-col">
            <div className="p-4 bg-white">
                <div className="flex items-center justify-between mb-2">
                    <span className={`text-[10px] font-black uppercase tracking-wider ${orgColorClass}`}>
                    {course.organizer}
                    </span>
                    <span className="text-[10px] font-bold text-slate-400 bg-slate-50 px-1.5 py-0.5 rounded border border-slate-100">
                    {course.region}
                    </span>
                </div>
                
                <h3 className="font-bold text-slate-800 text-sm leading-snug line-clamp-2 mb-2">
                    {course.title}
                </h3>
                
                <div className="flex items-center gap-2 text-xs text-slate-500 font-medium pb-3 border-b border-slate-50 mb-3">
                     <Calendar className="w-3 h-3" />
                     <span>{dateStr}</span>
                </div>

                 <button 
                    onClick={(e) => {
                        e.stopPropagation();
                        onSelect();
                    }}
                    className="w-full bg-slate-50 hover:bg-white text-slate-600 hover:text-[#00C1D4] hover:border-[#00C1D4] text-xs font-bold py-2.5 px-3 rounded-lg border border-slate-200 transition-all flex items-center justify-center gap-2 shadow-sm"
                >
                    Details bekijken
                </button>
            </div>
        </div>
    );
};

export const MapView: React.FC<MapViewProps> = ({ courses, onSelectCourse }) => {
  const mapRef = useRef<HTMLDivElement>(null);
  const leafletMap = useRef<L.Map | null>(null);

  useEffect(() => {
    if (!mapRef.current || leafletMap.current) return;

    // Initialize Map with 'Voyager' tiles (Very similar to Google Maps style)
    leafletMap.current = L.map(mapRef.current, {
        zoomControl: false,
        attributionControl: false
    }).setView([52.1326, 5.2913], 7);

    L.tileLayer('https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png', {
      maxZoom: 20
    }).addTo(leafletMap.current);
    
    // Add custom zoom control to bottom right (Like Google)
    L.control.zoom({
        position: 'bottomright'
    }).addTo(leafletMap.current);

    // Clean up on unmount
    return () => {
      if (leafletMap.current) {
        leafletMap.current.remove();
        leafletMap.current = null;
      }
    };
  }, []);

  // Update Markers
  useEffect(() => {
    if (!leafletMap.current) return;

    // Clear existing markers
    leafletMap.current.eachLayer((layer) => {
        if (layer instanceof L.Marker) {
            leafletMap.current?.removeLayer(layer);
        }
    });

    // Track coordinates to handle stacking
    const coordTracker: Record<string, number> = {};

    courses.forEach(course => {
        if (course.location === 'Online') return;

        let [lat, lng] = getCoordinates(course.location, course.region);
        
        // Simple key to check existence (rounded to avoid float issues)
        const key = `${lat.toFixed(4)},${lng.toFixed(4)}`;
        
        if (coordTracker[key]) {
            // If location already exists, jitter slightly
            // We use a deterministic offset based on count so it doesn't jump around on re-renders if order is same
            const count = coordTracker[key];
            const angle = count * (Math.PI / 3); // Spread in a circle roughly
            const radius = 0.00015 * count; // Move further out as pile grows
            
            // Apply simple offset (converting somewhat to meters roughly, lat/lng degrees differ)
            lat = lat + Math.cos(angle) * radius; 
            lng = lng + Math.sin(angle) * radius * 1.5; // Longitude degrees are 'shorter' in NL
            
            coordTracker[key]++;
        } else {
            coordTracker[key] = 1;
        }
        
        // Custom color based on organizer
        const color = course.organizer === Organizer.KVLO ? '#7AB800' : course.organizer === Organizer.ALO ? '#00C1D4' : '#7e22ce';

        const customIcon = L.divIcon({
            className: 'custom-div-icon',
            html: `
                <div style="
                    background-color: ${color}; 
                    width: 16px; 
                    height: 16px; 
                    border-radius: 50%; 
                    border: 3px solid white; 
                    box-shadow: 0 2px 6px rgba(0,0,0,0.3);
                    transform: translate(-2px, -2px);
                    transition: transform 0.2s;
                "></div>
            `,
            iconSize: [12, 12],
            iconAnchor: [6, 6],
            popupAnchor: [0, -6]
        });

        const marker = L.marker([lat, lng], { icon: customIcon }).addTo(leafletMap.current!);

        // Create container for React Popup
        const container = document.createElement('div');
        const root = createRoot(container);
        
        // Render popup content
        root.render(
            <PopupContent course={course} onSelect={() => onSelectCourse(course)} />
        );

        marker.bindPopup(container, {
            maxWidth: 280,
            minWidth: 280,
            closeButton: true,
            autoPan: true,
            offset: [0, 2]
        });
        
        // Add hover effect
        marker.on('mouseover', function (e) {
            this.setZIndexOffset(1000);
            const el = e.target.getElement().querySelector('div');
            if(el) el.style.transform = 'translate(-2px, -2px) scale(1.3)';
        });
        marker.on('mouseout', function (e) {
            this.setZIndexOffset(0);
             const el = e.target.getElement().querySelector('div');
            if(el) el.style.transform = 'translate(-2px, -2px) scale(1)';
        });
    });

  }, [courses, onSelectCourse]);

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden h-[600px] relative animate-in fade-in duration-300">
        <div ref={mapRef} className="w-full h-full z-0" />
        <div className="absolute bottom-6 left-6 bg-white/95 backdrop-blur px-4 py-3 rounded-xl shadow-lg shadow-slate-200/50 text-xs font-medium z-[400] border border-slate-100">
            <div className="flex items-center gap-4">
                <span className="flex items-center gap-2 text-slate-600 font-bold"><div className="w-2.5 h-2.5 rounded-full bg-[#7AB800] ring-2 ring-white shadow-sm"></div> KVLO</span>
                <span className="flex items-center gap-2 text-slate-600 font-bold"><div className="w-2.5 h-2.5 rounded-full bg-[#00C1D4] ring-2 ring-white shadow-sm"></div> ALO Nederland</span>
            </div>
        </div>
    </div>
  );
};