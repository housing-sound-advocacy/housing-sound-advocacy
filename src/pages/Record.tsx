import React, { useState } from 'react';
import { useReactMediaRecorder } from 'react-media-recorder';
import { BaseStyles, Box, Button } from '@primer/react';
import { CircleIcon, StopIcon } from '@primer/octicons-react';
import Map from './Map';

export default function Record() {

  const reload = () => {
    window.location.reload();
  };

  const RecordView = () => {

    const [hideUpload, setHideUpload] = useState(true);
    const [markerLat, setMarkerLat] = useState(0);
    const [markerLng, setMarkerLng] = useState(0);

    const updateMarkers = (lat: number, lng: number) => {
      setMarkerLat(lat);
      setMarkerLng(lng);
      setHideUpload(false);
    };

    const upload = async () => {
      console.warn('Going to upload');
      console.warn(`Lat: ${markerLat}`);
      console.warn(`Lng: ${markerLng}`);
    };

    const { status, startRecording, stopRecording, mediaBlobUrl } =
      useReactMediaRecorder({ video: false, audio: true, blobPropertyBag: { type: 'audio/mp4' } });

    const recordButton = () => {
      if (status === 'idle') {
        return <Button onClick={startRecording} leadingIcon={CircleIcon}>Start Recording</Button>;
      }
      if (status === 'recording') {
        return <Button onClick={stopRecording} leadingIcon={StopIcon}>Stop Recording</Button>;
      }
      if (status === 'stopped') {
        return (
            <>
              <audio src={mediaBlobUrl} controls={true}/>
              <Button onClick={reload}>Restart</Button>
              {hideUpload ? null : <Button onClick={upload}>Upload</Button>}
              <Map updateMarkers={updateMarkers} />
            </>
        );
      }
    };

    return (
      <BaseStyles>
        <Box m={4}>
          <div>
            {recordButton()}
            <p>{status}</p>
          </div>
        </Box>
      </BaseStyles>
    );
  };

  return (
    <RecordView />
  );
}
