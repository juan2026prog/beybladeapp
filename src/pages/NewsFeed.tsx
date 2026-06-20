import React, { useEffect, useState } from 'react';
import { Newspaper, Calendar, Sparkles } from 'lucide-react';
import { DbService } from '../services/dbService';
import type { NewsItem } from '../services/dbService';

export const NewsFeed: React.FC = () => {
  const [news, setNews] = useState<NewsItem[]>([]);
  const [activeFilter, setActiveFilter] = useState<'all' | 'UY'>('all');

  useEffect(() => {
    const fetchNews = async () => {
      const list = await DbService.getNews();
      setNews(list);
    };
    fetchNews();
  }, []);

  const filteredNews = activeFilter === 'all'
    ? news
    : news.filter(n => n.country_id === 'UY');

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="border-b border-white/5 pb-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="space-y-1">
          <h1 className="text-2xl font-black text-white uppercase tracking-wide flex items-center gap-2">
            <Newspaper className="h-6 w-6 text-beyblade-electricCyan" /> Noticias y Lanzamientos
          </h1>
          <p className="text-xs text-gray-400">Mantente al día con los comunicados oficiales, lanzamientos de Hasbro y eventos especiales.</p>
        </div>

        {/* Filters */}
        <div className="flex bg-beyblade-card p-1 rounded-xl border border-white/5 self-start">
          <button
            onClick={() => setActiveFilter('all')}
            className={`px-4 py-2 rounded-lg font-bold text-xs uppercase transition-colors ${
              activeFilter === 'all' 
                ? 'bg-beyblade-electricCyan text-beyblade-darker' 
                : 'text-gray-400 hover:text-white'
            }`}
          >
            Todas las Novedades
          </button>
          <button
            onClick={() => setActiveFilter('UY')}
            className={`px-4 py-2 rounded-lg font-bold text-xs uppercase transition-colors ${
              activeFilter === 'UY' 
                ? 'bg-beyblade-electricCyan text-beyblade-darker' 
                : 'text-gray-400 hover:text-white'
            }`}
          >
            Solo Uruguay
          </button>
        </div>
      </div>

      {/* Hero news feature (Main announcement) */}
      {filteredNews.length > 0 && (
        <section className="bg-gradient-to-br from-beyblade-card to-beyblade-dark border border-white/5 rounded-3xl p-6 md:p-8 flex flex-col lg:flex-row items-center gap-6">
          <div className="flex-1 space-y-4">
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-bold text-beyblade-electricCyan bg-beyblade-electricCyan/10 border border-beyblade-electricCyan/20 px-2.5 py-0.5 rounded-full uppercase">
                {filteredNews[0].country_id ? `${filteredNews[0].country_id} oficial` : 'Global'}
              </span>
              <span className="text-[10px] text-gray-500 font-semibold flex items-center gap-1">
                <Calendar className="h-3 w-3" /> {new Date(filteredNews[0].created_at).toLocaleDateString()}
              </span>
            </div>
            <h2 className="text-2xl md:text-3xl font-black text-white leading-tight uppercase">
              {filteredNews[0].title}
            </h2>
            <p className="text-xs text-gray-300 leading-relaxed">
              {filteredNews[0].content}
            </p>
          </div>
          {/* Simulated visual thumbnail */}
          <div className="w-full lg:w-80 h-44 bg-beyblade-darker/60 rounded-2xl border border-white/5 flex items-center justify-center relative overflow-hidden shrink-0">
            <Sparkles className="h-8 w-8 text-beyblade-electricCyan opacity-30" />
            <div className="absolute inset-0 bg-gradient-to-tr from-beyblade-electricCyan/5 to-beyblade-electricRed/5"></div>
          </div>
        </section>
      )}

      {/* Secondary news grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {filteredNews.slice(1).map(n => (
          <div 
            key={n.id}
            className="bg-beyblade-card border border-white/5 rounded-3xl p-6 space-y-4 flex flex-col justify-between"
          >
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-bold text-beyblade-electricCyan bg-beyblade-electricCyan/10 border border-beyblade-electricCyan/20 px-2 py-0.5 rounded-full uppercase">
                  {n.country_id ? `${n.country_id} oficial` : 'Global'}
                </span>
                <span className="text-[10px] text-gray-500 font-semibold flex items-center gap-1">
                  <Calendar className="h-3 w-3" /> {new Date(n.created_at).toLocaleDateString()}
                </span>
              </div>
              <h3 className="font-extrabold text-white text-base leading-tight">{n.title}</h3>
              <p className="text-xs text-gray-400 leading-relaxed line-clamp-4">{n.content}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
