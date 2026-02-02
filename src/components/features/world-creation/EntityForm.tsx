
import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { X, Save, Sparkles } from 'lucide-react';
import { Entity, EntityType } from '../../../types';
import Button from '../../ui/Button';
import { worldAiService } from '../../../services/ai/world-creation/service';

interface EntityFormProps {
  initialData?: Entity;
  onSave: (entity: Omit<Entity, 'id'>) => void;
  onCancel: () => void;
}

const EntityForm: React.FC<EntityFormProps> = ({ initialData, onSave, onCancel }) => {
  const [type, setType] = useState<EntityType>(initialData?.type || 'NPC');
  const [name, setName] = useState(initialData?.name || '');
  const [description, setDescription] = useState(initialData?.description || '');
  const [personality, setPersonality] = useState(initialData?.personality || '');
  const [customType, setCustomType] = useState(initialData?.customType || '');
  const [isGenerating, setIsGenerating] = useState(false);
  
  const MotionDiv = motion.div as any;

  const handleSave = () => {
    if (!name.trim()) return alert("Tên thực thể không được để trống");
    
    const entity: Omit<Entity, 'id'> = {
      type,
      name,
      description,
      ...(type === 'NPC' && { personality }),
      ...(type === 'CUSTOM' && { customType })
    };
    onSave(entity);
  };

  const handleAiSuggest = async (field: 'description' | 'personality') => {
    if (!name.trim()) {
        alert("⚠️ Vui lòng nhập Tên thực thể trước khi sử dụng gợi ý!");
        return;
    }

    setIsGenerating(true);
    try {
      const contextData = { name, type, genre: '' }; // Genre could be passed in props for better context if available
      const content = await worldAiService.generateFieldContent('entity', field, contextData);
      
      if (field === 'description') {
          setDescription(content);
      } else {
          setPersonality(content);
      }
    } catch (error) {
        console.error(error);
        alert("Lỗi kết nối AI.");
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
      <MotionDiv 
        initial={{ scale: 0.9, opacity: 0 }} 
        animate={{ scale: 1, opacity: 1 }} 
        className="bg-mystic-900 w-full max-w-lg rounded-lg border border-slate-700 shadow-2xl overflow-hidden"
      >
        <div className="flex justify-between items-center p-4 border-b border-slate-800 bg-slate-900">
          <h3 className="text-lg font-bold text-slate-200">
            {initialData ? 'Chỉnh sửa thực thể' : 'Thêm thực thể mới'}
          </h3>
          <button onClick={onCancel} className="text-slate-400 hover:text-white">
            <X size={20} />
          </button>
        </div>

        <div className="p-6 space-y-4">
          <div className="space-y-2">
            <label className="text-sm font-medium text-mystic-accent">Loại thực thể</label>
            <select 
              value={type} 
              onChange={(e) => setType(e.target.value as EntityType)}
              className="w-full bg-slate-800 border border-slate-600 rounded p-2 text-slate-100 focus:border-mystic-accent outline-none"
            >
              <option value="NPC">NPC (Nhân vật)</option>
              <option value="LOCATION">Địa điểm</option>
              <option value="CUSTOM">Tùy chỉnh</option>
            </select>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium text-mystic-accent">Tên gọi</label>
            <input 
              type="text" 
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full bg-slate-800 border border-slate-600 rounded p-2 text-slate-100 focus:border-mystic-accent outline-none"
              placeholder="Ví dụ: Lão Hạc, Thành phố Bay..."
            />
          </div>

          {type === 'CUSTOM' && (
            <div className="space-y-2">
              <label className="text-sm font-medium text-mystic-accent">Phân loại</label>
              <input 
                type="text" 
                value={customType}
                onChange={(e) => setCustomType(e.target.value)}
                className="w-full bg-slate-800 border border-slate-600 rounded p-2 text-slate-100 focus:border-mystic-accent outline-none"
                placeholder="Ví dụ: Vật phẩm, Thần thú..."
              />
            </div>
          )}

          <div className="space-y-2 relative">
            <label className="text-sm font-medium text-mystic-accent flex justify-between">
              <span>Mô tả</span>
              <button 
                onClick={() => handleAiSuggest('description')} 
                disabled={isGenerating}
                className="text-xs flex items-center gap-1 text-mystic-accent/80 hover:text-mystic-accent"
              >
                {isGenerating ? <span className="animate-spin">⏳</span> : <Sparkles size={12} />} 
                AI Gợi ý
              </button>
            </label>
            <textarea 
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full h-24 bg-slate-800 border border-slate-600 rounded p-2 text-slate-100 focus:border-mystic-accent outline-none resize-none"
              placeholder="Mô tả chi tiết về thực thể này..."
            />
          </div>

          {type === 'NPC' && (
            <div className="space-y-2">
              <label className="text-sm font-medium text-mystic-accent flex justify-between">
                  <span>Tính cách</span>
                  <button 
                    onClick={() => handleAiSuggest('personality')} 
                    disabled={isGenerating}
                    className="text-xs flex items-center gap-1 text-mystic-accent/80 hover:text-mystic-accent"
                  >
                    {isGenerating ? <span className="animate-spin">⏳</span> : <Sparkles size={12} />} 
                    AI Gợi ý
                  </button>
              </label>
              <input 
                type="text" 
                value={personality}
                onChange={(e) => setPersonality(e.target.value)}
                className="w-full bg-slate-800 border border-slate-600 rounded p-2 text-slate-100 focus:border-mystic-accent outline-none"
                placeholder="Ví dụ: Nóng tính, Thích đùa..."
              />
            </div>
          )}
        </div>

        <div className="p-4 border-t border-slate-800 bg-slate-900 flex justify-end gap-3">
          <Button variant="ghost" onClick={onCancel}>Hủy</Button>
          <Button variant="primary" onClick={handleSave} icon={<Save size={16} />}>Lưu</Button>
        </div>
      </MotionDiv>
    </div>
  );
};

export default EntityForm;
