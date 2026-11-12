import React, { useState } from 'react';
import { Download, Smartphone, X } from 'lucide-react';
import { usePWAInstall } from '../../hooks/usePWAInstall';

export const PWAInstallButton: React.FC<{ variant?: 'compact' | 'full' }> = ({ variant = 'compact' }) => {
  const { isInstallable, isInstalled, isIOS, install } = usePWAInstall();
  const [showIOSGuide, setShowIOSGuide] = useState(false);

  // If already running as an installed standalone PWA, hide the button
  if (isInstalled) {
    return null;
  }

  // Chromium / Android / Desktop flow
  if (isInstallable) {
    return (
      <button
        onClick={install}
        className={`min-h-[44px] flex items-center gap-2 rounded-lg bg-[#163A5F] text-white hover:bg-[#1E4B7A] transition-colors font-bold text-xs shadow-xs cursor-pointer ${
          variant === 'full' ? 'w-full justify-center px-4 py-2.5' : 'px-3 py-2'
        }`}
        title="Install InfraSync as a standalone offline PWA"
        aria-label="Install InfraSync Progressive Web Application"
      >
        <Download className="w-4 h-4" />
        <span>Install App</span>
      </button>
    );
  }

  // iOS Safari flow
  if (isIOS) {
    return (
      <>
        <button
          onClick={() => setShowIOSGuide(true)}
          className={`min-h-[44px] flex items-center gap-2 rounded-lg border border-slate-300 bg-white text-slate-800 hover:bg-slate-50 transition-colors font-bold text-xs cursor-pointer ${
            variant === 'full' ? 'w-full justify-center px-4 py-2.5' : 'px-3 py-2'
          }`}
          aria-label="Install InfraSync on iOS Safari"
        >
          <Smartphone className="w-4 h-4 text-blue-700" />
          <span>Install on iOS</span>
        </button>

        {showIOSGuide && (
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="ios-guide-title"
            className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4"
          >
            <div className="w-full max-w-sm rounded-2xl bg-white p-6 shadow-2xl border border-slate-200">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                <h2 id="ios-guide-title" className="text-sm font-bold text-slate-900">
                  Install on iPhone / iPad
                </h2>
                <button
                  onClick={() => setShowIOSGuide(false)}
                  className="min-h-[44px] min-w-[44px] flex items-center justify-center text-slate-500 hover:text-slate-800 p-1"
                  aria-label="Close guide"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
              <p className="mt-3 text-xs text-slate-700 leading-relaxed font-medium">
                1. Tap the <strong>Share</strong> button in the Safari toolbar at the bottom.<br />
                2. Scroll down and tap <strong>Add to Home Screen</strong>.<br />
                3. Open InfraSync from your home screen for full offline functionality.
              </p>
              <button
                onClick={() => setShowIOSGuide(false)}
                className="min-h-[44px] mt-5 w-full rounded-lg bg-[#163A5F] py-2.5 text-xs font-bold text-white hover:bg-[#1E4B7A] transition-colors cursor-pointer"
              >
                Understood
              </button>
            </div>
          </div>
        )}
      </>
    );
  }

  return null;
};
