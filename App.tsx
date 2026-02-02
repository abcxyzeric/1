
import React, { useState } from 'react';
import MainLayout from './src/components/layout/MainLayout';
import MainMenuScreen from './src/components/features/main-menu/MainMenuScreen';
import SettingsScreen from './src/components/features/settings/SettingsScreen';
import WorldCreationScreen from './src/components/features/world-creation/WorldCreationScreen';
import GameplayScreen from './src/components/features/gameplay/GameplayScreen';
import { GameState, WorldData } from './src/types';

function App() {
  const [gameState, setGameState] = useState<GameState>(GameState.MENU);
  const [activeWorld, setActiveWorld] = useState<WorldData | null>(null);
  const [importedSetup, setImportedSetup] = useState<WorldData | null>(null);

  const handleNavigate = (newState: GameState) => {
    // Khi điều hướng thông thường (ví dụ bấm nút Quay lại hoặc từ Menu),
    // ta reset data import để tránh WorldCreationScreen tự động load lại file cũ.
    setImportedSetup(null);
    setGameState(newState);
  };

  const handleGameStart = (worldData: WorldData) => {
    setActiveWorld(worldData);
    setGameState(GameState.PLAYING);
  };

  const handleImportSetup = (worldData: WorldData) => {
    // Lưu data setup vào state và chuyển hướng sang màn hình tạo thế giới
    setImportedSetup(worldData);
    setGameState(GameState.WORLD_CREATION);
  };

  return (
    <MainLayout>
      {/* Main Game State Switcher */}
      {gameState === GameState.MENU && (
        <MainMenuScreen 
            onNavigate={handleNavigate} 
            onGameStart={handleGameStart}
            onImportSetup={handleImportSetup}
        />
      )}

      {gameState === GameState.WORLD_CREATION && (
        <WorldCreationScreen 
            onNavigate={handleNavigate} 
            onGameStart={handleGameStart}
            initialData={importedSetup}
        />
      )}

      {gameState === GameState.PLAYING && (
        <GameplayScreen 
            onNavigate={handleNavigate}
            activeWorld={activeWorld}
        />
      )}

      {gameState === GameState.SETTINGS && (
        <SettingsScreen onNavigate={handleNavigate} />
      )}
    </MainLayout>
  );
}

export default App;
