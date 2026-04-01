import React, { useEffect, useRef } from 'react';
import { Course, sortOrganizers } from '../types';
import * as L from 'leaflet';
import { formatPrice } from '../constants';

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

export const MapView: React.FC<MapViewProps> = ({ courses, onSelectCourse }) => {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const layerGroupRef = useRef<L.LayerGroup | null>(null);

  // Initialize Map
  useEffect(() => {
    if (!mapContainerRef.current || mapInstanceRef.current) return;

    // Create Map
    const map = L.map(mapContainerRef.current, {
        zoomControl: false,
        attributionControl: false,
        scrollWheelZoom: true, // Enable zoom with scroll wheel
        preferCanvas: true
    }).setView([52.1326, 5.2913], 7);

    // Tiles - Light variant for clean look and speed
    L.tileLayer('https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png', {
      maxZoom: 20,
      subdomains: 'abcd'
    }).addTo(map);

    // Controls
    L.control.zoom({ position: 'bottomright' }).addTo(map);

    // Layer Group for markers
    const layerGroup = L.layerGroup().addTo(map);
    layerGroupRef.current = layerGroup;
    mapInstanceRef.current = map;

    // Handle Resize (fix for grey tiles if container resizes/animates in)
    const resizeObserver = new ResizeObserver(() => {
        if (map) map.invalidateSize();
    });
    resizeObserver.observe(mapContainerRef.current);

    return () => {
      resizeObserver.disconnect();
      map.remove();
      mapInstanceRef.current = null;
    };
  }, []);

  // Update Markers
  useEffect(() => {
    if (!layerGroupRef.current || !mapInstanceRef.current) return;
    
    const layerGroup = layerGroupRef.current;
    layerGroup.clearLayers();

    const coordTracker: Record<string, number> = {};

    courses.forEach(course => {
        if (course.location === 'Online') return;

        let [lat, lng] = getCoordinates(course.location, course.region);
        
        // Stacking logic for courses at same location
        const key = `${lat.toFixed(4)},${lng.toFixed(4)}`;
        if (coordTracker[key]) {
            const count = coordTracker[key];
            const angle = count * (Math.PI / 3); 
            const radius = 0.00015 * count; 
            lat = lat + Math.cos(angle) * radius; 
            lng = lng + Math.sin(angle) * radius * 1.5; 
            coordTracker[key]++;
        } else {
            coordTracker[key] = 1;
        }

        const isKVLO = course.organizers?.includes('KVLO');
        const isALO = course.organizers?.includes('ALO Nederland');

        // Icon Colors
        const color = isKVLO ? '#7AB800' : isALO ? '#00C1D4' : '#7e22ce';
        
        const customIcon = L.divIcon({
            className: '', // Empty to remove default white square if configured in CSS, or we style inline
            html: `
                <div style="
                    background-color: ${color}; 
                    width: 14px; 
                    height: 14px; 
                    border-radius: 50%; 
                    border: 2px solid white; 
                    box-shadow: 0 2px 5px rgba(0,0,0,0.25);
                    cursor: pointer;
                    transition: transform 0.2s ease;
                "></div>
            `,
            iconSize: [14, 14],
            iconAnchor: [7, 7],
            popupAnchor: [0, -8]
        });

        const marker = L.marker([lat, lng], { icon: customIcon });

        // Popup Content Construction (DOM API for performance & event safety)
        const popupContent = document.createElement('div');
        popupContent.className = 'w-[280px] font-sans p-4 bg-white';
        
        // Header
        const header = document.createElement('div');
        header.className = 'flex items-center justify-between mb-3 gap-2';
        
        const organizersContainer = document.createElement('div');
        organizersContainer.className = 'flex flex-wrap gap-1';
        
        sortOrganizers(course.organizers).forEach(org => {
            const span = document.createElement('span');
            const orgBadgeColor = org === 'KVLO' 
                ? 'bg-[#ecfccb] text-[#4d7c0f] border-[#84cc16]' 
                : org === 'ALO Nederland' 
                  ? 'bg-[#cffafe] text-[#0891b2] border-[#06b6d4]'
                  : 'bg-[#f3e8ff] text-[#7e22ce] border-[#d8b4fe]';
            span.className = `px-1.5 py-0.5 rounded text-[9px] font-black uppercase tracking-wider border shadow-sm ${orgBadgeColor}`;
            span.textContent = org;
            organizersContainer.appendChild(span);
        });
        
        header.appendChild(organizersContainer);

        const regionBadge = document.createElement('span');
        regionBadge.className = 'text-[10px] font-bold text-slate-400 bg-slate-50 px-1.5 py-0.5 rounded border border-slate-100 whitespace-nowrap';
        regionBadge.textContent = course.region;
        header.appendChild(regionBadge);
        
        popupContent.appendChild(header);

        // Title
        const title = document.createElement('h3');
        title.className = 'font-bold text-slate-800 text-sm leading-snug line-clamp-2 mb-2';
        title.textContent = course.title;
        popupContent.appendChild(title);

        // Meta Info (Price & Location)
        const meta = document.createElement('div');
        meta.className = 'flex items-center justify-between mb-3 text-xs';
        
        let priceHtml = '';
        if (course.price === 0) {
            priceHtml = '<span class="font-black text-[10px] px-1.5 py-0.5 bg-green-100 text-green-700 rounded uppercase tracking-wider">Gratis</span>';
        } else if (course.price === undefined || course.price === null) {
            priceHtml = '<span class="font-bold text-[10px] text-slate-400 italic">Kosten op aanvraag</span>';
        } else {
            priceHtml = `<span class="font-black text-[#7AB800]">${formatPrice(course.price)}</span>`;
        }

        meta.innerHTML = `
            ${priceHtml}
            <span class="text-slate-500 flex items-center gap-1">
                <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z"/><circle cx="12" cy="10" r="3"/></svg>
                ${course.location}
            </span>
        `;
        popupContent.appendChild(meta);

        // Date Info
        const info = document.createElement('div');
        info.className = 'flex items-center gap-2 text-xs text-slate-500 font-medium pb-2 border-b border-slate-50 mb-2';
        const dateString = course.date && course.date.trim() !== '' ? new Date(course.date).toLocaleDateString('nl-NL') : 'Zonder startdatum';
        info.innerHTML = `
             <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect width="18" height="18" x="3" y="4" rx="2" ry="2"/><line x1="16" x2="16" y1="2" y2="6"/><line x1="8" x2="8" y1="2" y2="6"/><line x1="3" x2="21" y1="10" y2="10"/></svg>
             <span>${dateString}</span>
        `;
        popupContent.appendChild(info);

        // Description snippet
        const desc = document.createElement('p');
        desc.className = 'text-slate-500 text-[11px] mb-4 line-clamp-2 leading-relaxed';
        desc.textContent = course.description;
        popupContent.appendChild(desc);

        // Button
        const btn = document.createElement('button');
        btn.className = 'w-full bg-slate-50 hover:bg-white text-slate-600 hover:text-[#00C1D4] hover:border-[#00C1D4] text-xs font-bold py-2.5 px-3 rounded-lg border border-slate-200 transition-all flex items-center justify-center gap-2 shadow-sm';
        btn.textContent = 'Details bekijken';
        
        // Native Click Listener
        btn.onclick = (e) => {
            e.stopPropagation(); // Stop Leaflet map click bubbling
            onSelectCourse(course);
        };
        
        popupContent.appendChild(btn);

        marker.bindPopup(popupContent, {
            maxWidth: 280,
            minWidth: 280,
            closeButton: true,
            autoPan: false, // Disables the jumping
            offset: [0, 2]
        });

        // Hover Effects
        marker.on('mouseover', function (e) {
            this.setZIndexOffset(1000);
            const el = e.target.getElement()?.querySelector('div');
            if(el) el.style.transform = 'scale(1.3)';
        });
        marker.on('mouseout', function (e) {
            this.setZIndexOffset(0);
             const el = e.target.getElement()?.querySelector('div');
            if(el) el.style.transform = 'scale(1)';
        });

        layerGroup.addLayer(marker);
    });

  }, [courses, onSelectCourse]);

  // Removed 'animate-in' class to ensure map container size is stable on mount
  return (
    <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden h-[600px] relative">
        <div ref={mapContainerRef} className="w-full h-full z-0" />
        <div className="absolute bottom-6 left-6 bg-white/95 backdrop-blur px-4 py-3 rounded-xl shadow-lg shadow-slate-200/50 text-xs font-medium z-[400] border border-slate-100">
            <div className="flex items-center gap-4">
                <span className="flex items-center gap-2 text-slate-600 font-bold"><div className="w-2.5 h-2.5 rounded-full bg-[#7AB800] ring-2 ring-white shadow-sm"></div> KVLO</span>
                <span className="flex items-center gap-2 text-slate-600 font-bold"><div className="w-2.5 h-2.5 rounded-full bg-[#00C1D4] ring-2 ring-white shadow-sm"></div> ALO Nederland</span>
            </div>
        </div>
    </div>
  );
};