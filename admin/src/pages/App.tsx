import React from 'react';
import { Page } from '@strapi/strapi/admin';
import { Routes, Route } from 'react-router-dom';
import { HomePage } from './HomePage';

export const App = () => {
  return (
    <Routes>
      <Route index element={<HomePage />} />
    </Routes>
  );
};
