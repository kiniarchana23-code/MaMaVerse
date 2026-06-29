'use client';

import React from 'react';
import { AlertTriangle } from 'lucide-react';

export function MedicalDisclaimer() {
  return (
    <div className="bg-gradient-to-r from-amber-600 to-rose-600 text-white text-xs md:text-sm py-2 px-4 text-center font-medium shadow-md flex items-center justify-center gap-2 relative z-50">
      <AlertTriangle className="w-4 h-4 shrink-0 animate-pulse" />
      <span>
        <strong>Medical Disclaimer:</strong> This platform is for educational and informational purposes only.
        It does not substitute professional medical advice, diagnosis, or treatment. Always consult your doctor.
      </span>
    </div>
  );
}
