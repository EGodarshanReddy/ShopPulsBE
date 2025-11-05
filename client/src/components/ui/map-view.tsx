import { useEffect, useRef } from "react";
import { Card } from "@/components/ui/card";

interface Location {
  latitude: string | number;
  longitude: string | number;
  name?: string;
}

interface MapViewProps {
  location: Location;
  height?: string;
  zoom?: number;
  className?: string;
}

export function MapView({ 
  location, 
  height = "200px", 
  zoom = 15,
  className
}: MapViewProps) {
  const mapRef = useRef<HTMLDivElement>(null);
  
  useEffect(() => {
    // In a real implementation, this would use the Google Maps API
    // For now, we'll create a placeholder with location info
    if (mapRef.current) {
      const mapUrl = `https://maps.google.com/maps?q=${location.latitude},${location.longitude}&z=${zoom}&output=embed`;
      const iframe = document.createElement('iframe');
      iframe.setAttribute('src', mapUrl);
      iframe.style.width = '100%';
      iframe.style.height = '100%';
      iframe.style.border = 'none';
      iframe.style.borderRadius = 'inherit';
      
      // Clear previous content
      while (mapRef.current.firstChild) {
        mapRef.current.removeChild(mapRef.current.firstChild);
      }
      
      mapRef.current.appendChild(iframe);
    }
  }, [location, zoom]);
  
  const openInMaps = () => {
    const url = `https://www.google.com/maps/search/?api=1&query=${location.latitude},${location.longitude}`;
    window.open(url, '_blank');
  };
  
  return (
    <div className="relative">
      <Card 
        className="overflow-hidden"
        style={{ height }}
        onClick={openInMaps}
      >
        <div ref={mapRef} className="w-full h-full bg-neutral-100 flex items-center justify-center">
          <span className="material-icons text-4xl text-neutral-400">map</span>
        </div>
      </Card>
      <div className="absolute bottom-2 right-2">
        <button 
          onClick={openInMaps}
          className="bg-white rounded-full p-2 shadow-md"
        >
          <span className="material-icons text-neutral-700">directions</span>
        </button>
      </div>
    </div>
  );
}
