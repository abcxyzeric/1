import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { ArrowLeft, Cpu, Sliders, BrainCircuit, AlertTriangle } from 'lucide-react';
import { NavigationProps, GameState, AppSettings, ThinkingBudgetLevel } from '../../../types';
import SafetySettings from './SafetySettings';
import { dbService } from '../../../services/db/indexedDB';
import Button from '../../ui/Button';

const SettingsScreen: React.FC<NavigationProps> = ({ onNavigate }) => {
  const [settings, setSettings] = useState<AppSettings | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    const load = async () => {
      const s = await dbService.getSettings();
      setSettings(s);
    };
    load();
  }, []);

  const handleChange = <K extends keyof AppSettings>(key: K, value: AppSettings[K]) => {
    if (settings) {
      setSettings({ ...settings, [key]: value });
    }
  };

  const handleGlobalUpdate = (newSettings: AppSettings) => {
    setSettings(newSettings);
  };

  const handleSave = async () => {
    if (!settings) return;
    setIsSaving(true);
    await dbService.saveSettings(settings);
    setIsSaving(false);
    onNavigate(GameState.MENU);
  };

  if (!settings) return <div className="flex items-center justify-center h-full text-slate-400">Đang tải cấu hình...</div>;

  return (
    <div className="flex flex-col h-full w-full bg-mystic-900 text-slate-200 overflow-hidden">
        {/* Header */}
        <div className="p-4 md:p-6 border-b border-slate-800 bg-mystic-900/95 backdrop-blur z-20 flex justify-between items-center shrink-0">
            <button 
                onClick={() => onNavigate(GameState.MENU)}
                className="flex items-center gap-2 text-slate-400 hover:text-white transition-colors"
            >
                <ArrowLeft size={20} /> <span className="font-bold">Quay lại Menu</span>
            </button>
            <h2 className="text-xl font-sans font-bold text-mystic-accent">Cài Đặt Hệ Thống</h2>
            <div className="w-20"></div> 
        </div>

        {/* Scrollable Content */}
        <div className="flex-1 overflow-y-auto custom-scrollbar p-4 md:p-8 max-w-4xl mx-auto w-full space-y-8 pb-24">
            
            {/* AI Model Selection */}
            <section className="space-y-4">
                <h3 className="text-lg font-bold text-slate-200 flex items-center gap-2 pb-2 border-b border-slate-800">
                    <Cpu size={20} className="text-mystic-accent"/> Model Trí Tuệ Nhân Tạo
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div 
                        onClick={() => handleChange('aiModel', 'gemini-3-pro-preview')}
                        className={`cursor-pointer p-4 rounded-lg border transition-all ${settings.aiModel === 'gemini-3-pro-preview' ? 'bg-mystic-accent/10 border-mystic-accent' : 'bg-slate-800 border-slate-700 hover:border-slate-500'}`}
                    >
                        <div className="font-bold mb-1">Gemini 3.0 Pro</div>
                        <div className="text-xs text-slate-400">Khả năng tư duy cao, hỗ trợ Thinking Budget lớn. Phù hợp cốt truyện phức tạp.</div>
                    </div>
                    <div 
                        onClick={() => handleChange('aiModel', 'gemini-3-flash-preview')}
                        className={`cursor-pointer p-4 rounded-lg border transition-all ${settings.aiModel === 'gemini-3-flash-preview' ? 'bg-mystic-accent/10 border-mystic-accent' : 'bg-slate-800 border-slate-700 hover:border-slate-500'}`}
                    >
                        <div className="font-bold mb-1">Gemini 3.0 Flash</div>
                        <div className="text-xs text-slate-400">Tốc độ nhanh, phản hồi tức thì. Phù hợp hội thoại ngắn.</div>
                    </div>
                </div>
            </section>

            {/* Advanced Generation Params */}
            <section className="space-y-6">
                 <h3 className="text-lg font-bold text-slate-200 flex items-center gap-2 pb-2 border-b border-slate-800">
                    <Sliders size={20} className="text-mystic-accent"/> Tham số Sinh (Generation)
                </h3>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-6">
                    {/* Temperature */}
                    <div className="space-y-2">
                        <div className="flex justify-between text-sm">
                            <label className="font-medium text-slate-300">Temperature (Độ sáng tạo)</label>
                            <span className="text-mystic-accent font-mono">{settings.temperature}</span>
                        </div>
                        <input 
                            type="range" min="0" max="2" step="0.1" 
                            value={settings.temperature}
                            onChange={(e) => handleChange('temperature', parseFloat(e.target.value))}
                            className="w-full accent-mystic-accent bg-slate-700 h-1 rounded-lg appearance-none cursor-pointer"
                        />
                        <p className="text-[10px] text-slate-500">Cao: Sáng tạo, khó đoán. Thấp: Chính xác, lặp lại.</p>
                    </div>

                    {/* Thinking Budget */}
                    <div className="space-y-2">
                         <div className="flex justify-between text-sm">
                            <label className="font-medium text-slate-300 flex items-center gap-1">
                                Thinking Budget <BrainCircuit size={14} className="text-purple-400"/>
                            </label>
                            <span className="text-purple-400 font-mono uppercase">{settings.thinkingBudgetLevel}</span>
                        </div>
                        <select 
                            value={settings.thinkingBudgetLevel}
                            onChange={(e) => handleChange('thinkingBudgetLevel', e.target.value as ThinkingBudgetLevel)}
                            className="w-full bg-slate-800 border border-slate-600 rounded p-2 text-sm text-slate-200 focus:border-mystic-accent outline-none"
                            disabled={settings.aiModel !== 'gemini-3-pro-preview'} // Example restriction
                        >
                            <option value="auto">Auto (0 tokens)</option>
                            <option value="low">Low (4,096 tokens)</option>
                            <option value="medium">Medium (16,384 tokens)</option>
                            <option value="high">High (32,768 tokens)</option>
                        </select>
                        <p className="text-[10px] text-slate-500">Dành token cho việc suy nghĩ logic trước khi trả lời. Chỉ hoạt động trên dòng Model 3.0/2.5 Pro.</p>
                    </div>

                    {/* Top K */}
                    <div className="space-y-2">
                        <div className="flex justify-between text-sm">
                            <label className="font-medium text-slate-300">Top K</label>
                            <span className="text-mystic-accent font-mono">{settings.topK}</span>
                        </div>
                        <input 
                            type="range" min="1" max="100" step="1" 
                            value={settings.topK}
                            onChange={(e) => handleChange('topK', parseInt(e.target.value))}
                            className="w-full accent-mystic-accent bg-slate-700 h-1 rounded-lg appearance-none cursor-pointer"
                        />
                    </div>

                    {/* Top P */}
                    <div className="space-y-2">
                        <div className="flex justify-between text-sm">
                            <label className="font-medium text-slate-300">Top P</label>
                            <span className="text-mystic-accent font-mono">{settings.topP}</span>
                        </div>
                        <input 
                            type="range" min="0" max="1" step="0.01" 
                            value={settings.topP}
                            onChange={(e) => handleChange('topP', parseFloat(e.target.value))}
                            className="w-full accent-mystic-accent bg-slate-700 h-1 rounded-lg appearance-none cursor-pointer"
                        />
                    </div>

                    {/* Context Size */}
                    <div className="space-y-2">
                        <label className="block text-sm font-medium text-slate-300">Context Size (Tokens)</label>
                        <input 
                            type="number" 
                            value={settings.contextSize}
                            onChange={(e) => handleChange('contextSize', parseInt(e.target.value))}
                            className="w-full bg-slate-800 border border-slate-600 rounded p-2 text-sm text-slate-200 focus:border-mystic-accent outline-none font-mono"
                        />
                        <p className="text-[10px] text-slate-500">Gemini 1.5/3.0 hỗ trợ lên đến 2,000,000 tokens.</p>
                    </div>

                    {/* Max Output */}
                    <div className="space-y-2">
                        <label className="block text-sm font-medium text-slate-300">Max Response Length (Tokens)</label>
                        <input 
                            type="number" 
                            value={settings.maxOutputTokens}
                            onChange={(e) => handleChange('maxOutputTokens', parseInt(e.target.value))}
                            className="w-full bg-slate-800 border border-slate-600 rounded p-2 text-sm text-slate-200 focus:border-mystic-accent outline-none font-mono"
                        />
                        <p className="text-[10px] text-slate-500">Giới hạn độ dài câu trả lời của AI.</p>
                    </div>
                </div>
            </section>

             {/* Safety */}
             <section className="space-y-4">
                 <SafetySettings 
                    settings={settings}
                    onUpdate={handleGlobalUpdate}
                    onSave={handleSave}
                    isSaving={isSaving}
                 />
             </section>

             <div className="h-10"></div>
        </div>
    </div>
  );
};

export default SettingsScreen;