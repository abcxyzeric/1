
import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Shield, ShieldCheck } from 'lucide-react';
import { AppSettings } from '../../../types';
import Button from '../../ui/Button';

const CATEGORY_NAMES: Record<string, string> = {
  'HARM_CATEGORY_HARASSMENT': 'Quấy rối (Harassment)',
  'HARM_CATEGORY_HATE_SPEECH': 'Ngôn từ thù ghét (Hate Speech)',
  'HARM_CATEGORY_SEXUALLY_EXPLICIT': 'Nội dung khiêu dâm (Sexually Explicit)',
  'HARM_CATEGORY_DANGEROUS_CONTENT': 'Nội dung nguy hiểm (Dangerous)',
  'HARM_CATEGORY_CIVIC_INTEGRITY': 'Liêm chính công dân (Civic Integrity)',
};

interface SafetySettingsProps {
  settings: AppSettings;
  onUpdate: (newSettings: AppSettings) => void;
  onSave: () => void;
  isSaving: boolean;
}

const SafetySettings: React.FC<SafetySettingsProps> = ({ settings, onUpdate, onSave, isSaving }) => {
  const MotionDiv = motion.div as any;

  const handleToggle = (category: string) => {
    if (!settings.safetySettings) return;

    const newSafetySettings = settings.safetySettings.map(s => {
      if (s.category === category) {
        // Toggle between BLOCK_NONE (OFF) and BLOCK_MEDIUM_AND_ABOVE (ON/Default)
        return { 
          ...s, 
          threshold: s.threshold === 'BLOCK_NONE' ? 'BLOCK_MEDIUM_AND_ABOVE' : 'BLOCK_NONE' 
        };
      }
      return s;
    });

    onUpdate({
      ...settings,
      safetySettings: newSafetySettings
    });
  };

  return (
    <div className="flex flex-col gap-4">
      <div className="bg-mystic-800/50 p-4 rounded-lg border border-slate-700">
        <div className="flex items-start gap-3 mb-4">
           <Shield className="text-mystic-accent mt-1" />
           <div>
             <h3 className="font-bold text-slate-200">Bộ lọc an toàn AI</h3>
             <p className="text-xs text-slate-400 mt-1">
               Cấu hình mức độ kiểm duyệt nội dung của AI. 
               <br/>
               <span className="text-red-400">Lưu ý: Tắt bộ lọc (OFF) có thể tạo ra nội dung không phù hợp.</span>
             </p>
           </div>
        </div>

        <div className="space-y-3">
          {settings.safetySettings?.map((setting) => {
            const isOff = setting.threshold === 'BLOCK_NONE';
            return (
              <MotionDiv 
                key={setting.category} 
                className={`flex justify-between items-center p-3 rounded border transition-colors ${isOff ? 'bg-red-900/10 border-red-900/30' : 'bg-slate-800 border-slate-700'}`}
              >
                <div className="flex flex-col">
                  <span className="text-sm font-medium text-slate-300">
                    {CATEGORY_NAMES[setting.category] || setting.category}
                  </span>
                  <span className={`text-[10px] uppercase font-bold ${isOff ? 'text-red-500' : 'text-green-500'}`}>
                    {isOff ? 'Đã tắt bộ lọc (Không an toàn)' : 'Đang bật (Mặc định)'}
                  </span>
                </div>
                
                <button
                  onClick={() => handleToggle(setting.category)}
                  className={`w-12 h-6 rounded-full p-1 transition-colors flex items-center ${isOff ? 'bg-slate-700 justify-start' : 'bg-mystic-accent justify-end'}`}
                >
                   <MotionDiv layout className="w-4 h-4 bg-white rounded-full shadow-md" />
                </button>
              </MotionDiv>
            );
          })}
        </div>
      </div>
      
      <div className="flex justify-end mt-2">
        <Button onClick={onSave} isLoading={isSaving} icon={<ShieldCheck size={18}/>}>
          Lưu cấu hình
        </Button>
      </div>
    </div>
  );
};

export default SafetySettings;