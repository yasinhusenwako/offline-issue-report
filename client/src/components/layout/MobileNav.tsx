import React from 'react';
import { NavLink } from 'react-router-dom';
import { LayoutDashboard, FileText, PlusCircle, RefreshCw, X, Shield, Wrench } from 'lucide-react';
import { Sidebar } from './Sidebar';
import { useSyncQueue } from '../../hooks/useSyncQueue';
import { useAuth } from '../../contexts/AuthContext';

export const MobileNav: React.FC<{
  isOpen: boolean;
  onClose: () => void;
}> = ({ isOpen, onClose }) => {
  const { pendingCount } = useSyncQueue();
  const { role } = useAuth();

  return (
    <>
      {/* Slide-over backdrop & drawer */}
      {isOpen && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label="Navigation drawer"
          className="fixed inset-0 z-50 lg:hidden flex"
        >
          <div
            className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs transition-opacity duration-200"
            onClick={onClose}
            aria-hidden="true"
          />
          <div className="relative flex-1 flex flex-col max-w-xs w-full bg-[#163A5F] z-10 animate-in slide-in-from-left duration-200">
            <div className="absolute top-2 right-2">
              <button
                onClick={onClose}
                className="min-h-[44px] min-w-[44px] flex items-center justify-center p-2 text-slate-300 hover:text-white rounded-lg focus-visible:ring-2 focus-visible:ring-white"
                aria-label="Close menu"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <Sidebar onCloseMobile={onClose} />
          </div>
        </div>
      )}

      {/* Bottom Navigation Bar for rapid one-handed mobile field actions */}
      <nav
        aria-label="Mobile Navigation"
        className="lg:hidden fixed bottom-0 left-0 right-0 h-16 bg-white border-t border-slate-200 z-30 flex items-center justify-around px-2 shadow-lg"
      >
        <NavLink
          to="/"
          end
          className={({ isActive }) =>
            `min-h-[44px] min-w-[44px] flex flex-col items-center justify-center flex-1 py-1 text-[11px] font-bold transition-colors ${
              isActive ? 'text-blue-700' : 'text-slate-600 hover:text-slate-950'
            }`
          }
        >
          <LayoutDashboard className="w-5 h-5 mb-0.5" />
          <span>Dashboard</span>
        </NavLink>

        <NavLink
          to="/reports"
          className={({ isActive }) =>
            `min-h-[44px] min-w-[44px] flex flex-col items-center justify-center flex-1 py-1 text-[11px] font-bold transition-colors ${
              isActive ? 'text-blue-700' : 'text-slate-600 hover:text-slate-950'
            }`
          }
        >
          <FileText className="w-5 h-5 mb-0.5" />
          <span>Reports</span>
        </NavLink>

        {/* Prominent Center Create Button with 48px touch target */}
        <NavLink
          to="/reports/new"
          aria-label="Create new report"
          className="min-h-[44px] min-w-[44px] flex flex-col items-center justify-center flex-1 -mt-6"
        >
          <div className="w-12 h-12 rounded-full bg-[#163A5F] text-white flex items-center justify-center shadow-lg hover:bg-[#1E4B7A] transition-colors border-2 border-white focus-visible:ring-2 focus-visible:ring-blue-600">
            <PlusCircle className="w-6 h-6" />
          </div>
          <span className="text-[11px] font-bold text-slate-800 mt-1">New</span>
        </NavLink>

        <NavLink
          to="/sync"
          className={({ isActive }) =>
            `min-h-[44px] min-w-[44px] flex flex-col items-center justify-center flex-1 py-1 text-[11px] font-bold transition-colors relative ${
              isActive ? 'text-blue-700' : 'text-slate-600 hover:text-slate-950'
            }`
          }
        >
          <RefreshCw className="w-5 h-5 mb-0.5" />
          <span>Sync</span>
          {pendingCount > 0 && (
            <span className="absolute top-1 right-3 bg-amber-500 text-slate-950 text-[10px] font-extrabold px-1.5 py-0.2 rounded-full font-mono">
              {pendingCount}
            </span>
          )}
        </NavLink>

        {role === 'coordinator' ? (
          <NavLink
            to="/management"
            className={({ isActive }) =>
              `min-h-[44px] min-w-[44px] flex flex-col items-center justify-center flex-1 py-1 text-[11px] font-bold transition-colors ${
                isActive ? 'text-indigo-700' : 'text-slate-600 hover:text-slate-950'
              }`
            }
          >
            <Shield className="w-5 h-5 mb-0.5" />
            <span>Triage</span>
          </NavLink>
        ) : (
          <NavLink
            to="/activity"
            className={({ isActive }) =>
              `min-h-[44px] min-w-[44px] flex flex-col items-center justify-center flex-1 py-1 text-[11px] font-bold transition-colors ${
                isActive ? 'text-blue-700' : 'text-slate-600 hover:text-slate-950'
              }`
            }
          >
            <FileText className="w-5 h-5 mb-0.5" />
            <span>Activity</span>
          </NavLink>
        )}
      </nav>
    </>
  );
};
