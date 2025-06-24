import React, { useState } from 'react';
import { ArrowLeftIcon, ArrowRightIcon } from 'lucide-react';
import { useAppContext } from '../context/AppContext';
import { trackData, calculateFG } from '../utils/calculations';

export function GradeForm({ track, onSubmit, onBack }) {
  const { grades, setGrades, setResults } = useAppContext();
  const [errors, setErrors] = useState({});
  const subjects = trackData[track.id].subjects;

  const handleChange = (subject, value) => {
    const numValue = parseFloat(value);
    if (numValue >= 0 && numValue <= 20) {
      const newErrors = { ...errors };
      delete newErrors[subject];
      setErrors(newErrors);
    } else if (value !== '') {
      setErrors({ ...errors, [subject]: 'Note doit être entre 0 et 20' });
    }
    setGrades({
      ...grades,
      [subject]: numValue || 0,
    });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const hasAllValues = Object.keys(subjects).every(
      (subject) => grades[subject] !== undefined && grades[subject] !== null
    );
    if (hasAllValues && Object.keys(errors).length === 0) {
      const results = calculateFG(grades, track);
      setResults(results);
      onSubmit();
    } else {
      const newErrors = { ...errors };
      Object.keys(subjects).forEach((subject) => {
        if (grades[subject] === undefined || grades[subject] === null) {
          newErrors[subject] = 'Champ obligatoire';
        }
      });
      setErrors(newErrors);
    }
  };

  return (
    <div className="py-6">
      <button onClick={onBack} className="flex items-center text-[#e5e7eb] hover:text-white mb-6">
        <ArrowLeftIcon size={20} className="mr-2" />
        Retour
      </button>
      <h2 className="text-2xl font-bold mb-6">
        Entrez vos notes - {track.name}
      </h2>
      <form onSubmit={handleSubmit} className="bg-[#1f2937] rounded-lg p-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {Object.entries(subjects).map(([subjectId, subject]) => (
            <div key={subjectId} className="space-y-2">
              <label className="block font-medium">
                {subject.name} (Coef. {subject.coef})
              </label>
              <div>
                <input
                  type="number"
                  min="0"
                  max="20"
                  step="0.25"
                  value={grades[subjectId] || ''}
                  onChange={(e) => handleChange(subjectId, e.target.value)}
                  className={`w-full px-4 py-2 rounded bg-[#111827] border ${
                    errors[subjectId] ? 'border-[#ef4444]' : 'border-gray-600'
                  }`}
                  placeholder="0 - 20"
                />
                {errors[subjectId] && (
                  <p className="text-[#ef4444] text-sm mt-1">
                    {errors[subjectId]}
                  </p>
                )}
              </div>
            </div>
          ))}
        </div>
        <div className="mt-8 flex justify-end">
          <button
            type="submit"
            className="bg-[#1581f3] hover:bg-blue-600 text-white font-bold py-2 px-6 rounded-lg flex items-center"
          >
            Calculer mon Score FG
            <ArrowRightIcon size={20} className="ml-2" />
          </button>
        </div>
      </form>
    </div>
  );
}