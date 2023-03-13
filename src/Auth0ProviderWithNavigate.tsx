import { Auth0Provider, AppState } from '@auth0/auth0-react';
import React, { PropsWithChildren } from 'react';
import { useNavigate } from 'react-router-dom';

interface Auth0ProviderWithNavigateProps {
  children: React.ReactNode;
}

export const Auth0ProviderWithNavigate = ({
  children,
}: PropsWithChildren<Auth0ProviderWithNavigateProps>): JSX.Element | null => {
  const navigate = useNavigate();

  const domain = process.env.AUTH_DOMAIN;
  const clientId = process.env.AUTH_CLIENT_ID;
  const redirectUri = process.env.AUTH_CALLBACK_URL;

  const onRedirectCallback = (appState?: AppState) => {
    navigate(appState?.returnTo || window.location.pathname);
  };

  if (!domain) {
    console.error('AUTH_DOMAIN is not defined');
  }

  if (!clientId) {
    console.error('AUTH_CLIENT_ID is not defined');
  }

  if (!redirectUri) {
    console.error('AUTH_CALLBACK_URL is not defined');
  }

  if (!(domain && clientId && redirectUri)) {
    return null;
  }

  return (
    <Auth0Provider
      domain={domain}
      clientId={clientId}
      authorizationParams={{
        audience: 'https://housingadvocacy.ca',
        scope: 'create:sounds delete:sounds',
        redirect_uri: redirectUri,
      }}
      onRedirectCallback={onRedirectCallback}
    >
      {children}
    </Auth0Provider>
  );
};
