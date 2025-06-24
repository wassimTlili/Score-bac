import React, { useState } from 'react';
import { InfoIcon } from 'lucide-react';
import { FGExplanationModal } from './FGExplanationModal';

export function Landing({ onContinue }) {
  const [showModal, setShowModal] = useState(false);

  return (
    <div className="flex flex-col items-center justify-center min-h-[80vh] text-center">
      <h1 className="text-4xl md:text-5xl font-bold mb-6 text-white">
        Calculateur Score FG – BAC Tunisie
      </h1>
      <p className="text-xl mb-8 max-w-2xl">
        Calculez votre score pour l'admission universitaire en fonction de votre filière BAC
      </p>
      <button
        onClick={onContinue}
        className="bg-[#1581f3] hover:bg-blue-600 text-white font-bold py-3 px-8 rounded-lg text-lg transition-colors mb-8"
      >
        Commencer
      </button>
      <button
        onClick={() => setShowModal(true)}
        className="flex items-center text-[#e5e7eb] hover:text-white"
      >
        <InfoIcon className="mr-2" size={20} />
        Qu'est-ce que le Score FG?
      </button>
      {showModal && <FGExplanationModal onClose={() => setShowModal(false)} />}
    </div>
  );
}