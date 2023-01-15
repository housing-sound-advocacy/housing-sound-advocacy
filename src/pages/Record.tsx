import React, { useState } from 'react';
import { useReactMediaRecorder } from 'react-media-recorder';
import { BaseStyles, Box, Button, Text } from '@primer/react';
import { CircleIcon, StopIcon, UploadIcon } from '@primer/octicons-react';
import { BiMap, BiMicrophoneOff, BiMicrophone, BiUpload } from 'react-icons/bi';
import { GiSeatedMouse } from 'react-icons/gi';
import { IconContext } from 'react-icons';
import Map from './Map';
import '../App.scss';

export default function Record() {

  const reload = () => {
    window.location.reload();
  };

  const RecordView = () => {

    const [hideUpload, setHideUpload] = useState(true);
    const [markerLat, setMarkerLat] = useState(0);
    const [markerLng, setMarkerLng] = useState(0);
    const [showThanks, setShowThanks] = useState(false);
    const [showMap, setShowMap] = useState(false);
    const [isUploading, setIsUploading] = useState(false);

    const { status, startRecording, stopRecording, mediaBlobUrl } =
      useReactMediaRecorder({ video: false, audio: true, blobPropertyBag: { type: 'audio/mp4' } });

    const updateMarkers = (lat: number, lng: number) => {
      setMarkerLat(lat);
      setMarkerLng(lng);
      setHideUpload(false);
    };

    const showTheMap = () => {
      setShowMap(true);
    };

    const upload = async () => {
      setIsUploading(true);
      setShowMap(false);
      const audioBlob = await fetch(mediaBlobUrl).then((r) => r.blob());
      const audioFile = new File([audioBlob], 'recording.mp4', { type: 'audio/mp4' });

      const formData = new FormData();
      formData.append('file', audioFile);
      formData.append('lat', markerLat.toString());
      formData.append('lng', markerLng.toString());
      const result = await fetch('/sound', {
        method: 'POST',
        body: formData,
      });
      if (result.status === 200) {
        setShowThanks(true);
        setIsUploading(false);
      }
      console.warn(result);
    };

    const recordButton = () => {
      if (status === 'idle') {
        return (
          <Box borderWidth={1} borderStyle="solid" p={3} m={4} bg={'white'} borderRadius={2} className={'center'}>
            <div>
              <IconContext.Provider value={{ color: '#4272bd', size: '5em' }}>
                <div>
                  <BiMicrophoneOff />
                </div>
              </IconContext.Provider>
              <Button onClick={startRecording} leadingIcon={CircleIcon} sx={{ display: 'inline', marginTop: 3 }}>
                Start Recording
              </Button>
            </div>
          </Box>
        );
      }
      if (status === 'acquiring_media' || status === 'stopping') {
        return (
          <Box borderWidth={1} borderStyle="solid" p={3} m={4} bg={'white'} borderRadius={2} className={'center'}>
            <div>
              <IconContext.Provider value={{ color: '#4272bd', size: '5em' }}>
                <div>
                  <BiMicrophoneOff />
                </div>
              </IconContext.Provider>
            </div>
          </Box>
        );
      }
      if (status === 'recording') {
        return (
          <Box borderWidth={1} borderStyle="solid" p={3} m={4} bg={'white'} borderRadius={2} className={'center'}>
            <div>
              <IconContext.Provider value={{ color: '#4272bd', size: '5em' }}>
                <div>
                  <BiMicrophone />
                  <Text as="p" fontWeight="bold" color="red">
                    Recording
                  </Text>
                  <Button onClick={stopRecording} leadingIcon={StopIcon} sx={{ display: 'inline' }}>
                    Stop Recording
                  </Button>
                </div>
              </IconContext.Provider>
            </div>
          </Box>
        );
      }
      if (status === 'stopped' && !showThanks && !showMap && !isUploading) {
        return (
          <Box borderWidth={1} borderStyle="solid" p={3} m={4} bg={'white'} borderRadius={2} className={'center'}>
            <div>
              <IconContext.Provider value={{ color: '#4272bd', size: '5em' }}>
                <div>
                  <BiMap />
                </div>
                <div>
                  <audio src={mediaBlobUrl} controls={true}/>
                </div>
                <div>
                  <Text as="p" mt={1}>
                    Sound good? Ready to geotag your sound?
                  </Text>
                </div>
                <div>
                  <Button onClick={showTheMap} sx={{ display: 'inline' }}>Locate the sound!</Button>
                </div>
                <div>
                  <Button onClick={reload} sx={{ display: 'inline', marginTop: 3 }}>Nope, Restart</Button>
                </div>
              </IconContext.Provider>
            </div>
          </Box>
        );
      }
      if (status === 'stopped' && !showThanks && showMap) {
        return (
          <>
            <Map updateMarkers={updateMarkers} />
            {hideUpload ? null : <Button leadingIcon={UploadIcon} onClick={upload} className="map-overlay-button">
              Upload
            </Button>}
          </>
        );
      }
      if (status === 'stopped' && isUploading) {
        return (
          <Box borderWidth={1} borderStyle="solid" p={3} m={4} bg={'white'} borderRadius={2} className={'center'}>
            <div>
              <IconContext.Provider value={{ color: '#4272bd', size: '5em' }}>
                <div>
                  <BiUpload />
                </div>
                <div>
                  <Text as="p" mt={1}>
                    Sit tight, uploading to map
                  </Text>
                </div>
              </IconContext.Provider>
            </div>
          </Box>
        );
      }
      if (status === 'stopped' && showThanks) {
        return (
          <Box borderWidth={1} borderStyle="solid" p={3} m={4} bg={'white'} borderRadius={2} className={'center'}>
            <div>
              <IconContext.Provider value={{ color: '#4272bd', size: '5em' }}>
                <div>
                  <GiSeatedMouse />
                </div>
                <div>
                  <Text as="p" mt={1}>
                    Thank you for your contribution!
                  </Text>
                </div>
              </IconContext.Provider>
            </div>
          </Box>
        );
      }
    };

    return (
      <BaseStyles>
        {recordButton()}
      </BaseStyles>
    );
  };

  return (
    <RecordView />
  );
}
