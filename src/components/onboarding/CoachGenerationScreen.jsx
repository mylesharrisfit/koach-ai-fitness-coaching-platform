import React from 'react';
import AIGenerationScreen from './AIGenerationScreen';

export default function CoachGenerationScreen({ onNext }) {
  return <AIGenerationScreen onNext={onNext} role="coach" />;
}