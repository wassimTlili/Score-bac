import React from 'react';
import {
  CalculatorIcon,
  FlaskConicalIcon,
  MonitorIcon,
  WrenchIcon,
  BarChartIcon,
  BookOpenIcon,
  DumbbellIcon,
} from 'lucide-react';

const tracks = [
  { id: 'math', name: 'Mathématiques', icon: <CalculatorIcon size={32} /> },
  { id: 'science', name: 'Sciences Expérimentales', icon: <FlaskConicalIcon size={32} /> },
  { id: 'info', name: 'Science‑Informatique', icon: <MonitorIcon size={32} /> },
  { id: 'tech', name: 'Sciences Techniques', icon: <WrenchIcon size={32} /> },
  { id: 'eco', name: 'Économie‑Gestion', icon: <BarChartIcon size={32} /> },
  { id: 'lettres', name: 'Lettres', icon: <BookOpenIcon size={32} /> },
  { id: 'sport', name: 'Sport', icon: <DumbbellIcon size={32} /> },
];

export function TrackSelection({ onSelect }) {
  return (
    <div className="py-8">
      <h2 className="text-3xl font-bold text-center mb-8">
        Choisissez votre filière BAC
      </h2>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {tracks.map((track) => (
          <button
            key={track.id}
            onClick={() => onSelect(track)}
            className="bg-[#1f2937] hover:bg-[#2d3748] p-6 rounded-lg flex flex-col items-center transition-all hover:scale-105 hover:shadow-lg"
          >
            <div className="bg-[#1581f3] p-4 rounded-full mb-4">
              {track.icon}
            </div>
            <h3 className="text-xl font-semibold">{track.name}</h3>
          </button>
        ))}
      </div>
    </div>
  );
}