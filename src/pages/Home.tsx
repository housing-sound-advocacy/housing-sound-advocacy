import { useAuth0, LogoutOptions } from '@auth0/auth0-react';
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

  if (isAuthenticated) {
    return (
      <BaseStyles>
        <Box borderWidth={1} borderStyle="solid" p={3} m={4} bg={'white'} borderRadius={2} className={'center'}>
          <Text fontSize={3} fontWeight="bold">
            Hello {user.name}
          </Text>
          <Button onClick={() => logout({ returnTo: window.location.origin } as LogoutOptions )}>
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
