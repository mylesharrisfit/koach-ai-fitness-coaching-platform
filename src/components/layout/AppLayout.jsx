import React from 'react';
import { Outlet } from 'react-router-dom';
import Sidebar from './Sidebar';

export default function AppLayout() {
  return (
    <div className="min-h-screen bg-background dark bg-noise">
      {/* Ambient mesh gradient backdrop */}
      <div className="fixed inset-0 bg-gradient-mesh pointer-events-none" aria-hidden="true" />
      <Sidebar />
      <main className="ml-[240px] min-h-screen transition-all duration-300 relative z-10">
        <Outlet />
      </main>
    </div>
  );
}