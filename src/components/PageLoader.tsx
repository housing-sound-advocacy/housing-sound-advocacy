import React from 'react';

export const PageLoader: React.FC = () => {
  const loadingImg = 'https://cdn.auth0.com/blog/hello-auth0/loader.svg';
  const style = {
    height: '5rem',
    width: '5rem',
    margin: 'auto',
    animation: 'spin 2s infinite linear',
  };

  return (
    <div style={style}>
      <img src={loadingImg} alt='Loading...' />
    </div>
  );
};
