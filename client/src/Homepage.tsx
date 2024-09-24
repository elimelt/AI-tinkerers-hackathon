import React, { useState } from 'react';
import { Camera, Image, List, Settings, Share2 } from 'lucide-react';
import PhotoCapture from './PhotoCapture';
import Dashboard from './Dashboard';

const FoodScanApp = () => {
  const [activeTab, setActiveTab] = useState('dashboard'); // Changed from 'home' to 'dashboard'

  const TabButton = ({
    icon,
    label,
    tabName,
  }: {
    icon: React.ReactNode;
    label: string;
    tabName: string;
  }) => (
    <button
      onClick={() => setActiveTab(tabName)}
      className={`flex flex-col items-center p-2 ${
        activeTab === tabName ? 'text-blue-500' : 'text-gray-500'
      }`}
    >
      {icon}
      <span className="text-xs mt-1">{label}</span>
    </button>
  );

  return (
    <div className="w-full h-screen bg-gray-100 flex flex-col">
      {/* App Header */}
      <header className="bg-white p-4 shadow">
        <h1 className="text-xl font-bold text-center">Health Insight</h1>
      </header>

      {/* Main Content Area */}
      <main className="flex-grow p-4">
        {activeTab === 'home' && (
          <div className="flex flex-col items-center justify-center h-full">
            <div className="bg-white p-6 rounded-lg shadow-md w-full max-w-sm">
              <PhotoCapture />
            </div>
          </div>
        )}

        {activeTab === 'dashboard' && <Dashboard />}
      </main>

      {/* Bottom Navigation */}
      <nav className="bg-white border-t flex justify-around p-2">
        <TabButton icon={<Camera size={24} />} label="Scan" tabName="home" />
        <TabButton
          icon={<List size={24} />}
          label="Dashboard"
          tabName="dashboard"
        />
      </nav>
    </div>
  );
};

export default FoodScanApp;
