import React, { useEffect, useState } from 'react';
import { useAuth0 } from '@auth0/auth0-react';
import { useReactMediaRecorder } from 'react-media-recorder';
import { BaseStyles, Box, Button, Textarea, Text } from '@primer/react';
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
    enum Progress {
      RecordSound,
      Description,
      Locate,
      Uploading,
      Finished,
    }
    const { getAccessTokenSilently } = useAuth0();

    const [hideUpload, setHideUpload] = useState(true);
    const [markerLat, setMarkerLat] = useState(0);
    const [markerLng, setMarkerLng] = useState(0);
    const [accessToken, setAccessToken] = useState('');
    const [progress, setProgress] = useState(Progress.RecordSound);
    const [textValue, setTextValue] = React.useState('');

    const { status, startRecording, stopRecording, mediaBlobUrl } =
      useReactMediaRecorder({ video: false, audio: true, blobPropertyBag: { type: 'audio/mp4' } });

    useEffect(() => {
      (async () => {
        try {
          const token = await getAccessTokenSilently();
          setAccessToken(token);
        } catch (e) {
          console.error(e);
        }
      })();
    }, [getAccessTokenSilently]);

    const handleTextChange = (event: React.ChangeEvent<HTMLTextAreaElement>) => {
      setTextValue(event.target.value);
    };

    const updateMarkers = (lat: number, lng: number) => {
      setMarkerLat(lat);
      setMarkerLng(lng);
      setHideUpload(false);
    };

    const addDescription = () => {
      setProgress(Progress.Description);
    };

    const showTheMap = () => {
      setProgress(Progress.Locate);
    };

    const upload = async () => {
      setProgress(Progress.Uploading);
      const audioBlob = await fetch(mediaBlobUrl).then((r) => r.blob());
      const audioFile = new File([audioBlob], 'recording.mp4', { type: 'audio/mp4' });

      const formData = new FormData();
      formData.append('file', audioFile);
      formData.append('lat', markerLat.toString());
      formData.append('lng', markerLng.toString());
      formData.append('description', textValue);
      const result = await fetch('/sound', {
        method: 'POST',
        body: formData,
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      });
      if (result.status === 200) {
        setProgress(Progress.Finished);
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
      if (status === 'stopped' && progress === Progress.RecordSound) {
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
                  <Button onClick={addDescription} sx={{ display: 'inline' }}>Add a description</Button>
                </div>
                <div>
                  <Button onClick={reload} sx={{ display: 'inline', marginTop: 3 }}>Nope, Restart</Button>
                </div>
              </IconContext.Provider>
            </div>
          </Box>
        );
      }
      if (status === 'stopped' && progress === Progress.Description) {
        return (
          <Box borderWidth={1} borderStyle="solid" p={3} m={4} bg={'white'} borderRadius={2} className={'center'}>
            <Textarea
              placeholder="Enter a description (optional)"
              onChange={handleTextChange}
              value={textValue}
              sx={{ width: '90%', marginBottom: 3 }}
            />
            <Button onClick={showTheMap} sx={{ display: 'inline' }}>Locate the sound!</Button>
          </Box>
        );
      }
      if (status === 'stopped' && progress === Progress.Locate) {
        return (
          <>
            <Map updateMarkers={updateMarkers} />
            {hideUpload ? null : <Button leadingIcon={UploadIcon} onClick={upload} className="map-overlay-button">
              Upload
            </Button>}
          </>
        );
      }
      if (status === 'stopped' && progress === Progress.Uploading) {
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
      if (status === 'stopped' && progress === Progress.Finished) {
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
