import React, { useEffect, useState } from 'react';
import { BookOpen, Film, ChevronDown, ChevronUp } from 'lucide-react';
import { DbService } from '../services/dbService';
import type { TutorialItem } from '../services/dbService';

export const Academy: React.FC = () => {
  const [tutorials, setTutorials] = useState<TutorialItem[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>('Todos');
  const [expandedTutorialId, setExpandedTutorialId] = useState<number | null>(null);

  useEffect(() => {
    const fetchTutorials = async () => {
      const list = await DbService.getTutorials();
      setTutorials(list);
    };
    fetchTutorials();
  }, []);

  const categories = ['Todos', 'Cómo Jugar', 'Reglas Oficiales', 'Estrategias', 'Guías de Lanzamiento'];

  const filteredTutorials = selectedCategory === 'Todos'
    ? tutorials
    : tutorials.filter(t => t.category === selectedCategory);

  const toggleExpand = (id: number) => {
    if (expandedTutorialId === id) {
      setExpandedTutorialId(null);
    } else {
      setExpandedTutorialId(id);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="border-b border-white/5 pb-4 space-y-1">
        <h1 className="text-2xl font-black text-white uppercase tracking-wide flex items-center gap-2">
          <BookOpen className="h-6 w-6 text-beyblade-electricCyan" /> Academia Beyblade
        </h1>
        <p className="text-xs text-gray-400">Aprende técnicas oficiales de lanzamiento, reglamentos de competición oficial y armado de piezas de Beyblade X.</p>
      </div>

      {/* Category selector */}
      <div className="flex flex-wrap gap-2">
        {categories.map(cat => (
          <button
            key={cat}
            onClick={() => setSelectedCategory(cat)}
            className={`px-4 py-2 rounded-xl font-bold text-xs uppercase transition-colors ${
              selectedCategory === cat
                ? 'bg-beyblade-electricCyan text-beyblade-darker'
                : 'bg-beyblade-card text-gray-400 hover:text-white border border-white/5'
            }`}
          >
            {cat}
          </button>
        ))}
      </div>

      {/* Tutorials list */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {filteredTutorials.map(t => {
          const isExpanded = expandedTutorialId === t.id;
          return (
            <div 
              key={t.id}
              className={`bg-beyblade-card border rounded-3xl p-5 md:p-6 transition-all duration-300 flex flex-col justify-between ${
                isExpanded ? 'border-beyblade-electricCyan/40 shadow-neon-cyan/5' : 'border-white/5'
              }`}
            >
              <div className="space-y-4">
                <div className="flex justify-between items-start">
                  <span className="text-[9px] font-bold text-beyblade-electricCyan bg-beyblade-electricCyan/10 border border-beyblade-electricCyan/20 px-2.5 py-0.5 rounded-full uppercase">
                    {t.category}
                  </span>
                  <span className="text-[9px] font-bold text-gray-500 uppercase bg-white/5 px-2 py-0.5 rounded">
                    Edad Mínima: {t.min_age} años
                  </span>
                </div>

                <div className="space-y-2">
                  <h3 className="text-lg font-extrabold text-white leading-tight">{t.title}</h3>
                  <p className={`text-xs text-gray-400 leading-relaxed ${isExpanded ? '' : 'line-clamp-3'}`}>
                    {t.content}
                  </p>
                </div>

                {/* Video Embed Section if expanded */}
                {isExpanded && t.video_url && (
                  <div className="space-y-3 pt-2 animate-slide-in">
                    <div className="aspect-video w-full rounded-2xl overflow-hidden border border-white/10 bg-black/40 relative">
                      {/* Fake Video Player for immediate review without connection blocks */}
                      <iframe 
                        title={t.title}
                        src={t.video_url}
                        className="w-full h-full border-0"
                        allowFullScreen
                      />
                    </div>
                    <div className="p-3 bg-beyblade-dark rounded-xl border border-white/5 text-[11px] text-gray-400 flex items-center gap-2">
                      <Film className="h-4 w-4 text-beyblade-electricCyan shrink-0" />
                      <span>Video oficial de instrucción avalado por los jueces de Beyblade Uruguay.</span>
                    </div>
                  </div>
                )}
              </div>

              {/* Expand Toggle Trigger */}
              <button
                onClick={() => toggleExpand(t.id)}
                className="mt-6 flex items-center justify-center gap-1.5 w-full py-2 bg-white/5 hover:bg-white/10 text-white text-xs font-bold rounded-xl border border-white/5 transition-all"
              >
                {isExpanded ? (
                  <>
                    Cerrar Guía <ChevronUp className="h-4 w-4" />
                  </>
                ) : (
                  <>
                    Abrir Guía Completa <ChevronDown className="h-4 w-4" />
                  </>
                )}
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
};
