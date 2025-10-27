import React from 'react';
import { X } from 'lucide-react';

interface InfoDialogProps {
  isOpen: boolean;
  onClose: () => void;
}

export const InfoDialog: React.FC<InfoDialogProps> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 animate-fade-in">
      <div className="glass rounded-2xl p-6 max-w-md w-full mx-4 shadow-strong animate-scale-in">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-bold text-lc-primary-700">Über KAYA</h2>
          <button onClick={onClose} className="btn-ghost" aria-label="Dialog schließen">
            <X className="size-5" />
          </button>
        </div>
        
        <div className="space-y-4 text-lc-neutral-700">
          <p className="leading-relaxed">
            KAYA ist Ihre digitale Assistentin für alle Anliegen rund um den Landkreis Oldenburg.
          </p>
          
          <div>
            <h3 className="font-semibold text-lc-primary-600 mb-2">Ich kann Ihnen helfen bei:</h3>
            <ul className="space-y-1.5 text-sm">
              <li className="flex items-center gap-2">
                <span className="text-lc-primary-500">✓</span> Bürgerservices und Anträge
              </li>
              <li className="flex items-center gap-2">
                <span className="text-lc-primary-500">✓</span> Terminbuchung
              </li>
              <li className="flex items-center gap-2">
                <span className="text-lc-primary-500">✓</span> KFZ-Zulassung
              </li>
              <li className="flex items-center gap-2">
                <span className="text-lc-primary-500">✓</span> Soziale Leistungen
              </li>
              <li className="flex items-center gap-2">
                <span className="text-lc-primary-500">✓</span> Kreistagsinformationen
              </li>
            </ul>
          </div>
          
          <div className="pt-4 border-t border-lc-primary-100">
            <p className="text-xs text-lc-neutral-600 italic">
              <strong>Hinweis:</strong> KAYA nutzt öffentliche Informationen des Landkreises Oldenburg. 
              Keine Rechtsberatung. Bei Notfällen wählen Sie bitte 112 oder 110.
            </p>
          </div>
        </div>
        
        <button onClick={onClose} className="btn-solid w-full mt-6">
          Verstanden
        </button>
      </div>
    </div>
  );
};


