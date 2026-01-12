import React, { useState, useEffect } from 'react';
import { Course, Organizer } from '../types';
import { REGIONS, DEFAULT_IMAGES } from '../constants';
import { X, Link as LinkIcon, Trash2, Plus, Info, Tag as TagIcon } from 'lucide-react';

interface AddCourseModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (course: Course) => void;
  onDelete?: (id: string) => void;
  courseToEdit?: Course;
}

export const AddCourseModal: React.FC<AddCourseModalProps> = ({ isOpen, onClose, onSave, onDelete, courseToEdit }) => {
  const [formData, setFormData] = useState<Partial<Course>>({
    organizer: Organizer.KVLO,
    region: 'Landelijk',
    price: 0,
    tags: [],
    url: ''
  });
  const [tagInput, setTagInput] = useState('');

  useEffect(() => {
    if (isOpen) {
      if (courseToEdit) {
        setFormData({ ...courseToEdit });
      } else {
        setFormData({
          organizer: Organizer.KVLO,
          region: 'Landelijk',
          price: 0,
          tags: [],
          url: '',
          date: new Date().toISOString().split('T')[0]
        });
      }
    }
  }, [isOpen, courseToEdit]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.title || !formData.date || !formData.description) return;

    const id = courseToEdit?.id || Date.now().toString();
    const imageUrl = formData.imageUrl || (courseToEdit ? courseToEdit.imageUrl : DEFAULT_IMAGES[Math.floor(Math.random() * DEFAULT_IMAGES.length)]);

    const savedCourse: Course = {
      id,
      title: formData.title,
      organizer: formData.organizer as Organizer,
      date: formData.date,
      location: formData.location || 'Onbekend',
      region: formData.region || 'Landelijk',
      price: Number(formData.price) || 0,
      description: formData.description,
      tags: formData.tags || [],
      url: formData.url && formData.url.length > 0 ? formData.url : '#',
      imageUrl,
      isNew: courseToEdit ? courseToEdit.isNew : true
    };

    onSave(savedCourse);
    onClose();
  };

  const handleAddTag = (e: React.MouseEvent | React.KeyboardEvent) => {
    e.preventDefault();
    if (tagInput.trim()) {
      setFormData(prev => ({
        ...prev,
        tags: [...(prev.tags || []), tagInput.trim()]
      }));
      setTagInput('');
    }
  };

  const inputClasses = "w-full px-4 py-3 bg-white border-2 border-slate-300 rounded-xl focus:ring-4 focus:ring-[#7AB800]/10 focus:border-[#7AB800] outline-none transition-all text-slate-800 font-semibold placeholder:text-slate-400 shadow-sm";
  const labelClasses = "block text-sm font-black text-slate-800 uppercase tracking-tight mb-2 ml-1";

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/80 backdrop-blur-md">
      <div className="bg-slate-50 rounded-3xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-hidden flex flex-col transform transition-all animate-in zoom-in-95 duration-200 border border-white/20">
        
        {/* Header */}
        <div className="p-6 bg-white border-b border-slate-200 flex justify-between items-center shrink-0">
          <div className="flex items-center gap-4">
            <div className={`p-3 rounded-2xl ${courseToEdit ? 'bg-amber-50 text-amber-600' : 'bg-green-50 text-[#7AB800]'}`}>
               {courseToEdit ? <Info className="w-6 h-6" /> : <Plus className="w-6 h-6" />}
            </div>
            <div>
              <h2 className="text-xl font-black text-slate-800 tracking-tight leading-tight">
                {courseToEdit ? 'Scholingsgegevens Aanpassen' : 'Nieuwe Scholing Toevoegen'}
              </h2>
              <p className="text-xs text-slate-500 font-bold uppercase tracking-wider">
                {courseToEdit ? `ID: ${courseToEdit.id}` : 'Beheerderspaneel'}
              </p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-slate-100 rounded-full transition-colors group">
            <X className="w-6 h-6 text-slate-400 group-hover:text-red-500" />
          </button>
        </div>

        {/* Scrollable Form */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 md:p-8 space-y-8 bg-slate-50">
          
          <div className="space-y-6">
            <div>
              <label className={labelClasses}>Titel van de scholing</label>
              <input 
                required
                type="text" 
                className={inputClasses}
                placeholder="Bijv. Jaarlijkse Vakdag Bewegingsonderwijs"
                value={formData.title || ''}
                onChange={e => setFormData({...formData, title: e.target.value})}
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className={labelClasses}>Organisator</label>
                <select 
                  className={inputClasses}
                  value={formData.organizer}
                  onChange={e => setFormData({...formData, organizer: e.target.value as Organizer})}
                >
                  <option value={Organizer.KVLO}>KVLO</option>
                  <option value={Organizer.ALO}>ALO Nederland</option>
                  <option value={Organizer.JOINT}>Gezamenlijk</option>
                </select>
              </div>
              <div>
                <label className={labelClasses}>Datum</label>
                <input 
                  required
                  type="date" 
                  className={inputClasses}
                  value={formData.date || ''}
                  onChange={e => setFormData({...formData, date: e.target.value})}
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className={labelClasses}>Locatie / Stad</label>
                <input 
                  type="text" 
                  className={inputClasses}
                  placeholder="Bijv. Utrecht (Online mag ook)"
                  value={formData.location || ''}
                  onChange={e => setFormData({...formData, location: e.target.value})}
                />
              </div>
              <div>
                <label className={labelClasses}>Regio</label>
                <select 
                  className={inputClasses}
                  value={formData.region}
                  onChange={e => setFormData({...formData, region: e.target.value})}
                >
                  {REGIONS.map(r => <option key={r} value={r}>{r}</option>)}
                </select>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className={labelClasses}>Prijs (€)</label>
                <div className="relative">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 font-bold text-slate-400">€</span>
                  <input 
                    type="number" 
                    className={`${inputClasses} pl-8`}
                    placeholder="0"
                    value={formData.price}
                    onChange={e => setFormData({...formData, price: Number(e.target.value)})}
                  />
                </div>
              </div>
              <div>
                <label className={labelClasses}>Aanmeldlink (URL)</label>
                <div className="relative">
                  <LinkIcon className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <input 
                    type="url" 
                    className={`${inputClasses} pl-10`}
                    placeholder="https://www.kvlo.nl/inschrijven"
                    value={formData.url || ''}
                    onChange={e => setFormData({...formData, url: e.target.value})}
                  />
                </div>
              </div>
            </div>

            <div>
              <label className={labelClasses}>Omschrijving</label>
              <textarea 
                required
                rows={4}
                className={`${inputClasses} resize-none`}
                placeholder="Geef een korte toelichting op de inhoud van de scholing..."
                value={formData.description || ''}
                onChange={e => setFormData({...formData, description: e.target.value})}
              />
            </div>

            <div>
              <label className={labelClasses}>Afbeelding URL (Optioneel)</label>
              <input 
                type="text" 
                className={inputClasses}
                placeholder="Laat leeg voor een automatische afbeelding"
                value={formData.imageUrl || ''}
                onChange={e => setFormData({...formData, imageUrl: e.target.value})}
              />
            </div>

            <div>
              <label className={labelClasses}>Onderwerpen / Tags</label>
              <div className="flex gap-2 mb-3">
                <input 
                  type="text" 
                  className={inputClasses}
                  placeholder="Bijv. PO, BSM, MRT..."
                  value={tagInput}
                  onChange={e => setTagInput(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && handleAddTag(e)}
                />
                <button 
                  type="button"
                  onClick={handleAddTag}
                  className="bg-slate-200 hover:bg-slate-300 text-slate-700 font-bold px-6 rounded-xl transition-colors border border-slate-300"
                >
                  Voeg toe
                </button>
              </div>
              <div className="flex flex-wrap gap-2">
                {formData.tags?.map((tag, idx) => (
                  <span key={idx} className="flex items-center gap-1.5 px-3 py-1.5 bg-white border-2 border-slate-200 text-slate-700 rounded-lg text-xs font-bold shadow-sm">
                    <TagIcon className="w-3 h-3 text-[#7AB800]" />
                    {tag}
                    <button 
                      type="button" 
                      onClick={() => setFormData(prev => ({ ...prev, tags: prev.tags?.filter((_, i) => i !== idx) }))}
                      className="ml-1 hover:text-red-500"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </span>
                ))}
              </div>
            </div>
          </div>
        </form>

        {/* Footer */}
        <div className="p-6 bg-white border-t border-slate-200 flex flex-col sm:flex-row justify-between items-center gap-4 shrink-0">
          {courseToEdit && onDelete && (
            <button 
              type="button"
              onClick={() => onDelete(courseToEdit.id)}
              className="w-full sm:w-auto flex items-center justify-center gap-2 px-6 py-3 text-red-600 font-bold hover:bg-red-50 rounded-xl transition-colors order-2 sm:order-1"
            >
              <Trash2 className="w-4 h-4" /> Scholing Verwijderen
            </button>
          )}
          
          <div className="flex gap-3 w-full sm:w-auto sm:ml-auto order-1 sm:order-2">
            <button 
              type="button"
              onClick={onClose}
              className="flex-1 sm:flex-none px-8 py-3 bg-white border-2 border-slate-200 text-slate-600 font-bold rounded-xl hover:bg-slate-50 transition-colors shadow-sm"
            >
              Annuleren
            </button>
            <button 
              type="submit"
              onClick={handleSubmit}
              className="flex-1 sm:flex-none px-10 py-3 bg-gradient-to-r from-[#7AB800] to-[#00C1D4] text-white font-black rounded-xl hover:shadow-lg hover:shadow-[#00C1D4]/20 transition-all uppercase tracking-widest text-sm"
            >
              Opslaan
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};