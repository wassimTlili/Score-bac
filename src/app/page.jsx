'use client';
import React, { useState } from 'react';
import { Landing } from '../components/Landing';
import { TrackSelection } from '../components/TrackSelection';
import { GradeForm } from '../components/GradeForm';
import { Results } from '../components/Results';
import { AppProvider } from '../context/AppContext';

// Bac type mapping: track.id => Arabic Bac type string
const bacTypeMap = {
  math: "رياضيات",
  science: "علوم تجريبية",
  info: "علوم إعلامية",
  tech: "تقنية",
  eco: "إقتصاد وتصرف",
  lettres: "آداب",
  sport: "رياضة"
};

export default function Home() {
  const [step, setStep] = useState(1);
  const [selectedTrack, setSelectedTrack] = useState(null);

  const nextStep = () => setStep(step + 1);
  const prevStep = () => setStep(step - 1);
  const goToStep = (stepNumber) => setStep(stepNumber);

  return (
    <AppProvider>
      <div className="min-h-screen bg-[#111827] text-[#e5e7eb] font-sans">
        <div className="container mx-auto px-4 py-8 max-w-4xl">
          {step === 1 && <Landing onContinue={nextStep} />}
          {step === 2 && (
            <TrackSelection
              onSelect={(track) => {
                setSelectedTrack(track);
                nextStep();
              }}
            />
          )}
          {step === 3 && selectedTrack && (
            <GradeForm
              track={selectedTrack}
              onSubmit={nextStep}
              onBack={prevStep}
            />
          )}
          {step === 4 && selectedTrack && (
            <Results
              track={selectedTrack}
              userBacType={bacTypeMap[selectedTrack.id]}
              onReset={() => goToStep(1)}
              onBack={prevStep}
            />
          )}
        </div>
      </div>
    </AppProvider>
  );
}