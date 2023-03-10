import React from 'react';
import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';
import { ThemeProvider } from '@primer/react';
import Map from './pages/Map';
import Record from './pages/Record';
import { Auth0ProviderWithNavigate } from './Auth0ProviderWithNavigate';
import { AuthenticationGuard } from './components/AuthenticationGuard';

export default function App() {
  return (
    <ThemeProvider>
      <Router>
        <Auth0ProviderWithNavigate>
          <Routes>
            <Route
              path='/'
              element={<AuthenticationGuard component={Record} />}
            ></Route>
            <Route
              path='/record'
              element={<AuthenticationGuard component={Record} />}
            ></Route>
            <Route path='/map' element={<Map />}></Route>
          </Routes>
        </Auth0ProviderWithNavigate>
      </Router>
    </ThemeProvider>
  );
}
