
import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Send, Menu, Shield, Zap, Target, Scroll, User, Download, Save, BrainCircuit, Globe, Brain, Loader2, ChevronLeft, ChevronRight, GitBranch, ChevronsDown, BookOpen, Plus, Trash2, Edit2, Check, X, GripHorizontal, Database, Table as TableIcon } from 'lucide-react';
import { NavigationProps, GameState, ChatMessage, AppSettings, SaveFile, WorldData, TawaPresetConfig } from '../../../types';
import { gameplayAiService } from '../../../services/ai/gameplay/service';
import { dbService } from '../../../services/db/indexedDB';
import Button from '../../ui/Button';
import { TAWA_REGEX, extractTagContent, cleanRawText } from '../../../utils/regex';
import { DEFAULT_PRESET_CONFIG } from '../../../constants/tawa_modules'; 
import TawaPresetManager from './components/TawaPresetManager';
import { LsrParser, LsrTableDefinition } from '../../../services/lsr/LsrParser';
import { LSR_REGEX } from '../../../data/lsr_config';

// Constants for Pagination
const MESSAGES_PER_PAGE = 5;

const MotionDiv = motion.div as any;
const MotionButton = motion.button as any;

// Helper component to render Tawa's structured output (UPDATED WITH NEW CLEANER)
interface TawaMessageRendererProps {
    text: string;
    onUpdate: (newText: string) => void;
}

const TawaMessageRenderer: React.FC<TawaMessageRendererProps> = ({ text, onUpdate }) => {
    const [showThinking, setShowThinking] = useState(false);
    const [isEditing, setIsEditing] = useState(false);
    const [editedText, setEditedText] = useState(text);

    // Sync editedText when prop text changes
    useEffect(() => {
        setEditedText(text);
    }, [text]);

    // Extract Thinking content
    const thinkingContent = extractTagContent(text, 'thinking');
    
    // Get Clean Main Content (Strip all system tags)
    const mainContent = cleanRawText(text);

    // --- DIALOGUE & FORMATTING LOGIC ---
    const formatContentWithHighlights = (rawContent: string) => {
        if (!rawContent) return "";
        let formatted = rawContent;

        // 0. Clean Artifacts (System text, status checks)
        if (TAWA_REGEX.ARTIFACTS_REMOVAL) {
             TAWA_REGEX.ARTIFACTS_REMOVAL.forEach(regex => {
                 formatted = formatted.replace(regex, '');
             });
        }

        // Apply LSR Regex cleaning from configuration
        LSR_REGEX.forEach(rule => {
            formatted = formatted.replace(rule.regex, '');
        });

        // 1. Remove Asterisks (*) completely for novel style
        if (TAWA_REGEX.ASTERISK_REMOVAL) {
            formatted = formatted.replace(TAWA_REGEX.ASTERISK_REMOVAL, '');
        }

        // 2. Handle Newlines for raw text
        const hasHtmlTags = /<[a-z][\s\S]*>/i.test(formatted);
        if (!hasHtmlTags) {
            formatted = formatted.replace(/\n/g, '<br/>');
        }

        // 3. Highlight Dialogue (Quotes "..." or “...”)
        formatted = formatted.replace(
            /(["“][^"”]*["”])/g, 
            '<span class="text-amber-300 font-semibold drop-shadow-sm">$1</span>'
        );

        return formatted;
    };

    const handleSaveEdit = () => {
        onUpdate(editedText);
        setIsEditing(false);
    };

    const handleCancelEdit = () => {
        setEditedText(text);
        setIsEditing(false);
    };

    if (isEditing) {
        return (
            <div className="w-full flex flex-col gap-2 animate-in fade-in duration-200 border border-mystic-accent/30 p-2 rounded bg-slate-900/80">
                <div className="flex justify-between items-center mb-1">
                    <span className="text-xs font-bold text-mystic-accent uppercase flex items-center gap-1">
                        <Edit2 size={12} /> Editing Raw Context
                    </span>
                    <button onClick={handleCancelEdit} className="text-slate-500 hover:text-white">
                        <X size={14} />
                    </button>
                </div>
                <textarea
                    value={editedText}
                    onChange={(e) => setEditedText(e.target.value)}
                    className="w-full h-96 bg-slate-900 border border-slate-600 rounded p-3 text-xs font-mono text-slate-300 focus:border-mystic-accent outline-none resize-y custom-scrollbar leading-relaxed"
                    placeholder="Nhập nội dung raw (bao gồm cả thẻ <thinking>, <content>...)"
                    spellCheck={false}
                />
                 <div className="flex justify-end gap-2 mt-1">
                    <button 
                        onClick={handleCancelEdit}
                        className="px-3 py-1.5 text-xs text-slate-400 hover:text-white bg-slate-800 rounded border border-slate-700 hover:bg-slate-700 font-medium"
                    >
                        Hủy bỏ
                    </button>
                    <button 
                        onClick={handleSaveEdit}
                        className="px-3 py-1.5 text-xs text-mystic-900 bg-mystic-accent hover:bg-sky-400 rounded font-bold shadow-[0_0_10px_rgba(56,189,248,0.3)] flex items-center gap-1"
                    >
                        <Save size={12} /> Lưu thay đổi
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="flex flex-col gap-2 w-full group">
            {/* Header Row: Thinking Toggle + Edit Button */}
            <div className="flex items-center gap-3 w-full min-h-[20px]">
                {thinkingContent ? (
                    <button 
                        onClick={() => setShowThinking(!showThinking)}
                        className="flex items-center gap-2 text-[10px] uppercase font-bold text-slate-500 hover:text-mystic-accent transition-colors"
                    >
                        <BrainCircuit size={12} />
                        {showThinking ? 'Ẩn dòng tư duy (Tawa Logic)' : 'Hiện dòng tư duy (Tawa Logic)'}
                    </button>
                ) : (
                    <div className="flex-1"></div>
                )}
                
                <button
                    onClick={() => setIsEditing(true)}
                    className={`flex items-center gap-1 text-[10px] font-bold text-slate-600 hover:text-sky-400 uppercase transition-all ${thinkingContent ? 'opacity-0 group-hover:opacity-100' : 'opacity-100'}`}
                    title="Chỉnh sửa Context gốc (Raw)"
                >
                    <Edit2 size={10} /> Edit Raw
                </button>
            </div>
            
            {thinkingContent && (
                <AnimatePresence>
                    {showThinking && (
                        <MotionDiv 
                            initial={{ opacity: 0, height: 0 }}
                            animate={{ opacity: 1, height: 'auto' }}
                            exit={{ opacity: 0, height: 0 }}
                            className="bg-slate-900/50 border-l-2 border-slate-600 p-3 rounded-r text-xs text-slate-400 font-mono overflow-hidden mb-2 whitespace-pre-wrap"
                        >
                            {thinkingContent}
                        </MotionDiv>
                    )}
                </AnimatePresence>
            )}
            
            <div 
              className="font-sans text-base md:text-lg text-slate-300 [&>p]:mb-3 last:[&>p]:mb-0 leading-relaxed"
              dangerouslySetInnerHTML={{ __html: formatContentWithHighlights(mainContent || "") }} 
            />
        </div>
    );
};

// --- RULES MANAGER COMPONENT ---
const RulesManager: React.FC<{
    rules: string[];
    onUpdate: (newRules: string[]) => void;
}> = ({ rules, onUpdate }) => {
    const [isOpen, setIsOpen] = useState(false);
    const [newRule, setNewRule] = useState("");
    const [editIdx, setEditIdx] = useState<number | null>(null);
    const [editValue, setEditValue] = useState("");

    const handleAdd = () => {
        if (!newRule.trim()) return;
        onUpdate([...rules, newRule.trim()]);
        setNewRule("");
    };

    const handleDelete = (idx: number) => {
        onUpdate(rules.filter((_, i) => i !== idx));
    };

    const startEdit = (idx: number, val: string) => {
        setEditIdx(idx);
        setEditValue(val);
    };

    const saveEdit = (idx: number) => {
        const updated = [...rules];
        updated[idx] = editValue;
        onUpdate(updated);
        setEditIdx(null);
    };

    return (
        <>
            <button 
                onClick={() => setIsOpen(true)}
                className="w-full p-3 flex justify-between items-center text-left hover:bg-slate-700/50 transition-colors bg-slate-800/30 rounded-lg border border-slate-700 mb-3"
            >
                <div className="flex items-center gap-2 text-sm font-bold text-red-400 uppercase">
                    <BookOpen size={16} />
                    Luật Lệ & Ràng Buộc
                </div>
                <div className="flex items-center gap-2">
                    <span className="text-[10px] bg-slate-800 px-2 py-0.5 rounded text-slate-400">{rules.length} Active</span>
                </div>
            </button>

            <AnimatePresence>
                {isOpen && (
                    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
                        <MotionDiv 
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.95 }}
                            className="bg-mystic-900 border border-slate-700 w-full max-w-2xl rounded-xl shadow-2xl flex flex-col max-h-[85vh] overflow-hidden"
                        >
                            {/* Modal Header */}
                            <div className="p-4 border-b border-slate-800 flex justify-between items-center bg-slate-900/50 shrink-0">
                                <h2 className="text-lg font-bold text-red-400 flex items-center gap-2">
                                    <BookOpen size={20}/> Luật Bất Khả Kháng
                                </h2>
                                <button onClick={() => setIsOpen(false)} className="text-slate-400 hover:text-white p-1 rounded hover:bg-slate-800 transition-colors">
                                    <X size={24} />
                                </button>
                            </div>

                            {/* Modal Body */}
                            <div className="p-4 flex-1 overflow-y-auto custom-scrollbar">
                                <p className="text-xs text-slate-500 mb-4 italic border-l-2 border-red-900/50 pl-2">
                                    Các quy tắc này có quyền lực tối thượng, ép buộc AI phải tuân theo bất kể ngữ cảnh hay logic thông thường.
                                </p>

                                <div className="space-y-2 mb-4">
                                    {rules.length === 0 && <p className="text-xs text-center text-slate-600 py-8 border border-dashed border-slate-700 rounded-lg">Chưa có luật lệ nào.</p>}
                                    {rules.map((rule, idx) => (
                                        <div key={idx} className="flex gap-2 items-start bg-slate-800/50 p-3 rounded border border-slate-700/50 group hover:border-red-900/50 transition-colors">
                                            <span className="text-red-500 font-bold text-xs mt-0.5">{idx + 1}.</span>
                                            {editIdx === idx ? (
                                                <div className="flex-1 flex gap-2">
                                                    <input 
                                                        autoFocus
                                                        value={editValue}
                                                        onChange={(e) => setEditValue(e.target.value)}
                                                        className="flex-1 bg-slate-900 text-sm text-slate-200 border border-slate-600 rounded px-2 py-1 outline-none focus:border-red-400"
                                                    />
                                                    <button onClick={() => saveEdit(idx)} className="text-green-400 p-1 hover:bg-green-900/20 rounded"><Check size={16}/></button>
                                                </div>
                                            ) : (
                                                <p className="flex-1 text-sm text-slate-300 leading-relaxed">{rule}</p>
                                            )}
                                            
                                            {editIdx !== idx && (
                                                <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                                    <button onClick={() => startEdit(idx, rule)} className="p-1 text-slate-500 hover:text-mystic-accent hover:bg-slate-700 rounded"><Edit2 size={14}/></button>
                                                    <button onClick={() => handleDelete(idx)} className="p-1 text-slate-500 hover:text-red-400 hover:bg-red-900/20 rounded"><Trash2 size={14}/></button>
                                                </div>
                                            )}
                                        </div>
                                    ))}
                                </div>

                                {/* Add New Rule Input */}
                                <div className="flex gap-2 pt-2 border-t border-slate-800">
                                    <input 
                                        value={newRule}
                                        onChange={(e) => setNewRule(e.target.value)}
                                        placeholder="Thêm luật mới (VD: Cấm giết NPC này, Tiền tệ là Vàng)..."
                                        className="flex-1 bg-slate-900 border border-slate-600 rounded px-3 py-2 text-sm text-slate-200 focus:border-red-400 outline-none"
                                        onKeyDown={(e) => e.key === 'Enter' && handleAdd()}
                                    />
                                    <button 
                                        onClick={handleAdd}
                                        className="px-4 bg-red-900/30 border border-red-900/50 text-red-400 rounded hover:bg-red-900/50 font-bold text-sm"
                                    >
                                        Thêm
                                    </button>
                                </div>
                            </div>
                        </MotionDiv>
                    </div>
                )}
            </AnimatePresence>
        </>
    );
};


const GameplayScreen: React.FC<NavigationProps> = ({ onNavigate, activeWorld }) => {
  const [history, setHistory] = useState<ChatMessage[]>([]);
  const [inputValue, setInputValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [settings, setSettings] = useState<AppSettings | null>(null);
  const [turnCount, setTurnCount] = useState(0);
  const [showMobileSidebar, setShowMobileSidebar] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  
  // UI States
  const [showActionChoices, setShowActionChoices] = useState(true);
  const [showCharModal, setShowCharModal] = useState(false);
  const [showGlobalModal, setShowGlobalModal] = useState(false);

  // Pagination State
  const [currentPage, setCurrentPage] = useState(1);

  // Dynamic States (Rules & Tawa)
  const [tawaPresetConfig, setTawaPresetConfig] = useState<TawaPresetConfig>(DEFAULT_PRESET_CONFIG);
  const [dynamicRules, setDynamicRules] = useState<string[]>([]);

  // LSR State
  const [lsrTables, setLsrTables] = useState<LsrTableDefinition[]>([]);
  const [lsrRuntimeData, setLsrRuntimeData] = useState<Record<string, any[]>>({});

  const chatEndRef = useRef<HTMLDivElement>(null);

  // --- Initial Load ---
  useEffect(() => {
    const init = async () => {
      const s = await dbService.getSettings();
      setSettings(s);

      // Load LSR Definitions
      setLsrTables(LsrParser.parseDefinitions());

      if (activeWorld) {
          // Sync initial rules from world config
          setDynamicRules(activeWorld.config.rules || []);

          const worldDataWithState = activeWorld as WorldData;
          if (worldDataWithState.savedState) {
              setHistory(worldDataWithState.savedState.history);
              setTurnCount(worldDataWithState.savedState.turnCount);
          } else if (history.length === 0 && s) {
            // Initial Start: Generate opening
            setIsLoading(true);
            const opening = await gameplayAiService.generateStoryTurn(
              "Hãy bắt đầu câu chuyện.", 
              [], 
              activeWorld, 
              s,
              tawaPresetConfig 
            );
            
            const branchesContent = extractTagContent(opening, 'branches');
            const choicesList = branchesContent 
                ? branchesContent.split('\n').map(c => c.trim()).filter(c => c.length > 0) 
                : [];

            const newMsg: ChatMessage = { 
                role: 'model', 
                text: opening, 
                timestamp: Date.now(),
                choices: choicesList
            };
            setHistory([newMsg]);
            setIsLoading(false);
            setTurnCount(1);
          }
      }
    };
    init();
  }, []);

  // --- LSR Data & History Sync Logic ---
  useEffect(() => {
      if (history.length > 0) {
          const lastMsg = history[history.length - 1];
          // Check if last message is from model and contains table data
          if (lastMsg.role === 'model') {
              const tableContent = extractTagContent(lastMsg.text, 'table_stored');
              if (tableContent) {
                  // Parse Text-based LSR data
                  const parsedData = LsrParser.parseLsrString(tableContent);
                  // Update runtime state
                  setLsrRuntimeData(parsedData);
                  console.log("Updated LSR Sidebar Data:", parsedData);
              }
          }
      }
  }, [history]);

  // --- Auto-Scroll & Pagination Logic ---
  useEffect(() => {
    const totalPages = Math.ceil(history.length / MESSAGES_PER_PAGE) || 1;
    // Auto switch to last page when new message arrives
    if (history.length > 0) {
        setCurrentPage(totalPages);
    }
  }, [history.length]);

  useEffect(() => {
      if (chatEndRef.current) {
          chatEndRef.current.scrollIntoView({ behavior: 'smooth' });
      }
  }, [currentPage, history, isLoading]);


  // --- Handlers ---
  const handleSend = async () => {
    if (!inputValue.trim() || isLoading || !activeWorld || !settings) return;

    const userMsg: ChatMessage = { role: 'user', text: inputValue, timestamp: Date.now() };
    setHistory(prev => [...prev, userMsg]);
    setInputValue('');
    setIsLoading(true);

    const effectiveWorldData: WorldData = {
        ...activeWorld,
        config: {
            ...activeWorld.config,
            rules: dynamicRules
        }
    };

    const responseText = await gameplayAiService.generateStoryTurn(
      userMsg.text,
      history, 
      effectiveWorldData,
      settings,
      tawaPresetConfig
    );

    // Parse branches using extractTagContent
    const branchesContent = extractTagContent(responseText, 'branches');
    const choicesList = branchesContent 
        ? branchesContent.split('\n').map(c => c.trim()).filter(c => c.length > 0) 
        : [];

    const modelMsg: ChatMessage = { 
        role: 'model', 
        text: responseText, 
        timestamp: Date.now(),
        choices: choicesList
    };
    
    setHistory(prev => [...prev, modelMsg]);
    setTurnCount(prev => prev + 1);
    setIsLoading(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleMessageUpdate = (index: number, newText: string) => {
    setHistory(prev => {
        const newHistory = [...prev];
        if (newHistory[index]) {
            newHistory[index] = { ...newHistory[index], text: newText };
            
            if (newHistory[index].role === 'model') {
                const branchesContent = extractTagContent(newText, 'branches');
                const choicesList = branchesContent 
                    ? branchesContent.split('\n').map(c => c.trim()).filter(c => c.length > 0) 
                    : [];
                newHistory[index].choices = choicesList;
            }
        }
        return newHistory;
    });
  };

  const handleSaveAndExit = async () => {
    if (!activeWorld) return;
    setIsSaving(true);
    
    const saveData: WorldData = {
        ...activeWorld,
        savedState: {
            history: history,
            turnCount: turnCount
        },
        config: {
            ...activeWorld.config,
            rules: dynamicRules
        }
    };
    
    const saveId = `manual-${Date.now()}`;
    const saveFile: SaveFile = {
        id: saveId,
        name: `${activeWorld.world.worldName} - Turn ${turnCount}`,
        createdAt: Date.now(),
        updatedAt: Date.now(),
        data: saveData
    };

    try {
        await dbService.saveGameState(saveFile);
        onNavigate(GameState.MENU);
    } catch (e) {
        console.error("Save failed", e);
        alert("Lỗi khi lưu game!");
    } finally {
        setIsSaving(false);
    }
  };

  const handleDownloadSave = () => {
    if (!activeWorld) return;
    
    const saveData: WorldData = {
        ...activeWorld,
        savedState: {
            history: history,
            turnCount: turnCount
        },
        config: {
            ...activeWorld.config,
            rules: dynamicRules
        }
    };

    const fileName = `mythos_save_${activeWorld.world.worldName.replace(/\s+/g, '_').toLowerCase()}_${Date.now()}.json`;
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(saveData, null, 2));
    const downloadAnchorNode = document.createElement('a');
    downloadAnchorNode.setAttribute("href", dataStr);
    downloadAnchorNode.setAttribute("download", fileName);
    document.body.appendChild(downloadAnchorNode);
    downloadAnchorNode.click();
    downloadAnchorNode.remove();
  };

  // --- RENDER ---
  if (!activeWorld) return null;

  const totalPages = Math.ceil(history.length / MESSAGES_PER_PAGE) || 1;
  const startIndex = (currentPage - 1) * MESSAGES_PER_PAGE;
  const displayedMessages = history.slice(startIndex, startIndex + MESSAGES_PER_PAGE);
  const lastModelMessage = [...history].reverse().find(m => m.role === 'model' && m.choices && m.choices.length > 0);
  const activeChoices = lastModelMessage?.choices || [];

  return (
    <div className="flex h-full w-full bg-mystic-900 font-sans overflow-hidden">
        {/* LEFT COLUMN */}
        <div className="flex-1 flex flex-col h-full relative z-10 min-w-0">
            {/* Header ... */}
            <header className="h-16 shrink-0 bg-mystic-900 border-b border-slate-800 flex items-center justify-center relative px-4 z-30 shadow-sm">
                 <button 
                    className="md:hidden absolute left-4 text-slate-400 hover:text-white"
                    onClick={() => setShowMobileSidebar(true)}
                 >
                     <Menu size={24} />
                 </button>
                 <div className="flex flex-col items-center">
                     <h1 className="font-bold text-slate-200 text-lg md:text-xl tracking-wide leading-tight">
                         {activeWorld.world.worldName}
                     </h1>
                     <div className="mt-1">
                        <span className="text-xs font-mono font-bold text-mystic-accent bg-mystic-accent/10 px-3 py-0.5 rounded-full border border-mystic-accent/20">
                            Lượt: {turnCount} | Trang: {currentPage}/{totalPages}
                        </span>
                     </div>
                 </div>
            </header>

            {/* Chat Area */}
            <div className="flex-1 overflow-y-auto custom-scrollbar p-2 pb-0 md:px-3 md:pb-0 space-y-4 w-full bg-mystic-900">
                    {displayedMessages.map((msg, idx) => (
                        <MotionDiv 
                            key={`${currentPage}-${idx}`}
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            className={`flex w-full ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
                        >
                            <div className={`relative rounded-lg p-3 md:p-5 leading-relaxed shadow-md text-base ${
                                msg.role === 'user' 
                                    ? 'bg-slate-800 border border-slate-700 text-slate-200 rounded-tr-none max-w-[90%] md:max-w-[85%]' 
                                    : 'bg-transparent text-slate-300 pl-0 w-full'
                            }`}>
                                <TawaMessageRenderer 
                                    text={msg.text}
                                    onUpdate={(newText) => handleMessageUpdate(startIndex + idx, newText)}
                                />
                            </div>
                        </MotionDiv>
                    ))}
                    {isLoading && (
                        <div className="flex flex-col items-center justify-center p-6 space-y-3 animate-fade-in w-full border-t border-slate-800/30">
                            <Loader2 className="w-8 h-8 text-mystic-accent animate-spin" />
                            <span className="text-sm font-medium text-slate-400 animate-pulse">
                                Đang kiến tạo diễn biến...
                            </span>
                        </div>
                    )}
                    <div ref={chatEndRef} />
            </div>

            {/* Input Area ... (Same as before) */}
            <div className="bg-mystic-900 border-t border-slate-800 z-20 shrink-0 flex flex-col shadow-[0_-5px_15px_rgba(0,0,0,0.2)]">
                {/* ACTION CHOICES */}
                <AnimatePresence>
                    {activeChoices.length > 0 && showActionChoices && !isLoading && (
                        <MotionDiv 
                            initial={{ height: 0, opacity: 0 }}
                            animate={{ height: 'auto', opacity: 1 }}
                            exit={{ height: 0, opacity: 0 }}
                            className="bg-slate-900/95 backdrop-blur border-b border-slate-800 max-h-[50vh] overflow-y-auto custom-scrollbar"
                        >
                             <div className="p-3 flex flex-col gap-2 md:grid md:grid-cols-2 md:gap-3">
                                {activeChoices.map((choice, idx) => (
                                    <MotionButton
                                        key={idx}
                                        whileHover={{ scale: 1.01, backgroundColor: "rgba(56, 189, 248, 0.1)" }}
                                        whileTap={{ scale: 0.98 }}
                                        onClick={() => setInputValue(choice)}
                                        className="w-full text-left text-xs md:text-sm p-3 rounded bg-slate-800 border border-slate-700 hover:border-mystic-accent/50 text-slate-300 hover:text-white transition-all shadow-sm group h-auto whitespace-normal"
                                    >
                                        <div className="flex gap-2 items-start">
                                            <GitBranch size={14} className="mt-0.5 text-slate-500 group-hover:text-mystic-accent shrink-0" />
                                            <span className="line-clamp-3">{choice}</span>
                                        </div>
                                    </MotionButton>
                                ))}
                            </div>
                        </MotionDiv>
                    )}
                </AnimatePresence>

                {/* Input Bar */}
                <div className="p-3 md:p-5 flex flex-col gap-2">
                    {/* Toggle Button */}
                    {activeChoices.length > 0 && !isLoading && (
                        <div className="flex justify-center -mt-3 mb-1">
                             <button onClick={() => setShowActionChoices(!showActionChoices)} className="bg-slate-800 border border-slate-700 border-t-0 rounded-b-lg px-4 py-0.5 text-[10px] text-slate-400 hover:text-mystic-accent hover:bg-slate-700 transition-colors flex items-center gap-1 shadow-sm">
                                 <GripHorizontal size={12} />
                                 {showActionChoices ? 'Thu gọn gợi ý' : 'Mở rộng gợi ý'}
                                 {showActionChoices ? <ChevronsDown size={12} className="rotate-180"/> : <ChevronsDown size={12}/>}
                             </button>
                        </div>
                    )}
                    <div className="w-full flex gap-2">
                        <textarea 
                            value={inputValue}
                            onChange={(e) => setInputValue(e.target.value)}
                            onKeyDown={handleKeyDown}
                            placeholder="Nhập hành động của bạn..."
                            className="flex-1 bg-slate-800/80 border border-slate-700 rounded-lg p-3 text-slate-200 outline-none focus:border-mystic-accent focus:bg-slate-800 transition-all resize-none h-14 md:h-16 custom-scrollbar font-sans text-sm md:text-base"
                        />
                        <Button variant="primary" onClick={handleSend} disabled={isLoading || !inputValue.trim()} className="h-14 md:h-16 px-4 md:px-6">
                            <Send size={20} />
                        </Button>
                    </div>
                    {/* Pagination */}
                    <div className="flex justify-center">
                        {/* ... Pagination code same as before ... */}
                        <div className="flex items-center gap-0.5 bg-slate-800/90 p-[2px] rounded-full border border-slate-700/50 backdrop-blur-sm shadow-sm scale-90 origin-bottom">
                            <button onClick={() => setCurrentPage(Math.max(1, currentPage - 1))} disabled={currentPage === 1} className="w-5 h-5 flex items-center justify-center rounded-full hover:bg-slate-700 text-slate-400 disabled:opacity-20 transition-colors"><ChevronLeft size={10} /></button>
                            <span className="text-[9px] font-bold text-slate-500 px-2">{currentPage}/{totalPages}</span>
                            <button onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))} disabled={currentPage === totalPages} className="w-5 h-5 flex items-center justify-center rounded-full hover:bg-slate-700 text-slate-400 disabled:opacity-20 transition-colors"><ChevronRight size={10} /></button>
                        </div>
                    </div>
                </div>
            </div>
        </div>

        {/* SIDEBAR */}
        <div className="hidden md:block w-80 shrink-0 h-full relative z-20 border-l border-slate-800">
            {/* Sidebar content logic (reused for mobile) */}
            <div className="h-full flex flex-col bg-mystic-900 shadow-xl">
                <div className="p-4 border-b border-slate-800 bg-mystic-800/50 shrink-0 space-y-2">
                    <button onClick={() => setShowCharModal(true)} className="w-full flex items-center gap-3 p-3 bg-slate-800/50 hover:bg-slate-700 border border-slate-700 rounded-lg transition-all group">
                        <div className="w-10 h-10 rounded-full bg-slate-900 border border-slate-600 flex items-center justify-center shrink-0 group-hover:border-mystic-accent"><User className="text-mystic-accent" size={20}/></div>
                        <div className="text-left"><h3 className="font-bold text-slate-200 text-sm">{activeWorld.player.name}</h3></div>
                    </button>
                    <button onClick={() => setShowGlobalModal(true)} className="w-full flex items-center gap-3 p-3 bg-slate-800/50 hover:bg-slate-700 border border-slate-700 rounded-lg transition-all group">
                        <div className="w-10 h-10 rounded-full bg-slate-900 border border-slate-600 flex items-center justify-center shrink-0 group-hover:border-green-400"><Globe className="text-green-400" size={20}/></div>
                        <div className="text-left"><h3 className="font-bold text-slate-200 text-sm">Thông tin toàn cục</h3></div>
                    </button>
                </div>
                <div className="flex-1 min-h-0 overflow-y-auto custom-scrollbar p-4 space-y-6">
                    <RulesManager rules={dynamicRules} onUpdate={setDynamicRules} />
                    <TawaPresetManager onConfigChange={setTawaPresetConfig} />
                </div>
                <div className="p-4 border-t border-slate-800 bg-mystic-900/95 space-y-2 mt-auto shrink-0">
                    <Button variant="outline" className="w-full text-xs h-10 justify-start pl-4" icon={<Download size={14}/>} onClick={handleDownloadSave}>Tải file Save (.json)</Button>
                    <Button variant="danger" className="w-full text-xs h-10 justify-start pl-4" icon={<Save size={14}/>} onClick={handleSaveAndExit} isLoading={isSaving}>Lưu & Thoát</Button>
                </div>
            </div>
        </div>

        {/* MODALS */}
        {/* Character Modal (UPDATED WITH FULL INFO) */}
        <AnimatePresence>
            {showCharModal && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
                    <MotionDiv 
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.95 }}
                        className="bg-mystic-900 border border-slate-700 w-full max-w-2xl rounded-xl shadow-2xl flex flex-col max-h-[85vh] overflow-hidden"
                    >
                        <div className="p-4 border-b border-slate-800 flex justify-between items-center bg-slate-900/50">
                            <h2 className="text-lg font-bold text-slate-200 flex items-center gap-2">
                                <User size={20} className="text-mystic-accent"/> Hồ Sơ Nhân Vật
                            </h2>
                            <button onClick={() => setShowCharModal(false)} className="text-slate-400 hover:text-white p-1 rounded hover:bg-slate-800 transition-colors">
                                <X size={24} />
                            </button>
                        </div>

                        <div className="p-6 overflow-y-auto custom-scrollbar space-y-6">
                            <div className="flex items-start gap-4 mb-6">
                                <div className="w-20 h-20 rounded-full bg-slate-800 border-2 border-mystic-accent flex items-center justify-center shrink-0 shadow-[0_0_15px_rgba(56,189,248,0.3)]">
                                    <User size={40} className="text-mystic-accent" />
                                </div>
                                <div>
                                    <h3 className="text-2xl font-bold text-white mb-1">{activeWorld.player.name}</h3>
                                    <div className="flex gap-2 text-sm text-slate-400">
                                        <span className="bg-slate-800 px-2 py-0.5 rounded border border-slate-700">{activeWorld.player.gender}</span>
                                        <span className="bg-slate-800 px-2 py-0.5 rounded border border-slate-700">{activeWorld.player.age} tuổi</span>
                                    </div>
                                </div>
                            </div>

                            <div className="grid grid-cols-1 gap-4">
                                <div className="space-y-1">
                                    <h4 className="text-xs font-bold text-mystic-accent uppercase tracking-wider">Ngoại hình</h4>
                                    <p className="text-sm text-slate-300 bg-slate-800/50 p-3 rounded border border-slate-700/50 leading-relaxed whitespace-pre-line">
                                        {activeWorld.player.appearance || "Chưa có mô tả ngoại hình."}
                                    </p>
                                </div>

                                <div className="space-y-1">
                                    <h4 className="text-xs font-bold text-mystic-accent uppercase tracking-wider">Tính cách</h4>
                                    <p className="text-sm text-slate-300 bg-slate-800/50 p-3 rounded border border-slate-700/50 leading-relaxed whitespace-pre-line">
                                        {activeWorld.player.personality || "Chưa có mô tả tính cách."}
                                    </p>
                                </div>

                                <div className="space-y-1">
                                    <h4 className="text-xs font-bold text-mystic-accent uppercase tracking-wider">Tiểu sử & Xuất thân</h4>
                                    <p className="text-sm text-slate-300 bg-slate-800/50 p-3 rounded border border-slate-700/50 leading-relaxed whitespace-pre-line">
                                        {activeWorld.player.background || "Chưa có tiểu sử."}
                                    </p>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div className="space-y-1">
                                        <h4 className="text-xs font-bold text-mystic-accent uppercase tracking-wider">Kỹ năng</h4>
                                        <p className="text-sm text-slate-300 bg-slate-800/50 p-3 rounded border border-slate-700/50 leading-relaxed h-full whitespace-pre-line">
                                            {activeWorld.player.skills || "Không có kỹ năng đặc biệt."}
                                        </p>
                                    </div>
                                    <div className="space-y-1">
                                        <h4 className="text-xs font-bold text-mystic-accent uppercase tracking-wider">Mục tiêu</h4>
                                        <p className="text-sm text-slate-300 bg-slate-800/50 p-3 rounded border border-slate-700/50 leading-relaxed h-full whitespace-pre-line">
                                            {activeWorld.player.goal || "Chưa xác định mục tiêu."}
                                        </p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </MotionDiv>
                </div>
            )}
        </AnimatePresence>
        
        {/* GLOBAL INFO (LSR) MODAL (UPDATED) */}
        <AnimatePresence>
            {showGlobalModal && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
                    <MotionDiv 
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.95 }}
                        className="bg-mystic-900 border border-slate-700 w-full max-w-4xl rounded-xl shadow-2xl flex flex-col max-h-[90vh] overflow-hidden"
                    >
                        <div className="p-4 border-b border-slate-800 flex justify-between items-center bg-slate-900/50">
                            <h2 className="text-lg font-bold text-green-400 flex items-center gap-2">
                                <Database size={20}/> LSR Database (Trạng thái thế giới)
                            </h2>
                            <button onClick={() => setShowGlobalModal(false)} className="text-slate-400 hover:text-white p-1 rounded hover:bg-slate-800 transition-colors">
                                <X size={24} />
                            </button>
                        </div>
                        <div className="p-6 overflow-y-auto custom-scrollbar space-y-8">
                            {lsrTables.length === 0 ? (
                                <div className="text-center text-slate-500 py-10">
                                    Không tìm thấy dữ liệu cấu trúc bảng LSR.
                                </div>
                            ) : (
                                lsrTables.map((table) => {
                                    const currentRows = lsrRuntimeData[table.id] || [];
                                    return (
                                        <div key={table.id} className="space-y-2">
                                            <div className="flex items-center gap-2">
                                                <span className="bg-slate-800 text-slate-400 text-xs font-bold px-2 py-0.5 rounded">#{table.id}</span>
                                                <h3 className="font-bold text-slate-200">{table.name}</h3>
                                            </div>
                                            <div className="overflow-x-auto rounded-lg border border-slate-700 shadow-sm">
                                                <table className="w-full text-sm text-left text-slate-400">
                                                    <thead className="text-xs text-slate-300 uppercase bg-slate-800">
                                                        <tr>
                                                            {table.columns.map((col, idx) => (
                                                                <th key={idx} scope="col" className="px-4 py-3 whitespace-nowrap border-r border-slate-700 last:border-r-0">
                                                                    {col}
                                                                </th>
                                                            ))}
                                                        </tr>
                                                    </thead>
                                                    <tbody>
                                                        {currentRows.length === 0 ? (
                                                            <tr className="bg-slate-900/50 border-b border-slate-800 hover:bg-slate-800/30 transition-colors">
                                                                <td colSpan={table.columns.length} className="px-4 py-3 border-r border-slate-800 last:border-r-0 italic text-slate-600 text-center">
                                                                    (Chưa có dữ liệu)
                                                                </td>
                                                            </tr>
                                                        ) : (
                                                            currentRows.map((row, rIdx) => (
                                                                <tr key={rIdx} className="bg-slate-900/50 border-b border-slate-800 hover:bg-slate-800/30 transition-colors">
                                                                    {table.columns.map((_, cIdx) => (
                                                                        <td key={cIdx} className="px-4 py-3 border-r border-slate-800 last:border-r-0 text-slate-300">
                                                                            {row[cIdx.toString()] || "-"}
                                                                        </td>
                                                                    ))}
                                                                </tr>
                                                            ))
                                                        )}
                                                    </tbody>
                                                </table>
                                            </div>
                                        </div>
                                    );
                                })
                            )}
                        </div>
                    </MotionDiv>
                </div>
            )}
        </AnimatePresence>
    </div>
  );
};

export default GameplayScreen;
