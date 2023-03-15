import React, { useEffect, useState } from 'react';
import { useAuth0 } from '@auth0/auth0-react';
import { BaseStyles, Box, Button, RelativeTime, Text } from '@primer/react';
import { Sound } from '../model/sound';
import '../App.scss';

export default function Admin() {
  const AdminView = () => {
    const { getAccessTokenSilently } = useAuth0();
    const [accessToken, setAccessToken] = useState('');
    const [sounds, setSounds] = useState<Sound[]>([]);

    const fetchSounds = async () => {
      const result = await fetch('/full-sound-list', {
        method: 'GET',
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      });
      if (result.status === 200) {
        const soundResults = await result.json();
        setSounds(soundResults);
      }
    };

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

    useEffect(() => {
      if (accessToken) {
        fetchSounds();
      }
    }, [accessToken]);

    const updateEnabledStatus = async (id: number, enabled: boolean) => {
      const formData = new FormData();
      formData.append('enabled', String(enabled));
      formData.append('id', String(id));
      const result = await fetch('/sound-status', {
        method: 'POST',
        body: formData,
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      });
      if (result.status === 200) {
        fetchSounds();
      }
    };

    const deleteSound = async (id: number) => {
      const formData = new FormData();
      formData.append('id', String(id));
      const result = await fetch('/delete-sound', {
        method: 'POST',
        body: formData,
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      });
      if (result.status === 200) {
        fetchSounds();
      }
    };

    const soundDetails = (sound: Sound) => {
      let imageUrl = 'https://api.mapbox.com/styles/v1/mapbox/streets-v11/static/';
      imageUrl += `pin-s+${sound.enabled ? '00ff00' : 'ff0000'}(${sound.longitude},${sound.latitude})/`;
      imageUrl += `${sound.longitude},${sound.latitude},13,0,0/140x140`;
      imageUrl += `?access_token=${process.env.REACT_APP_MAPBOX_TOKEN}`;
      return (
        <Box sx={{ display: 'flex' }}>
          <Box>
            <img src={imageUrl} alt="Map" />
          </Box>
          <Box sx={{ display: 'flex', flexDirection: 'column', ml: 3 }}>
            <Box>
              <audio controls><source src={sound.url} type="audio/mpeg" /></audio>
            </Box>
            <Box> 
              <Text>Created </Text>
              <RelativeTime datetime={sound.created_at} />
            </Box>
            <Box>
              {sound.description && (
                <Text>{sound.description}</Text>
              )}
            </Box>
          </Box>
        </Box>
      );
    };

    const soundItem = (sound: Sound) => {
      return (
        <Box key={sound.id} sx={{ display: 'flex' }}>
          <Box sx={{ flexGrow: 1, p: 3, borderWidth: 1, borderStyle: 'solid', borderColor: 'border.default' }}>
            {soundDetails(sound)}
          </Box>
          <Box sx={{ p: 3, borderWidth: 1, borderStyle: 'solid', borderColor: 'border.default' }}>
            <Button sx={{ mb: 5 }} onClick={() => updateEnabledStatus(sound.id, !sound.enabled)}>
              {sound.enabled ? 'Disable' : 'Enable'}
            </Button>
            <Button variant="danger" onClick={() => deleteSound(sound.id)}>
              Delete
            </Button>
          </Box>
        </Box>
      );
    };

    const adminTable = () => {
      return (
        <Box borderWidth={1} borderStyle="solid" p={3} m={4} bg={'white'} borderRadius={2}>
          <Box
            sx={{ borderBottomWidth: 1, borderBottomStyle: 'solid', borderColor: 'border.default', pb: 3 }}
          >
            Manage
            </Box>
            {sounds.map((sound) => (
              <div key={`sound-${sound.id}`}>
                {soundItem(sound)}
              </div>
            ))}
        </Box>
      );
    };

    return (
      <BaseStyles>
        {adminTable()}
      </BaseStyles>
    );
  };

  return (
    <AdminView />
  );
}
