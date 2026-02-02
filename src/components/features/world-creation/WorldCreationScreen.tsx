
import React, { useReducer, useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  ArrowLeft, Sparkles, Plus, Trash2, Edit2, Wand2, Play, 
  User, Globe, Settings, Users, Upload, Download, Eye
} from 'lucide-react';
import { NavigationProps, GameState, WorldData, NarrativePerspective } from '../../../types';
import Button from '../../ui/Button';
import { initialWorldState, worldCreationReducer, GENRE_OPTIONS } from './reducer';
import { DIFFICULTY_LEVELS, OUTPUT_LENGTHS } from '../../../constants/promptTemplates';
import EntityForm from './EntityForm';
import { worldAiService } from '../../../services/ai/world-creation/service';
import { dbService } from '../../../services/db/indexedDB';

const TABS = [
  { id: 0, label: "Nhân vật", icon: User },
  { id: 1, label: "Thế giới", icon: Globe },
  { id: 2, label: "Cấu hình", icon: Settings },
  { id: 3, label: "Thực thể", icon: Users },
];

interface WorldCreationProps extends NavigationProps {
  initialData?: WorldData | null;
}

const WorldCreationScreen: React.FC<WorldCreationProps> = ({ onNavigate, onGameStart, initialData }) => {
  const [state, dispatch] = useReducer(worldCreationReducer, initialWorldState);
  const [showEntityForm, setShowEntityForm] = useState(false);
  const [editingEntityId, setEditingEntityId] = useState<string | null>(null);
  const [conceptInput, setConceptInput] = useState('');
  const [aiModel, setAiModel] = useState<string>('gemini-3-pro-preview');
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const MotionDiv = motion.div as any;
  const MotionInput = motion.input as any;

  // Initial Load (Settings & Import Data)
  useEffect(() => {
    dbService.getSettings().then(s => {
      if (s.aiModel) setAiModel(s.aiModel);
    });

    // Check if there is initial data passed from Main Menu Import
    if (initialData) {
       dispatch({ type: 'IMPORT_DATA', payload: initialData });
    }
  }, [initialData]);

  // --- AI Helper Function (UPDATED WITH VALIDATION) ---
  const handleAiGenerate = async (field: string, category: 'player' | 'world') => {
    // 1. Validation Logic
    if (category === 'player') {
        const { name, gender, age } = state.player;
        if (!name || !gender || !age) {
            alert("⚠️ Vui lòng nhập đầy đủ: Tên, Giới tính và Tuổi trước khi sử dụng gợi ý!");
            return;
        }
    } else if (category === 'world') {
        if (!state.world.genre) {
            alert("⚠️ Vui lòng chọn hoặc nhập Thể loại thế giới trước!");
            return;
        }
    }

    dispatch({ type: 'SET_GENERATING', isGenerating: true, field });
    try {
      // 2. Build Explicit Context
      const contextData = category === 'player' 
        ? { ...state.player, genre: state.world.genre } 
        : { genre: state.world.genre, worldName: state.world.worldName };

      const content = await worldAiService.generateFieldContent(category, field, contextData, aiModel);
      
      // Dispatch based on field type
      if (['name', 'gender', 'age', 'personality', 'background', 'appearance', 'skills', 'goal'].includes(field)) {
        dispatch({ type: 'UPDATE_PLAYER', field: field as any, value: content });
      } else if (['worldName', 'context'].includes(field)) {
        dispatch({ type: 'UPDATE_WORLD', field: field as any, value: content });
      }
    } catch (error) {
      console.error("AI Error", error);
      alert("Có lỗi khi gọi AI. Vui lòng thử lại.");
    } finally {
      dispatch({ type: 'SET_GENERATING', isGenerating: false });
    }
  };

  const handleAutoFillAll = async () => {
    if (!conceptInput.trim()) return alert("Vui lòng nhập ý tưởng sơ khởi!");
    dispatch({ type: 'SET_GENERATING', isGenerating: true });
    try {
      const data = await worldAiService.generateFullWorld(conceptInput, aiModel);
      dispatch({ type: 'AUTO_FILL_ALL', payload: data });
    } finally {
      dispatch({ type: 'SET_GENERATING', isGenerating: false });
    }
  };

  // --- Import / Export Logic ---
  const handleExportWorld = () => {
    const exportData: WorldData = {
        player: state.player,
        world: state.world,
        config: state.config,
        entities: state.entities
    };
    
    // Create fileName based on world name or default
    const fileName = `aetheria_${state.world.worldName.replace(/\s+/g, '_').toLowerCase() || 'untitled'}_setup.json`;
    
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(exportData, null, 2));
    const downloadAnchorNode = document.createElement('a');
    downloadAnchorNode.setAttribute("href", dataStr);
    downloadAnchorNode.setAttribute("download", fileName);
    document.body.appendChild(downloadAnchorNode);
    downloadAnchorNode.click();
    downloadAnchorNode.remove();
  };

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
        const parsedData = JSON.parse(content) as WorldData;
        
        // Basic Validation
        if (!parsedData.player || !parsedData.world || !parsedData.config) {
            throw new Error("Cấu trúc file không hợp lệ");
        }

        dispatch({ type: 'IMPORT_DATA', payload: parsedData });
        alert(`Đã nhập dữ liệu thế giới: ${parsedData.world.worldName || 'Chưa đặt tên'}`);
      } catch (error) {
        alert("File không hợp lệ hoặc bị lỗi!");
        console.error(error);
      }
    };
    reader.readAsText(file);
    event.target.value = ''; // Reset
  };

  // --- Start Game Logic ---
  const handleStartGame = () => {
     const worldData: WorldData = {
        player: state.player,
        world: state.world,
        config: state.config,
        entities: state.entities
     };
     
     // Validate basic fields
     if (!worldData.player.name || !worldData.world.worldName) {
         alert("Vui lòng hoàn thiện ít nhất Tên Nhân Vật và Tên Thế Giới!");
         return;
     }

     if (onGameStart) {
         onGameStart(worldData);
     }
  };

  // --- RENDER FUNCTIONS FOR TABS ---

  const renderPlayerTab = () => (
    <div className="space-y-3 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <h3 className="text-xl font-serif font-bold text-slate-200 border-b border-slate-700 pb-1 mb-2 flex items-center gap-2">
        <User size={20} className="text-mystic-accent" /> Thiết lập Nhân Vật Chính
      </h3>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        <div className="space-y-2">
          <InputGroup 
            label="Tên nhân vật" 
            value={state.player.name} 
            onChange={(v) => dispatch({ type: 'UPDATE_PLAYER', field: 'name', value: v })}
            placeholder="Ví dụ: Lương Thế Vinh, Trần Bình Trọng..." 
          />
          <div className="flex gap-2">
              <div className="flex-1">
                  <label className="block text-sm font-medium text-mystic-accent mb-1">Giới tính</label>
                  <select 
                      value={state.player.gender} 
                      onChange={(e) => dispatch({ type: 'UPDATE_PLAYER', field: 'gender', value: e.target.value })}
                      className="w-full bg-slate-800 border border-slate-600 rounded p-2 text-slate-100 outline-none focus:border-mystic-accent text-sm"
                  >
                      <option value="Nam">Nam</option>
                      <option value="Nữ">Nữ</option>
                      <option value="Khác">Khác</option>
                  </select>
              </div>
              <div className="w-24">
                  <InputGroup 
                    label="Tuổi" 
                    value={state.player.age} 
                    onChange={(v) => dispatch({ type: 'UPDATE_PLAYER', field: 'age', value: v })}
                    placeholder="VD: 20"
                  />
              </div>
          </div>
          <TextAreaGroup 
              label="Tính cách" 
              value={state.player.personality} 
              onChange={(v) => dispatch({ type: 'UPDATE_PLAYER', field: 'personality', value: v })} 
              onAi={() => handleAiGenerate('personality', 'player')}
              loading={state.isGenerating && state.generatingField === 'personality'}
              height="h-24"
              placeholder="Ví dụ: Dũng cảm, cương trực nhưng đôi khi nóng nảy, rất trọng tình nghĩa..."
          />
          <TextAreaGroup 
              label="Ngoại hình" 
              value={state.player.appearance} 
              onChange={(v) => dispatch({ type: 'UPDATE_PLAYER', field: 'appearance', value: v })}
              onAi={() => handleAiGenerate('appearance', 'player')}
              loading={state.isGenerating && state.generatingField === 'appearance'}
              height="h-24"
              placeholder="Ví dụ: Cao 1m80, tóc đen dài buộc sau gáy, mắt sáng như sao, mặc áo vải thô..."
          />
        </div>
        <div className="space-y-2">
          <TextAreaGroup 
              label="Tiểu sử" 
              value={state.player.background} 
              onChange={(v) => dispatch({ type: 'UPDATE_PLAYER', field: 'background', value: v })} 
              height="h-28"
              onAi={() => handleAiGenerate('background', 'player')}
              loading={state.isGenerating && state.generatingField === 'background'}
              placeholder="Ví dụ: Sinh ra trong một gia đình thư hương thế gia đã sa sút, từ nhỏ đã nuôi chí lớn khôi phục gia tộc..."
          />
          <TextAreaGroup 
              label="Kỹ năng" 
              value={state.player.skills} 
              onChange={(v) => dispatch({ type: 'UPDATE_PLAYER', field: 'skills', value: v })} 
              onAi={() => handleAiGenerate('skills', 'player')}
              loading={state.isGenerating && state.generatingField === 'skills'}
              height="h-24"
              placeholder="Ví dụ: Thông thạo ngũ kinh, kiếm thuật cơ bản, khả năng nhìn thấy linh khí..."
          />
          <TextAreaGroup 
              label="Mục tiêu" 
              value={state.player.goal} 
              onChange={(v) => dispatch({ type: 'UPDATE_PLAYER', field: 'goal', value: v })} 
              onAi={() => handleAiGenerate('goal', 'player')}
              loading={state.isGenerating && state.generatingField === 'goal'}
              height="h-24"
              placeholder="Ví dụ: Đỗ trạng nguyên, tìm ra bí mật về cái chết của cha..."
          />
        </div>
      </div>
    </div>
  );

  const renderWorldTab = () => {
    // Check if the current genre is in the predefined list or is a custom one
    const isCustomGenre = !GENRE_OPTIONS.filter(o => o !== 'Tùy chọn').includes(state.world.genre) && state.world.genre !== '';
    const selectValue = isCustomGenre ? 'Tùy chọn' : state.world.genre;

    return (
      <div className="space-y-3 animate-in fade-in slide-in-from-bottom-4 duration-500">
        <h3 className="text-xl font-serif font-bold text-slate-200 border-b border-slate-700 pb-1 mb-2 flex items-center gap-2">
          <Globe size={20} className="text-mystic-accent" /> Bối Cảnh Thế Giới
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <InputGroup 
              label="Tên thế giới" 
              value={state.world.worldName} 
              onChange={(v) => dispatch({ type: 'UPDATE_WORLD', field: 'worldName', value: v })} 
              placeholder="Ví dụ: Đại Lục Huyền Bí, Thành Phố Ngầm..."
            />
            <div>
              <label className="block text-sm font-medium text-mystic-accent mb-1">Thể loại</label>
              <div className="flex flex-col gap-2">
                  <select 
                      value={selectValue} 
                      onChange={(e) => {
                        const val = e.target.value;
                        if (val === 'Tùy chọn') {
                          // Keep current if it's already custom, or clear it if switching from a preset
                          if (!isCustomGenre) dispatch({ type: 'UPDATE_WORLD', field: 'genre', value: '' });
                        } else {
                          dispatch({ type: 'UPDATE_WORLD', field: 'genre', value: val });
                        }
                      }}
                      className="w-full bg-slate-800 border border-slate-600 rounded p-2 text-slate-100 outline-none focus:border-mystic-accent text-sm"
                  >
                      {GENRE_OPTIONS.map(g => <option key={g} value={g}>{g}</option>)}
                  </select>
                  
                  {/* Show Input ONLY if "Tùy chọn" is selected (or we have a custom value) */}
                  {(selectValue === 'Tùy chọn') && (
                    <MotionInput 
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        type="text" 
                        value={state.world.genre}
                        className="w-full bg-slate-800 border border-slate-600 rounded p-2 text-slate-100 outline-none placeholder-slate-500 focus:border-mystic-accent text-sm"
                        placeholder="Nhập thể loại tùy chỉnh (VD: Steampunk lai Tiên Hiệp)..."
                        onChange={(e: React.ChangeEvent<HTMLInputElement>) => dispatch({ type: 'UPDATE_WORLD', field: 'genre', value: e.target.value })}
                    />
                  )}
              </div>
            </div>
        </div>
        <TextAreaGroup 
          label="Bối cảnh & Lịch sử" 
          value={state.world.context} 
          onChange={(v) => dispatch({ type: 'UPDATE_WORLD', field: 'context', value: v })} 
          height="h-56"
          placeholder="Mô tả xã hội (phong kiến, hiện đại...), công nghệ (hơi nước, AI...), hệ thống phép thuật (tu tiên, ma pháp...), lịch sử hình thành..."
          onAi={() => handleAiGenerate('context', 'world')}
          loading={state.isGenerating && state.generatingField === 'context'}
        />
      </div>
    );
  };

  const renderConfigTab = () => (
    <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
       <h3 className="text-xl font-serif font-bold text-slate-200 border-b border-slate-700 pb-1 mb-2 flex items-center gap-2">
          <Settings size={20} className="text-mystic-accent" /> Cấu Hình & Quy Tắc
       </h3>
       <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
           <div className="space-y-2">
              <div>
                <label className="block text-sm font-medium text-mystic-accent mb-2 flex items-center gap-2">
                    <Eye size={16} /> Góc nhìn kể chuyện (POV)
                </label>
                <select 
                    value={state.config.perspective || 'third'}
                    onChange={(e) => dispatch({ type: 'UPDATE_CONFIG', field: 'perspective', value: e.target.value as NarrativePerspective })}
                    className="w-full bg-slate-800 border border-slate-600 rounded p-3 text-slate-100 outline-none focus:border-mystic-accent mb-2"
                >
                    <option value="third">Ngôi thứ 3 (Mặc định - Hắn/Cô ấy/Tên)</option>
                    <option value="first">Ngôi thứ 1 (Tôi)</option>
                    <option value="second">Ngôi thứ 2 (Bạn/Ngươi)</option>
                </select>
                <p className="text-xs text-slate-400 italic">
                    {state.config.perspective === 'first' && "Trải nghiệm nội tâm sâu sắc, nhập vai hoàn toàn."}
                    {state.config.perspective === 'second' && "Dẫn dắt trực tiếp, như một Game Master đang kể."}
                    {(state.config.perspective === 'third' || !state.config.perspective) && "Khách quan, điện ảnh, bao quát toàn cảnh."}
                </p>
              </div>

              <div className="pt-2 border-t border-slate-700/50">
                <label className="block text-sm font-medium text-mystic-accent mb-2">Độ khó</label>
                <select 
                    value={state.config.difficulty.id}
                    onChange={(e) => dispatch({ type: 'UPDATE_CONFIG', field: 'difficulty', value: DIFFICULTY_LEVELS.find(d => d.id === e.target.value) })}
                    className="w-full bg-slate-800 border border-slate-600 rounded p-3 text-slate-100 outline-none focus:border-mystic-accent"
                >
                    {DIFFICULTY_LEVELS.map(d => (
                        <option key={d.id} value={d.id}>{d.label}</option>
                    ))}
                </select>
                <p className="text-xs text-slate-400 mt-2 italic border-l-2 border-slate-600 pl-2">
                    {state.config.difficulty.prompt.split('—')[1]?.split('.')[0] || "Mô tả độ khó..."}
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-mystic-accent mb-2">Độ dài phản hồi</label>
                <select 
                    value={state.config.outputLength.id}
                    onChange={(e) => dispatch({ type: 'UPDATE_CONFIG', field: 'outputLength', value: OUTPUT_LENGTHS.find(o => o.id === e.target.value) })}
                    className="w-full bg-slate-800 border border-slate-600 rounded p-3 text-slate-100 outline-none focus:border-mystic-accent"
                >
                    {OUTPUT_LENGTHS.map(o => (
                        <option key={o.id} value={o.id}>{o.label}</option>
                    ))}
                </select>
                
                {state.config.outputLength.id === 'custom' && (
                    <div className="flex gap-4 mt-3">
                        <div className="flex-1">
                            <label className="text-xs text-slate-400">Tối thiểu (Min)</label>
                            <input type="number" value={state.config.customMinWords} onChange={(e) => dispatch({type: 'UPDATE_CUSTOM_WORDS', min: parseInt(e.target.value), max: state.config.customMaxWords || 3000})} className="w-full bg-slate-900 border border-slate-700 rounded p-2 text-white" />
                        </div>
                        <div className="flex-1">
                            <label className="text-xs text-slate-400">Tối đa (Max)</label>
                            <input type="number" value={state.config.customMaxWords} onChange={(e) => dispatch({type: 'UPDATE_CUSTOM_WORDS', min: state.config.customMinWords || 1000, max: parseInt(e.target.value)})} className="w-full bg-slate-900 border border-slate-700 rounded p-2 text-white" />
                        </div>
                    </div>
                )}
              </div>
           </div>

           <div className="bg-slate-800/30 rounded-lg p-4 border border-slate-700 flex flex-col h-full min-h-[300px]">
                <div className="flex justify-between items-center mb-4">
                    <label className="text-sm font-medium text-mystic-accent">Quy tắc bổ sung (Rules)</label>
                    <button 
                        onClick={() => dispatch({ type: 'ADD_RULE', rule: '' })}
                        className="text-xs flex items-center gap-1 text-green-400 hover:text-green-300"
                    >
                        <Plus size={14} /> Thêm dòng
                    </button>
                </div>
                <div className="flex-1 overflow-y-auto space-y-2 pr-1 custom-scrollbar">
                    {state.config.rules.length === 0 && <p className="text-xs text-slate-500 italic text-center py-4">Chưa có quy tắc nào (VD: Không được dùng từ ngữ hiện đại, Nhân vật không được giết người...).</p>}
                    {state.config.rules.map((rule, idx) => (
                        <div key={idx} className="flex gap-2">
                            <input 
                                type="text" 
                                value={rule}
                                onChange={(e) => {
                                    const newRules = [...state.config.rules];
                                    newRules[idx] = e.target.value;
                                    dispatch({ type: 'UPDATE_CONFIG', field: 'rules', value: newRules });
                                }}
                                className="flex-1 bg-slate-900 border border-slate-700 rounded px-3 py-2 text-sm text-slate-200 focus:border-mystic-accent outline-none"
                                placeholder="Nhập quy tắc (VD: Hệ thống tiền tệ là Vàng)..."
                            />
                            <button 
                                onClick={() => dispatch({ type: 'REMOVE_RULE', index: idx })}
                                className="text-red-500 hover:bg-red-900/20 p-2 rounded"
                            >
                                <Trash2 size={16} />
                            </button>
                        </div>
                    ))}
                </div>
           </div>
       </div>
    </div>
  );

  const renderEntitiesTab = () => (
    <div className="animate-in fade-in slide-in-from-bottom-4 duration-500 h-full flex flex-col">
       <h3 className="text-xl font-serif font-bold text-slate-200 border-b border-slate-700 pb-1 mb-2 flex items-center gap-2">
          <Users size={20} className="text-mystic-accent" /> Danh Sách Thực Thể & NPC
       </h3>
       <div className="flex justify-between items-center mb-4">
          <p className="text-sm text-slate-400">
             Thêm ít nhất 4 thực thể để thế giới sống động hơn. ({state.entities.length}/5 khuyến nghị)
          </p>
          <Button variant="primary" onClick={() => { setEditingEntityId(null); setShowEntityForm(true); }} icon={<Plus size={16} />}>
             Thêm thực thể
          </Button>
       </div>

       <div className="flex-1 overflow-y-auto grid grid-cols-1 md:grid-cols-2 gap-4 pb-4 custom-scrollbar pr-2">
            {state.entities.map(ent => (
                <div key={ent.id} className="bg-slate-800 border border-slate-700 p-4 rounded-lg hover:border-mystic-accent/50 transition-colors group relative">
                    <div className="flex justify-between items-start mb-2">
                        <div className="flex items-center gap-2">
                            <span className={`text-[10px] font-bold px-2 py-0.5 rounded uppercase ${
                                ent.type === 'NPC' ? 'bg-blue-900 text-blue-200' : 
                                ent.type === 'LOCATION' ? 'bg-green-900 text-green-200' : 'bg-purple-900 text-purple-200'
                            }`}>
                                {ent.type}
                            </span>
                            <h4 className="font-bold text-slate-200">{ent.name}</h4>
                        </div>
                        <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                            <button onClick={() => { setEditingEntityId(ent.id); setShowEntityForm(true); }} className="p-1 hover:text-mystic-accent"><Edit2 size={14}/></button>
                            <button onClick={() => dispatch({type: 'REMOVE_ENTITY', id: ent.id})} className="p-1 hover:text-red-400"><Trash2 size={14}/></button>
                        </div>
                    </div>
                    <p className="text-sm text-slate-400 line-clamp-2">{ent.description}</p>
                    {ent.type === 'NPC' && <p className="text-xs text-slate-500 mt-2 italic">Tính cách: {ent.personality}</p>}
                </div>
            ))}
            {state.entities.length === 0 && (
                <div className="col-span-full border-2 border-dashed border-slate-700 rounded-lg flex items-center justify-center h-32 text-slate-500">
                    Chưa có thực thể nào (VD: NPC Sư Phụ, Địa danh Cấm Địa...).
                </div>
            )}
       </div>
    </div>
  );

  return (
    <div className="flex flex-col h-full w-full max-w-6xl mx-auto relative overflow-hidden">
      {/* Hidden File Input for Import */}
      <input 
        type="file" 
        ref={fileInputRef} 
        onChange={handleFileChange} 
        accept=".json" 
        className="hidden" 
      />

      {/* HEADER AREA - Sticky at top */}
      <div className="shrink-0 p-4 md:p-6 pb-2">
          <div className="flex items-center justify-between mb-4">
            <button onClick={() => onNavigate(GameState.MENU)} className="text-slate-400 hover:text-white flex items-center gap-2">
                <ArrowLeft size={20} /> <span className="hidden sm:inline">Quay lại</span>
            </button>
            <h2 className="text-2xl font-serif font-bold text-mystic-accent">Kiến Tạo Thế Giới</h2>
            <div className="w-20" />
          </div>

          {/* AUTO-FILL BAR */}
          <div className="mb-6 bg-mystic-800/40 p-3 rounded-lg border border-mystic-accent/20 flex gap-3 items-center">
             <Wand2 className="text-mystic-accent shrink-0" size={20} />
             <input 
                value={conceptInput}
                onChange={(e) => setConceptInput(e.target.value)}
                placeholder="Nhập ý tưởng sơ khởi (VD: Thế giới đảo bay, con người cưỡi rồng...)"
                className="flex-1 bg-transparent border-none text-sm text-slate-200 placeholder-slate-500 focus:outline-none"
             />
             <Button 
                variant="ghost" 
                className="text-xs py-1 px-3 bg-mystic-accent/10 hover:bg-mystic-accent/20" 
                onClick={handleAutoFillAll}
                isLoading={state.isGenerating && !state.generatingField}
             >
                AI Khởi tạo toàn bộ
             </Button>
          </div>

          {/* TABS HEADER */}
          <div className="flex border-b border-slate-700 overflow-x-auto no-scrollbar md:justify-start">
             {TABS.map((tab) => (
                 <button
                    key={tab.id}
                    onClick={() => dispatch({ type: 'SET_TAB', payload: tab.id })}
                    className={`flex-1 md:flex-none px-6 py-3 text-sm font-bold transition-colors whitespace-nowrap relative flex justify-center items-center gap-2 ${
                        state.currentTab === tab.id ? 'text-mystic-accent' : 'text-slate-500 hover:text-slate-300'
                    }`}
                    title={tab.label}
                 >
                    <tab.icon size={20} />
                    {state.currentTab === tab.id && (
                        <MotionDiv layoutId="activeTab" className="absolute bottom-0 left-0 right-0 h-0.5 bg-mystic-accent" />
                    )}
                 </button>
             ))}
          </div>
      </div>

      {/* TAB CONTENT - SCROLLABLE AREA */}
      <div className="flex-1 overflow-y-auto custom-scrollbar relative px-4 md:px-6 pb-4">
         <AnimatePresence mode="wait">
            {state.currentTab === 0 && <MotionDiv key="tab0" className="h-full">{renderPlayerTab()}</MotionDiv>}
            {state.currentTab === 1 && <MotionDiv key="tab1" className="h-full">{renderWorldTab()}</MotionDiv>}
            {state.currentTab === 2 && <MotionDiv key="tab2" className="h-full">{renderConfigTab()}</MotionDiv>}
            {state.currentTab === 3 && <MotionDiv key="tab3" className="h-full">{renderEntitiesTab()}</MotionDiv>}
         </AnimatePresence>
      </div>

      {/* FOOTER ACTION BAR - Sticky at bottom */}
      <div className="shrink-0 z-20 bg-mystic-900/95 backdrop-blur-md border-t border-slate-800 p-4 shadow-[0_-5px_15px_rgba(0,0,0,0.3)]">
         <div className="grid grid-cols-2 md:flex md:flex-row gap-3 md:gap-4 justify-between items-center max-w-6xl mx-auto">
             {/* Mobile: Row 1, Desktop: Left align */}
             <div className="col-span-1 md:w-auto">
                 <Button 
                    variant="ghost" 
                    icon={<Upload size={16}/>} 
                    className="w-full md:w-auto text-xs md:text-sm"
                    onClick={handleImportClick}
                 >
                    Nhập
                 </Button>
             </div>
             
             {/* Mobile: Row 1, Desktop: Left align */}
             <div className="col-span-1 md:w-auto">
                 <Button 
                    variant="ghost" 
                    icon={<Download size={16}/>} 
                    className="w-full md:w-auto text-xs md:text-sm"
                    onClick={handleExportWorld}
                 >
                    Xuất
                 </Button>
             </div>

             {/* Mobile: Row 2 (Full width), Desktop: Right align */}
             <div className="col-span-2 md:flex-1 md:flex md:justify-end">
                  <Button 
                    variant="primary" 
                    className="w-full md:w-auto shadow-[0_0_20px_rgba(56,189,248,0.4)] px-8"
                    icon={<Play size={20} />}
                    disabled={state.entities.length < 1} // Soft lock
                    onClick={handleStartGame}
                  >
                    BẮT ĐẦU GAME
                  </Button>
             </div>
         </div>
      </div>

      {/* MODALS */}
      {showEntityForm && (
        <EntityForm 
            initialData={editingEntityId ? state.entities.find(e => e.id === editingEntityId) : undefined}
            onCancel={() => setShowEntityForm(false)}
            onSave={(entity) => {
                if (editingEntityId) {
                    dispatch({ type: 'UPDATE_ENTITY', id: editingEntityId, entity });
                } else {
                    dispatch({ type: 'ADD_ENTITY', entity });
                }
                setShowEntityForm(false);
            }}
        />
      )}
    </div>
  );
};

// --- HELPER SUB-COMPONENTS ---
const InputGroup = ({ label, value, onChange, placeholder }: { label: string, value: string, onChange: (v: string) => void, placeholder?: string }) => (
    <div>
        <label className="block text-sm font-medium text-mystic-accent mb-1">{label}</label>
        <input 
            type="text" 
            value={value}
            onChange={(e) => onChange(e.target.value)}
            className="w-full bg-slate-800 border border-slate-600 rounded p-2 text-slate-100 outline-none focus:border-mystic-accent transition-colors text-sm"
            placeholder={placeholder}
        />
    </div>
);

// Updated TextAreaGroup with explicit AI button styling
const TextAreaGroup = ({ label, value, onChange, onAi, height = 'h-24', loading = false, placeholder }: { label: string, value: string, onChange: (v: string) => void, onAi?: () => void, height?: string, loading?: boolean, placeholder?: string }) => (
    <div className="relative flex flex-col">
        <div className="flex justify-between items-center mb-1">
            <label className="text-sm font-medium text-mystic-accent">{label}</label>
            {onAi && (
                <button 
                    type="button" // Explicitly type button to prevent form submission issues
                    onClick={(e) => {
                        e.stopPropagation();
                        onAi();
                    }} 
                    disabled={loading} 
                    className="group flex items-center gap-1.5 px-2 py-0.5 rounded border border-slate-700 bg-slate-800 hover:bg-mystic-accent/10 hover:border-mystic-accent hover:text-mystic-accent text-xs text-slate-400 transition-all cursor-pointer z-10"
                    title="Sử dụng AI để tạo nội dung gợi ý"
                >
                    {loading ? <span className="animate-spin">⏳</span> : <Sparkles size={12} />} 
                    <span>AI Gợi ý</span>
                </button>
            )}
        </div>
        <textarea 
            value={value}
            onChange={(e) => onChange(e.target.value)}
            className={`w-full ${height} min-h-[80px] resize-y bg-slate-800 border border-slate-600 rounded p-2 text-slate-100 outline-none focus:border-mystic-accent transition-colors text-sm placeholder-slate-500`}
            placeholder={placeholder}
        />
    </div>
);

export default WorldCreationScreen;
