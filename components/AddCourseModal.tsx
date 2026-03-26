import React, { useState, useEffect } from 'react';
import { Course, ORGANIZERS } from '../types';
import { REGIONS, DEFAULT_IMAGES } from '../constants';
import { X, Link as LinkIcon, Trash2, Plus, Info, Tag as TagIcon, Wand2 } from 'lucide-react';
import { suggestImage, extractCourseFromUrl } from '../services/geminiService';

interface AddCourseModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (course: Course) => Promise<void> | void;
  onDelete?: (id: string) => void;
  courseToEdit?: Course;
}

export const AddCourseModal: React.FC<AddCourseModalProps> = ({ isOpen, onClose, onSave, onDelete, courseToEdit }) => {
  const [formData, setFormData] = useState<Partial<Course>>({
    organizers: [],
    region: 'Landelijk',
    price: 0,
    tags: [],
    url: ''
  });
  const [tagInput, setTagInput] = useState('');
  const [priceInput, setPriceInput] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [isExtractingUrl, setIsExtractingUrl] = useState(false);
  const [customOrganizer, setCustomOrganizer] = useState('');
  const [showCustomOrganizer, setShowCustomOrganizer] = useState(false);

  useEffect(() => {
    if (isOpen) {
      if (courseToEdit) {
        setFormData({ ...courseToEdit });
        setPriceInput(courseToEdit.price === 0 ? '' : courseToEdit.price.toString().replace('.', ','));
        
        // Check if there's any custom organizer
        const hasCustom = courseToEdit.organizers?.some(org => !ORGANIZERS.includes(org));
        if (hasCustom) {
          setShowCustomOrganizer(true);
          const customOrg = courseToEdit.organizers?.find(org => !ORGANIZERS.includes(org));
          if (customOrg) setCustomOrganizer(customOrg);
        } else {
          setShowCustomOrganizer(false);
          setCustomOrganizer('');
        }
      } else {
        setFormData({
          organizers: [],
          region: 'Landelijk',
          price: 0,
          tags: [],
          url: '',
          date: new Date().toISOString().split('T')[0],
          sessions: 1
        });
        setPriceInput('');
        setShowCustomOrganizer(false);
        setCustomOrganizer('');
      }
    }
  }, [isOpen, courseToEdit]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.title || !formData.description) return;

    setIsSaving(true);
    const id = courseToEdit?.id || (typeof crypto !== 'undefined' && crypto.randomUUID ? crypto.randomUUID() : Date.now().toString());
    
    let finalImageUrl = formData.imageUrl;
    
    if (!finalImageUrl || finalImageUrl.trim() === '') {
      if (formData.url && formData.url !== '#' && formData.url.startsWith('http')) {
        try {
          const res = await fetch(`https://api.microlink.io/?url=${encodeURIComponent(formData.url)}`);
          const json = await res.json();
          if (json.status === 'success' && json.data?.image?.url) {
            finalImageUrl = json.data.image.url;
          }
        } catch (err) {
          console.error("Kon geen afbeelding van de URL ophalen:", err);
        }
      }
      
      if (!finalImageUrl || finalImageUrl.trim() === '') {
        try {
          finalImageUrl = await suggestImage(formData.title || '', formData.description || '', DEFAULT_IMAGES);
        } catch (err) {
          finalImageUrl = DEFAULT_IMAGES[Math.floor(Math.random() * DEFAULT_IMAGES.length)];
        }
      }
    }

    // Combine selected organizers with custom organizer if applicable
    let finalOrganizers = [...(formData.organizers || [])].filter(org => ORGANIZERS.includes(org));
    if (showCustomOrganizer && customOrganizer.trim()) {
      finalOrganizers.push(customOrganizer.trim());
    }

    // Check for specific ALOs and add 'ALO Nederland'
    const aloInstitutes = ['HAN', 'Fontys', 'HHS', 'HvA', 'Windesheim', 'Hanze'];
    const hasAloInstitute = finalOrganizers.some(org => aloInstitutes.includes(org));
    if (hasAloInstitute && !finalOrganizers.includes('ALO Nederland')) {
      finalOrganizers.push('ALO Nederland');
    }

    // Remove duplicates
    finalOrganizers = [...new Set(finalOrganizers)];

    const savedCourse: Course = {
      id,
      title: formData.title,
      organizers: finalOrganizers,
      date: formData.date,
      location: formData.location || 'Onbekend',
      region: formData.region || 'Landelijk',
      price: Number(formData.price) || 0,
      sessions: formData.sessions ? Number(formData.sessions) : undefined,
      description: formData.description,
      tags: formData.tags || [],
      url: formData.url && formData.url.length > 0 ? formData.url : '#',
      imageUrl: finalImageUrl,
      isNew: courseToEdit ? courseToEdit.isNew : true
    };

    try {
      await onSave(savedCourse);
      onClose();
    } catch (e) {
      // Error is handled by parent component
    } finally {
      setIsSaving(false);
    }
  };

  const handleAddTag = (e: React.MouseEvent | React.KeyboardEvent) => {
    e.preventDefault();
    if (tagInput.trim()) {
      const newTags = tagInput.split(',').map(t => t.trim()).filter(t => t.length > 0);
      setFormData(prev => {
        const existingTags = prev.tags || [];
        const uniqueNewTags = newTags.filter(t => !existingTags.includes(t));
        return {
          ...prev,
          tags: [...existingTags, ...uniqueNewTags]
        };
      });
      setTagInput('');
    }
  };

  const handleAutoFillFromUrl = async () => {
    if (!formData.url || !formData.url.startsWith('http')) {
      alert('Vul eerst een geldige URL in (beginnend met http:// of https://).');
      return;
    }
    
    setIsExtractingUrl(true);
    try {
      const extractedData = await extractCourseFromUrl(formData.url);
      if (extractedData) {
        // Automatically add 'ALO Nederland' if an ALO institution is found
        if (extractedData.organizers) {
          const aloInstitutions = ['HAN', 'Fontys', 'HHS', 'HvA', 'Windesheim', 'Hanze'];
          const hasAloInstitution = extractedData.organizers.some(org => aloInstitutions.includes(org));
          if (hasAloInstitution && !extractedData.organizers.includes('ALO Nederland')) {
            extractedData.organizers.push('ALO Nederland');
          }
        }

        setFormData(prev => {
          const newData = { ...prev, ...extractedData, url: prev.url };
          
          // Handle custom organizers from AI suggestion
          if (extractedData.organizers) {
            const hasCustom = extractedData.organizers.some(org => !ORGANIZERS.includes(org));
            if (hasCustom) {
              setShowCustomOrganizer(true);
              const customOrg = extractedData.organizers.find(org => !ORGANIZERS.includes(org));
              if (customOrg) setCustomOrganizer(customOrg);
            }
          }
          
          return newData;
        });
        
        if (extractedData.price !== undefined) {
          setPriceInput(extractedData.price.toString().replace('.', ','));
        }
      } else {
        alert('Kon geen gegevens extraheren van deze URL. Controleer of de URL toegankelijk is.');
      }
    } catch (error) {
      console.error('Fout bij automatisch invullen:', error);
      alert('Er is een fout opgetreden bij het automatisch invullen.');
    } finally {
      setIsExtractingUrl(false);
    }
  };

  const toggleOrganizer = (org: string) => {
    setFormData(prev => {
      const current = prev.organizers || [];
      if (current.includes(org)) {
        return { ...prev, organizers: current.filter(o => o !== org) };
      } else {
        const newOrganizers = [...current, org];
        const aloInstitutions = ['HAN', 'Fontys', 'HHS', 'HvA', 'Windesheim', 'Hanze'];
        if (aloInstitutions.includes(org) && !newOrganizers.includes('ALO Nederland')) {
          newOrganizers.push('ALO Nederland');
        }
        return { ...prev, organizers: newOrganizers };
      }
    });
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
            
            {/* URL Field at the top */}
            <div className="md:col-span-2">
              <label className={labelClasses}>Informatie / aanmelding (URL)</label>
              <div className="flex gap-2">
                <div className="relative flex-1">
                  <LinkIcon className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <input 
                    type="url" 
                    className={`${inputClasses} pl-10`}
                    placeholder="https://www.kvlo.nl/inschrijven"
                    value={formData.url || ''}
                    onChange={e => setFormData({...formData, url: e.target.value})}
                  />
                </div>
                <button
                  type="button"
                  onClick={handleAutoFillFromUrl}
                  disabled={isExtractingUrl || !formData.url}
                  className="flex items-center gap-2 px-4 py-3 bg-indigo-50 text-indigo-600 font-bold rounded-xl hover:bg-indigo-100 transition-colors disabled:opacity-50 disabled:cursor-not-allowed border border-indigo-100"
                >
                  {isExtractingUrl ? (
                    <div className="w-5 h-5 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin" />
                  ) : (
                    <Wand2 className="w-5 h-5" />
                  )}
                  <span className="hidden sm:inline">Automatisch invullen</span>
                </button>
              </div>
              <p className="text-xs text-slate-500 mt-2">
                Vul een URL in en klik op "Automatisch invullen" om de rest van het formulier (titel, datum, prijs, tags, etc.) automatisch in te vullen via AI.
              </p>
            </div>

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

            <div>
              <label className={labelClasses}>Organisator(en)</label>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 bg-white p-4 rounded-xl border-2 border-slate-300">
                {ORGANIZERS.map(org => (
                  <label key={org} className="flex items-center gap-2 cursor-pointer group">
                    <div className="relative flex items-center justify-center w-5 h-5">
                      <input
                        type="checkbox"
                        className="peer appearance-none w-5 h-5 border-2 border-slate-300 rounded focus:ring-2 focus:ring-[#7AB800]/20 checked:bg-[#7AB800] checked:border-[#7AB800] transition-all cursor-pointer"
                        checked={(formData.organizers || []).includes(org)}
                        onChange={() => toggleOrganizer(org)}
                      />
                      <svg className="absolute w-3 h-3 text-white opacity-0 peer-checked:opacity-100 pointer-events-none" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="3">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                      </svg>
                    </div>
                    <span className="text-sm font-semibold text-slate-700 group-hover:text-slate-900">{org}</span>
                  </label>
                ))}
                <label className="flex items-center gap-2 cursor-pointer group">
                  <div className="relative flex items-center justify-center w-5 h-5">
                    <input
                      type="checkbox"
                      className="peer appearance-none w-5 h-5 border-2 border-slate-300 rounded focus:ring-2 focus:ring-[#7AB800]/20 checked:bg-[#7AB800] checked:border-[#7AB800] transition-all cursor-pointer"
                      checked={showCustomOrganizer}
                      onChange={(e) => setShowCustomOrganizer(e.target.checked)}
                    />
                    <svg className="absolute w-3 h-3 text-white opacity-0 peer-checked:opacity-100 pointer-events-none" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="3">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                    </svg>
                  </div>
                  <span className="text-sm font-semibold text-slate-700 group-hover:text-slate-900">Overig</span>
                </label>
              </div>
              {showCustomOrganizer && (
                <div className="mt-3">
                  <input
                    type="text"
                    className={inputClasses}
                    placeholder="Vul andere organisator in..."
                    value={customOrganizer}
                    onChange={(e) => setCustomOrganizer(e.target.value)}
                    required={showCustomOrganizer}
                  />
                </div>
              )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className={labelClasses}>Datum (optioneel)</label>
                <input 
                  type="date" 
                  className={inputClasses}
                  value={formData.date || ''}
                  onChange={e => setFormData({...formData, date: e.target.value})}
                />
              </div>
              <div>
                <label className={labelClasses}>Aantal bijeenkomsten</label>
                <input 
                  type="number" 
                  min="1"
                  step="1"
                  className={inputClasses}
                  placeholder="Bijv. 1"
                  value={formData.sessions || ''}
                  onChange={e => setFormData({...formData, sessions: e.target.value ? Number(e.target.value) : undefined})}
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
                    type="text" 
                    className={`${inputClasses} pl-8`}
                    placeholder="0,00"
                    value={priceInput}
                    onChange={e => {
                      const val = e.target.value;
                      if (/^[0-9]*,?[0-9]*$/.test(val)) {
                        setPriceInput(val);
                        const num = parseFloat(val.replace(',', '.'));
                        setFormData({...formData, price: isNaN(num) ? 0 : num});
                      }
                    }}
                    onBlur={() => {
                      const num = parseFloat(priceInput.replace(',', '.'));
                      if (!isNaN(num) && num !== 0) {
                        setPriceInput(num % 1 === 0 ? num.toString() : num.toFixed(2).replace('.', ','));
                      } else {
                        setPriceInput('');
                      }
                    }}
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
                placeholder="Laat leeg om automatisch een afbeelding van de website te halen"
                value={formData.imageUrl || ''}
                onChange={e => setFormData({...formData, imageUrl: e.target.value})}
              />
              <p className="text-xs text-slate-500 mt-2 ml-1">
                Tip: Maak dit veld leeg bij een bestaande scholing en sla op om automatisch een nieuwe afbeelding te genereren op basis van de aanmeldlink.
              </p>
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
              disabled={isSaving}
              className="flex-1 sm:flex-none px-8 py-3 bg-white border-2 border-slate-200 text-slate-600 font-bold rounded-xl hover:bg-slate-50 transition-colors shadow-sm disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Annuleren
            </button>
            <button 
              type="submit"
              onClick={handleSubmit}
              disabled={isSaving}
              className="flex-1 sm:flex-none px-10 py-3 bg-gradient-to-r from-[#7AB800] to-[#00C1D4] text-white font-black rounded-xl hover:shadow-lg hover:shadow-[#00C1D4]/20 transition-all uppercase tracking-widest text-sm disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {isSaving ? (
                <>
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Opslaan...
                </>
              ) : (
                'Opslaan'
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};