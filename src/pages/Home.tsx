import { useAuth0, LogoutOptions } from '@auth0/auth0-react';
import { useNavigate } from 'react-router-dom';
import { BaseStyles, Box, Button, Text } from '@primer/react';
import React from 'react';

export default function Home() {
  const { isLoading, isAuthenticated, error, user, loginWithRedirect, logout } = useAuth0();

  if (isLoading) {
    return <div>Loading...</div>;
  }
  if (error) {
    return <div>Oops... {error.message}</div>;
  }

  const navigate = useNavigate(); 
  const routeChange = (path: string) =>{ 
    navigate(path);
  };

  if (isAuthenticated) {
    return (
      <BaseStyles>
        <Box borderWidth={1} borderStyle="solid" p={3} m={4} bg={'white'} borderRadius={2} className={'center'}>
          <Text fontSize={3} fontWeight="bold">
            Hello {user.name}
          </Text>
          <Button sx={{ mt: 3 }} onClick={() => routeChange('/record')}>
            Record a story
          </Button>
          {user.email === process.env.ADMIN_EMAIL && (
            <Button sx={{ mt: 3 }} onClick={() => routeChange('/admin')}>
              Admin
            </Button>
          )}
          <Button sx={{ mt: 3 }} onClick={() => logout({ logoutParams: { returnTo: window.location.origin } })}>
            Log out
          </Button>
        </Box>
      </BaseStyles>
    );
  } else {
    return (
      <BaseStyles>
        <Box borderWidth={1} borderStyle="solid" p={3} m={4} bg={'white'} borderRadius={2} className={'center'}>
          <Text>
            Please login to add content
          </Text>
          <Button onClick={() => loginWithRedirect()}>
            Log in
          </Button>
        </Box>
      </BaseStyles>
    );
  }
}
