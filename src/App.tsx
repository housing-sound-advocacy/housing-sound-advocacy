import React from 'react';
import { MemoryRouter as Router, Route, Routes } from 'react-router-dom';
import Map from './pages/Map';
import Record from './pages/Record';
import {ThemeProvider} from '@primer/react'

export default function App() {
  return (
    <ThemeProvider>
      <Router>
        <Routes>
          <Route path='/' element={<Record />}></Route>
          <Route path='/map' element={<Map />}></Route>
        </Routes>
      </Router>
    </ThemeProvider>
  );
}
