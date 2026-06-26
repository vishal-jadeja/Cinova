import React from 'react';
import { createRoot } from 'react-dom/client';
import '../index.css';
import BlockPage from './BlockPage';

const root = document.getElementById('root')!;
createRoot(root).render(
  <React.StrictMode>
    <BlockPage />
  </React.StrictMode>
);
