import React from 'react';
import { useReactMediaRecorder } from 'react-media-recorder';
import { BaseStyles, Box, Button } from '@primer/react';
import { CircleIcon, CheckIcon, StopIcon } from '@primer/octicons-react';

export default function Record() {
  const RecordView = () => {
    const { status, startRecording, stopRecording, mediaBlobUrl } =
      useReactMediaRecorder({ video: false, audio: true, blobPropertyBag: { type: 'audio/wav' } });

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
              <Button leadingIcon={CheckIcon}>Save Recording</Button>
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
