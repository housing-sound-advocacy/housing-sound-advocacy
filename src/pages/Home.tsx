import { useAuth0 } from '@auth0/auth0-react';
import jwtDecode, { JwtPayload } from 'jwt-decode';
import { useNavigate } from 'react-router-dom';
import { BaseStyles, Box, Button, Text } from '@primer/react';
import React, { useEffect, useState } from 'react';

interface Auth0JwtPayload extends JwtPayload {
  azp: string;
  scope: string;
  permissions: string[]
}

export default function Home() {
  const { isLoading, isAuthenticated, error, user, loginWithRedirect, logout, getAccessTokenSilently } = useAuth0();
  const [isAdmin, setIsAdmin] = useState(false);


  useEffect(() => {
    (async () => {
      try {
        const token = await getAccessTokenSilently({
          authorizationParams: {
            audience: 'https://housingadvocacy.ca',
            scope: 'delete:sounds',
          },
        });
        const decoded = jwtDecode<Auth0JwtPayload>(token);
        if (decoded.permissions.includes('delete:sounds')) {
          setIsAdmin(true);
        }
      } catch (e) {
        console.error(e);
      }
    })();
  }, [getAccessTokenSilently]);

  const navigate = useNavigate(); 
  const routeChange = (path: string) =>{ 
    navigate(path);
  };

  const logMeOut = () => {
    logout({ logoutParams: { returnTo: window.location.origin } });
  };

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
          <Button sx={{ mt: 3 }} onClick={() => routeChange('/record')}>
            Record a story
          </Button>
          {isAdmin && (
            <Button sx={{ mt: 3 }} onClick={() => routeChange('/admin')}>
              Admin
            </Button>
          )}
          <Button sx={{ mt: 3 }} onClick={() => logMeOut()}>
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
            Please login or sign up to add content
          </Text>
          <Button onClick={() => loginWithRedirect()}>
            Log In or Sign Up
          </Button>
        </Box>
      </BaseStyles>
    );
  }
}
