import React, { useRef, useEffect, useState } from 'react';
import { Map as MapGL } from 'mapbox-gl';
import { Box } from '@primer/react';
import mapboxgl from 'mapbox-gl';
import { MapTouchEvent } from 'mapbox-gl';

export interface MapProps {
  updateMarkers?: (lat: number, lng: number) => void;
}

export default function Map( props: MapProps) {
  mapboxgl.accessToken = process.env.REACT_APP_MAPBOX_TOKEN;
  const mapContainer = useRef(null);
  const map = useRef<MapGL>(null);
  const [lng] = useState(-79.383186);
  const [lat] = useState(43.653225);
  const [zoom] = useState(13);
  const [marker] = useState(new mapboxgl.Marker());

  const mapStyles = {
    width: '90vw',
    height: '90vh',
  };

  const addMarker = (e: MapTouchEvent) => {
    e.preventDefault();
    const coordinates = e.lngLat;
    props.updateMarkers(coordinates.lat, coordinates.lng);
    marker.setLngLat(coordinates).addTo(map.current);
  };

  useEffect(() => {
    if (map.current) return; // initialize map only once
    map.current = new mapboxgl.Map({
      container: mapContainer.current,
      style: 'mapbox://styles/mapbox/streets-v11',
      center: [lng, lat],
      zoom: zoom,
    });
    map.current.addControl(new mapboxgl.NavigationControl(), 'bottom-right');
    map.current.addControl(new mapboxgl.GeolocateControl({
      positionOptions: {
        enableHighAccuracy: true,
      },
      trackUserLocation: true,
      showUserHeading: true,
    }));
    map.current.on('click', addMarker.bind(this));
  });

  return (
    <Box>
      <div style={mapStyles} ref={mapContainer} className="map-container" />
    </Box>
  );
}
