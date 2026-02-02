
import React, { useRef, useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Play, 
  RotateCcw, 
  Save, 
  Settings, 
  Upload,
  X,
  Clock,
  FileText,
  Trash2
} from 'lucide-react';
import Button from '../../ui/Button';
import StatusFooter from './StatusFooter';
import { useDatabaseStatus } from '../../../hooks/useDatabaseStatus';
import { NavigationProps, GameState, SaveFile, WorldData } from '../../../types';
import { dbService } from '../../../services/db/indexedDB';

const containerVariants: any = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1,
      delayChildren: 0.3
    }
  }
};

const itemVariants: any = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { type: 'spring', stiffness: 50 } }
};

const MainMenuScreen: React.FC<NavigationProps> = ({ onNavigate, onGameStart, onImportSetup }) => {
  const { hasSaves } = useDatabaseStatus();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [showLoadModal, setShowLoadModal] = useState(false);
  const [saveList, setSaveList] = useState<SaveFile[]>([]);
  const [activeTab, setActiveTab] = useState<'auto' | 'manual'>('manual');
  
  const MotionDiv = motion.div as any;

  // --- Import Logic ---
  const handleImportClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const content = e.target?.result as string;
        const parsedData = JSON.parse(content);
        
        // CASE 1: File Save Gameplay (Có chứa history và turnCount)
        // Cấu trúc: { id, world: WorldData, history: [], turnCount: 0, ... }
        if (parsedData.history && parsedData.world && parsedData.world.player) {
             console.log("Phát hiện file Save Gameplay");
             const worldData: WorldData = {
                ...parsedData.world, // Lấy WorldData gốc từ bên trong
                savedState: {
                    history: parsedData.history,
                    turnCount: parsedData.turnCount || 0
                }
            };
            
            // Vào thẳng Gameplay
            if (onGameStart) {
                onGameStart(worldData);
            }
        }
        // CASE 2: File Export từ World Creation (Chỉ là setup)
        // Cấu trúc: { player, world, config, entities } (Chính là WorldData)
        else if (parsedData.player && parsedData.world && parsedData.config) {
             console.log("Phát hiện file Thiết lập Thế giới");
             const worldData = parsedData as WorldData;
             
             // Chuyển hướng đến màn hình World Creation để chỉnh sửa tiếp
             if (onImportSetup) {
                 onImportSetup(worldData);
             } else {
                 console.error("onImportSetup missing prop");
             }
        } 
        else {
             throw new Error("Cấu trúc file không hợp lệ hoặc thiếu dữ liệu quan trọng.");
        }
        
      } catch (error) {
        alert("File không hợp lệ! Vui lòng kiểm tra lại.");
        console.error(error);
      }
    };
    reader.readAsText(file);
    event.target.value = '';
  };

  // --- Load Game Logic ---
  const handleOpenLoadGame = async () => {
      const saves = await dbService.getAllSaves();
      // Sort by updated time desc
      saves.sort((a, b) => b.updatedAt - a.updatedAt);
      setSaveList(saves);
      setShowLoadModal(true);
  };

  const handleDeleteSave = async (e: React.MouseEvent, id: string) => {
      e.stopPropagation();
      if (confirm("Bạn có chắc chắn muốn xóa file save này?")) {
          await dbService.deleteSave(id);
          const newSaves = await dbService.getAllSaves();
          newSaves.sort((a, b) => b.updatedAt - a.updatedAt);
          setSaveList(newSaves);
      }
  };

  const handleLoadSave = (save: SaveFile) => {
      if (!onGameStart) return;

      const worldData: WorldData = {
          ...save.data.world,
          savedState: {
              history: save.data.history,
              turnCount: save.data.turnCount
          }
      };
      onGameStart(worldData);
  };

  const filteredSaves = saveList.filter(s => {
      if (activeTab === 'auto') return s.id.startsWith('autosave-');
      return s.id.startsWith('manual-');
  });

  return (
    <div className="flex flex-col h-full w-full">
      <input 
        type="file" 
        ref={fileInputRef} 
        onChange={handleFileChange} 
        accept=".json" 
        className="hidden" 
      />

      <div className="flex-1 overflow-y-auto overflow-x-hidden relative">
        <div className="min-h-full flex flex-col items-center justify-center p-4 py-12 md:p-8 z-10">
          
          <MotionDiv 
            initial={{ opacity: 0, scale: 0.9, y: -30 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            transition={{ duration: 1.2, ease: "easeOut" }}
            className="mb-10 md:mb-16 text-center px-4"
          >
            <h1 className="font-serif text-4xl sm:text-5xl md:text-7xl font-bold text-transparent bg-clip-text bg-gradient-to-b from-slate-100 to-slate-500 tracking-wider drop-shadow-lg mb-4">
              MythOS
            </h1>
            <div className="h-[1px] w-16 md:w-24 mx-auto bg-mystic-accent/50 shadow-[0_0_10px_#38bdf8]" />
            <p className="mt-4 font-sans text-mystic-accent text-xs md:text-sm tracking-[0.2em] md:tracking-[0.3em] uppercase opacity-80">
              bản nhái đủ thứ trên đời
            </p>
          </MotionDiv>

          <MotionDiv 
            variants={containerVariants}
            initial="hidden"
            animate="visible"
            className="flex flex-col gap-3 md:gap-4 w-full max-w-xs sm:max-w-sm px-2"
          >
            <MotionDiv variants={itemVariants}>
              <Button 
                variant="primary" 
                className="w-full h-12 md:h-14 text-base md:text-lg border-mystic-accent/50"
                icon={<Play size={20} />}
                onClick={() => onNavigate(GameState.WORLD_CREATION)}
              >
                Khởi tạo thế giới
              </Button>
            </MotionDiv>

            <MotionDiv variants={itemVariants}>
              <Button 
                variant="ghost" 
                className="w-full h-10 md:h-12 justify-start pl-6 md:pl-8"
                icon={<Save size={18} />}
                onClick={handleOpenLoadGame}
                disabled={!hasSaves}
              >
                Tải lại Save
              </Button>
            </MotionDiv>

            <MotionDiv variants={itemVariants}>
              <Button 
                variant="ghost" 
                className="w-full h-10 md:h-12 justify-start pl-6 md:pl-8" 
                icon={<Upload size={18} />}
                onClick={handleImportClick}
              >
                  Nhập Save File
              </Button>
            </MotionDiv>

            <div className="w-full h-[1px] bg-slate-800 my-1 md:my-2" />

            <MotionDiv variants={itemVariants}>
              <Button 
                variant="ghost" 
                className="w-full h-10 md:h-12 justify-start pl-6 md:pl-8 text-slate-500 hover:text-slate-300"
                icon={<Settings size={16} />}
                onClick={() => onNavigate(GameState.SETTINGS)}
              >
                Cài đặt
              </Button>
            </MotionDiv>

          </MotionDiv>
        </div>
      </div>

      <StatusFooter />

      {/* LOAD GAME MODAL */}
      <AnimatePresence>
          {showLoadModal && (
              <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
                  <MotionDiv 
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    className="bg-mystic-900 border border-slate-700 w-full max-w-2xl rounded-xl shadow-2xl flex flex-col max-h-[80vh] overflow-hidden"
                  >
                      {/* Header */}
                      <div className="p-4 border-b border-slate-800 flex justify-between items-center bg-slate-900/50">
                          <h2 className="text-xl font-bold text-slate-200 flex items-center gap-2">
                              <RotateCcw size={20} className="text-mystic-accent"/> Tải lại Game
                          </h2>
                          <button onClick={() => setShowLoadModal(false)} className="text-slate-400 hover:text-white p-1">
                              <X size={24} />
                          </button>
                      </div>

                      {/* Tabs */}
                      <div className="flex border-b border-slate-800 bg-slate-900/30">
                          <button 
                            className={`flex-1 py-3 text-sm font-medium transition-colors ${activeTab === 'manual' ? 'text-mystic-accent border-b-2 border-mystic-accent bg-mystic-accent/5' : 'text-slate-400 hover:text-slate-200'}`}
                            onClick={() => setActiveTab('manual')}
                          >
                              Lưu Thủ Công
                          </button>
                          <button 
                            className={`flex-1 py-3 text-sm font-medium transition-colors ${activeTab === 'auto' ? 'text-mystic-accent border-b-2 border-mystic-accent bg-mystic-accent/5' : 'text-slate-400 hover:text-slate-200'}`}
                            onClick={() => setActiveTab('auto')}
                          >
                              Lưu Tự Động
                          </button>
                      </div>

                      {/* List */}
                      <div className="flex-1 overflow-y-auto p-4 space-y-3 custom-scrollbar bg-mystic-900">
                          {filteredSaves.length === 0 ? (
                              <div className="text-center text-slate-500 py-10">
                                  Không có file save nào trong mục này.
                              </div>
                          ) : (
                              filteredSaves.map((save) => (
                                  <div 
                                    key={save.id} 
                                    onClick={() => handleLoadSave(save)}
                                    className="group flex justify-between items-center bg-slate-800 border border-slate-700 p-4 rounded-lg cursor-pointer hover:border-mystic-accent hover:bg-slate-800/80 transition-all"
                                  >
                                      <div className="flex items-start gap-3">
                                          <div className={`p-2 rounded-lg ${save.id.startsWith('auto') ? 'bg-orange-900/20 text-orange-400' : 'bg-blue-900/20 text-blue-400'}`}>
                                              <FileText size={20} />
                                          </div>
                                          <div>
                                              <h4 className="font-bold text-slate-200 group-hover:text-mystic-accent transition-colors">
                                                  {save.name}
                                              </h4>
                                              <div className="flex items-center gap-3 text-xs text-slate-400 mt-1">
                                                  <span className="flex items-center gap-1"><Clock size={10}/> {new Date(save.updatedAt).toLocaleString()}</span>
                                                  <span>•</span>
                                                  <span>Lượt: {save.data.turnCount || 0}</span>
                                              </div>
                                              {save.data.world.player?.name && (
                                                  <div className="text-xs text-slate-500 mt-1">
                                                      Người chơi: {save.data.world.player.name}
                                                  </div>
                                              )}
                                          </div>
                                      </div>
                                      
                                      <button 
                                        onClick={(e) => handleDeleteSave(e, save.id)}
                                        className="p-2 text-slate-500 hover:text-red-400 hover:bg-red-900/10 rounded-full transition-colors opacity-0 group-hover:opacity-100"
                                        title="Xóa save"
                                      >
                                          <Trash2 size={16} />
                                      </button>
                                  </div>
                              ))
                          )}
                      </div>
                  </MotionDiv>
              </div>
          )}
      </AnimatePresence>
    </div>
  );
};

export default MainMenuScreen;