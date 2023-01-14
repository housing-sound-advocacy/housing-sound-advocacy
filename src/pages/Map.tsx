import React, { useRef, useEffect, useState } from 'react';
import mapboxgl from 'mapbox-gl';
import Overlays from '../manual/overlays';
import Circles from '../manual/circles';
import Popups from '../popups';

export default function Map() {
  mapboxgl.accessToken = process.env.REACT_APP_MAPBOX_TOKEN;
  const mapContainer = useRef(null);
  const map = useRef(null);
  const [lng] = useState(-79.383186);
  const [lat] = useState(43.653225);
  const [zoom] = useState(13);
  // const ward = new Ward();
  const overlays = new Overlays();
  const circles = new Circles();
  const popups = new Popups();

  const mapStyles = {
    width: '100vw',
    height: '100vh',
  };

  useEffect(() => {
    console.warn('useEffect');
    if (map.current) return; // initialize map only once
    console.warn('useEffect: initializing map');
    map.current = new mapboxgl.Map({
      container: mapContainer.current,
      style: 'mapbox://styles/mapbox/streets-v11',
      center: [lng, lat],
      zoom: zoom,
    });
  });
  useEffect(() => {
    if (!map.current) return; // initialize map only once
    map.current.on('load', () => {
      overlays.addOverlays(map.current);
      circles.addOverlays(map.current);
      popups.addPopups(map.current);
      // ward.torontoWardsJSONfromKML(map.current);
    });
  });
  return (
    <div>
      <div style={mapStyles} ref={mapContainer} className="map-container" />
    </div>
  );
}
