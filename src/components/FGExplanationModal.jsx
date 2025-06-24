import React from 'react';
import { XIcon } from 'lucide-react';

export function FGExplanationModal({ onClose }) {
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-[#1f2937] rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-bold">
              Formule Globale (FG) - Explication
            </h2>
            <button onClick={onClose} className="text-gray-400 hover:text-white">
              <XIcon size={24} />
            </button>
          </div>
          <div className="space-y-4">
            <p>
              Le Score FG (Formule Globale) est utilisé pour déterminer l'admission dans les universités tunisiennes.
            </p>
            <div className="border-l-4 border-[#1581f3] pl-4 py-2">
              <p className="font-bold">FG = FB + FS</p>
              <p>Où:</p>
              <ul className="list-disc list-inside ml-4">
                <li>FB (Formule de Base) = 4 × Moyenne Générale</li>
                <li>FS (Formule Spécifique) varie selon la filière</li>
              </ul>
            </div>
            <p>
              La Moyenne Générale est calculée en tenant compte des notes et des coefficients de chaque matière:
            </p>
            <div className="bg-[#111827] p-3 rounded">
              <p className="font-mono">
                MG = Somme(Note × Coefficient) / Somme(Coefficient)
              </p>
            </div>
            <p>
              Plus votre Score FG est élevé, plus vous avez de chances d'être admis dans les filières universitaires de votre choix.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}