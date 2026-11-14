import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Database,
  WifiOff,
  RefreshCw,
  AlertTriangle,
  ClipboardCheck,
  History,
  Shield,
  ArrowRight,
  CheckCircle,
  Menu,
  X,
  Layers,
  MapPin,
  Check,
  ChevronRight,
  Smartphone,
  HardHat,
  Cpu,
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';

export const LandingPage: React.FC = () => {
  const { user } = useAuth();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <div className="min-h-screen bg-[#F8FAFC] text-slate-900 selection:bg-blue-100 selection:text-blue-900 flex flex-col font-sans">
      {/* ─── STICKY NAVIGATION BAR ─────────────────────────────────────── */}
      <header className="sticky top-0 z-50 bg-white/95 backdrop-blur-md border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-20 flex items-center justify-between">
          {/* Brand Logo */}
          <Link to="/" className="flex items-center gap-3 group">
            <div className="w-10 h-10 rounded-xl bg-[#0E2271] flex items-center justify-center text-white shadow-md shadow-blue-900/10 group-hover:scale-105 transition-transform">
              <Database className="w-5 h-5 text-blue-200" />
            </div>
            <div>
              <span className="font-extrabold text-xl tracking-tight text-[#0E2271] block leading-none">
                InfraSync
              </span>
              <span className="text-[10px] text-slate-500 font-mono tracking-wider uppercase block mt-1 font-semibold">
                Field Mesh System
              </span>
            </div>
          </Link>

          {/* Desktop Navigation Links */}
          <nav className="hidden md:flex items-center gap-8 text-sm font-semibold text-slate-600">
            <a href="#features" className="hover:text-[#0E2271] transition-colors">
              Features
            </a>
            <a href="#how-it-works" className="hover:text-[#0E2271] transition-colors">
              How It Works
            </a>
            <a href="#benefits" className="hover:text-[#0E2271] transition-colors">
              System Benefits
            </a>
            <a href="#architecture" className="hover:text-[#0E2271] transition-colors">
              Architecture
            </a>
          </nav>

          {/* Action CTAs */}
          <div className="hidden sm:flex items-center gap-3">
            {user ? (
              <Link
                to="/dashboard"
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold text-white bg-[#0E2271] hover:bg-[#1A3580] transition-all shadow-sm shadow-blue-900/10"
              >
                <span>Enter Portal</span>
                <ArrowRight className="w-4 h-4" />
              </Link>
            ) : (
              <>
                <Link
                  to="/login"
                  className="px-4 py-2.5 rounded-xl text-sm font-semibold text-slate-700 hover:text-slate-900 hover:bg-slate-100 transition-colors"
                >
                  Sign In
                </Link>
                <Link
                  to="/register"
                  className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold text-white bg-[#0E2271] hover:bg-[#1A3580] transition-all shadow-sm shadow-blue-900/10"
                >
                  <span>Get Started</span>
                  <ArrowRight className="w-4 h-4" />
                </Link>
              </>
            )}
          </div>

          {/* Mobile menu button */}
          <div className="flex md:hidden">
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-2 rounded-lg text-slate-700 hover:bg-slate-100"
              aria-label="Toggle navigation menu"
            >
              {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>

        {/* Mobile dropdown */}
        {mobileMenuOpen && (
          <div className="md:hidden border-b border-slate-200 bg-white px-4 pt-3 pb-6 space-y-3">
            <a
              href="#features"
              onClick={() => setMobileMenuOpen(false)}
              className="block py-2 text-sm font-semibold text-slate-700"
            >
              Features
            </a>
            <a
              href="#how-it-works"
              onClick={() => setMobileMenuOpen(false)}
              className="block py-2 text-sm font-semibold text-slate-700"
            >
              How It Works
            </a>
            <a
              href="#benefits"
              onClick={() => setMobileMenuOpen(false)}
              className="block py-2 text-sm font-semibold text-slate-700"
            >
              System Benefits
            </a>
            <a
              href="#architecture"
              onClick={() => setMobileMenuOpen(false)}
              className="block py-2 text-sm font-semibold text-slate-700"
            >
              Architecture
            </a>
            <div className="pt-4 border-t border-slate-100 flex flex-col gap-2">
              {user ? (
                <Link
                  to="/dashboard"
                  onClick={() => setMobileMenuOpen(false)}
                  className="w-full text-center py-2.5 rounded-xl text-sm font-semibold text-white bg-[#0E2271]"
                >
                  Enter Portal
                </Link>
              ) : (
                <>
                  <Link
                    to="/login"
                    onClick={() => setMobileMenuOpen(false)}
                    className="w-full text-center py-2.5 rounded-xl text-sm font-semibold text-slate-700 bg-slate-100"
                  >
                    Sign In
                  </Link>
                  <Link
                    to="/register"
                    onClick={() => setMobileMenuOpen(false)}
                    className="w-full text-center py-2.5 rounded-xl text-sm font-semibold text-white bg-[#0E2271]"
                  >
                    Get Started
                  </Link>
                </>
              )}
            </div>
          </div>
        )}
      </header>

      {/* ─── HERO SECTION ─────────────────────────────────────────────── */}
      <section className="relative overflow-hidden pt-12 pb-20 lg:pt-20 lg:pb-32">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-12 gap-12 lg:gap-8 items-center">
            {/* Left Copy */}
            <div className="lg:col-span-7 space-y-6">
              <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-blue-50 border border-blue-200 text-[#0E2271] text-xs font-bold tracking-wide">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                <span>OFFLINE-FIRST ARCHITECTURE &bull; BUILT BY NILEPIXEL TECHNOLOGIES</span>
              </div>

              <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight text-slate-950 leading-[1.12]">
                Smarter Infrastructure Reporting.{' '}
                <span className="text-[#0E2271] block">Faster Maintenance Response.</span>
              </h1>

              <p className="text-lg text-slate-600 max-w-2xl leading-relaxed">
                Report infrastructure problems, coordinate maintenance activities, and monitor service
                improvements through one reliable platform — even when internet connectivity is unavailable.
              </p>

              {/* CTAs */}
              <div className="pt-2 flex flex-wrap items-center gap-4">
                <Link
                  to={user ? '/dashboard' : '/register'}
                  className="inline-flex items-center gap-2.5 px-6 py-3.5 rounded-xl text-base font-bold text-white bg-[#0E2271] hover:bg-[#1A3580] transition-all shadow-lg shadow-blue-950/15"
                >
                  <span>{user ? 'Open Dashboard' : 'Get Started'}</span>
                  <ArrowRight className="w-5 h-5" />
                </Link>
                <a
                  href="#features"
                  className="inline-flex items-center gap-2 px-6 py-3.5 rounded-xl text-base font-semibold text-slate-700 bg-white hover:bg-slate-50 border border-slate-300 transition-colors shadow-xs"
                >
                  <span>Explore Features</span>
                  <ChevronRight className="w-4 h-4 text-slate-400" />
                </a>
              </div>

              {/* Trust & Proof Metrics */}
              <div className="pt-6 border-t border-slate-200/80 grid grid-cols-3 gap-6 text-left">
                <div>
                  <div className="font-extrabold text-2xl text-[#0E2271] font-mono">100%</div>
                  <div className="text-xs text-slate-500 font-medium mt-0.5">Offline Persistence</div>
                </div>
                <div>
                  <div className="font-extrabold text-2xl text-[#0E2271] font-mono">&lt; 15ms</div>
                  <div className="text-xs text-slate-500 font-medium mt-0.5">IndexedDB Commit</div>
                </div>
                <div>
                  <div className="font-extrabold text-2xl text-[#0E2271] font-mono">Zero</div>
                  <div className="text-xs text-slate-500 font-medium mt-0.5">Data Loss On Reload</div>
                </div>
              </div>
            </div>

            {/* Right Dashboard Visual Card Preview */}
            <div className="lg:col-span-5 relative">
              <div className="relative mx-auto max-w-md lg:max-w-none rounded-2xl bg-gradient-to-br from-[#0E2271] to-[#1A3580] p-6 shadow-2xl text-white border border-blue-900">
                {/* Header status bar */}
                <div className="flex items-center justify-between pb-4 border-b border-white/10">
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full bg-red-400" />
                    <div className="w-3 h-3 rounded-full bg-amber-400" />
                    <div className="w-3 h-3 rounded-full bg-emerald-400" />
                  </div>
                  <div className="text-[11px] font-mono bg-white/10 px-2.5 py-1 rounded text-blue-200 font-bold flex items-center gap-1.5">
                    <WifiOff className="w-3 h-3 text-amber-300" />
                    <span>LOCAL DISK GUARANTEED</span>
                  </div>
                </div>

                {/* Simulated Incident Card */}
                <div className="mt-5 space-y-4">
                  <div className="bg-white/10 rounded-xl p-4 border border-white/10 backdrop-blur-xs">
                    <div className="flex items-center justify-between text-xs font-mono text-blue-200 mb-1.5">
                      <span>CLIENT-UUID: 0ce4da04...</span>
                      <span className="bg-amber-400 text-slate-950 px-2 py-0.5 rounded font-extrabold text-[10px]">
                        PENDING SYNC
                      </span>
                    </div>
                    <div className="font-bold text-base text-white">Transformer Cooling Valve Rupture</div>
                    <div className="flex items-center gap-1.5 text-xs text-blue-200 mt-1">
                      <MapPin className="w-3.5 h-3.5 text-amber-300" />
                      <span>North Substation, Bay #4 (Offline captured)</span>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div className="bg-white/5 p-3 rounded-xl border border-white/10">
                      <span className="text-[11px] text-blue-200 uppercase font-semibold block">Priority</span>
                      <span className="text-sm font-bold text-red-400 mt-0.5 block">Critical Impact</span>
                    </div>
                    <div className="bg-white/5 p-3 rounded-xl border border-white/10">
                      <span className="text-[11px] text-blue-200 uppercase font-semibold block">Workflow</span>
                      <span className="text-sm font-bold text-emerald-300 mt-0.5 block">Submitted</span>
                    </div>
                  </div>

                  <div className="bg-white/5 p-3.5 rounded-xl border border-white/10 flex items-center justify-between text-xs">
                    <span className="text-blue-200">Auto-sync on network reconnect:</span>
                    <span className="text-emerald-400 font-bold font-mono">ACTIVE</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ─── FEATURES SECTION ─────────────────────────────────────────── */}
      <section id="features" className="py-20 bg-white border-y border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto mb-16 space-y-3">
            <h2 className="text-xs font-bold uppercase tracking-widest text-blue-700">Platform Capabilities</h2>
            <p className="text-3xl sm:text-4xl font-extrabold text-slate-950 tracking-tight">
              Built for Harsh Field Realities & Centralized Oversight
            </p>
            <p className="text-base text-slate-600">
              Every feature is engineered to preserve reporting velocity without requiring constant connectivity.
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {/* Feature 1 */}
            <div className="p-6 rounded-2xl bg-[#F8FAFC] border border-slate-200 hover:border-blue-400 transition-colors space-y-3">
              <div className="w-12 h-12 rounded-xl bg-blue-100 flex items-center justify-center text-[#0E2271]">
                <WifiOff className="w-6 h-6" />
              </div>
              <h3 className="font-bold text-lg text-slate-900">1. Offline-First Reporting</h3>
              <p className="text-sm text-slate-600 leading-relaxed">
                Create and validate infrastructure tickets in tunnels, basements, or remote routes. Forms write to Dexie IndexedDB instantly with guaranteed retention.
              </p>
            </div>

            {/* Feature 2 */}
            <div className="p-6 rounded-2xl bg-[#F8FAFC] border border-slate-200 hover:border-blue-400 transition-colors space-y-3">
              <div className="w-12 h-12 rounded-xl bg-emerald-100 flex items-center justify-center text-emerald-700">
                <RefreshCw className="w-6 h-6" />
              </div>
              <h3 className="font-bold text-lg text-slate-900">2. Automatic Synchronization</h3>
              <p className="text-sm text-slate-600 leading-relaxed">
                Background listeners detect connection recovery, drain queued requests in batches, and handle idempotent confirmations without generating duplicate tickets.
              </p>
            </div>

            {/* Feature 3 */}
            <div className="p-6 rounded-2xl bg-[#F8FAFC] border border-slate-200 hover:border-blue-400 transition-colors space-y-3">
              <div className="w-12 h-12 rounded-xl bg-amber-100 flex items-center justify-center text-amber-800">
                <AlertTriangle className="w-6 h-6" />
              </div>
              <h3 className="font-bold text-lg text-slate-900">3. Infrastructure Issue Tracking</h3>
              <p className="text-sm text-slate-600 leading-relaxed">
                Classify damages across water points, equipment failures, traffic disruptions, and safety hazards with structured location metadata and photos.
              </p>
            </div>

            {/* Feature 4 */}
            <div className="p-6 rounded-2xl bg-[#F8FAFC] border border-slate-200 hover:border-blue-400 transition-colors space-y-3">
              <div className="w-12 h-12 rounded-xl bg-rose-100 flex items-center justify-center text-rose-700">
                <Layers className="w-6 h-6" />
              </div>
              <h3 className="font-bold text-lg text-slate-900">4. Priority Management</h3>
              <p className="text-sm text-slate-600 leading-relaxed">
                Categorize incidents into Low, Medium, High, and Critical triage tiers to route municipal response crews where immediate public safety is at risk.
              </p>
            </div>

            {/* Feature 5 */}
            <div className="p-6 rounded-2xl bg-[#F8FAFC] border border-slate-200 hover:border-blue-400 transition-colors space-y-3">
              <div className="w-12 h-12 rounded-xl bg-indigo-100 flex items-center justify-center text-indigo-700">
                <ClipboardCheck className="w-6 h-6" />
              </div>
              <h3 className="font-bold text-lg text-slate-900">5. Maintenance Coordination</h3>
              <p className="text-sm text-slate-600 leading-relaxed">
                Coordinator command center provides role-gated workflows to assign response teams, update statuses, and mandate audit reasons on terminal rejections.
              </p>
            </div>

            {/* Feature 6 */}
            <div className="p-6 rounded-2xl bg-[#F8FAFC] border border-slate-200 hover:border-blue-400 transition-colors space-y-3">
              <div className="w-12 h-12 rounded-xl bg-purple-100 flex items-center justify-center text-purple-700">
                <History className="w-6 h-6" />
              </div>
              <h3 className="font-bold text-lg text-slate-900">6. Verifiable Activity History</h3>
              <p className="text-sm text-slate-600 leading-relaxed">
                Every ticket modification produces an immutable chronological log capturing previous values, new values, user attribution, and server timestamps.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ─── HOW IT WORKS ─────────────────────────────────────────────── */}
      <section id="how-it-works" className="py-20 bg-[#F8FAFC]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto mb-16 space-y-3">
            <h2 className="text-xs font-bold uppercase tracking-widest text-blue-700">Workflow Overview</h2>
            <p className="text-3xl sm:text-4xl font-extrabold text-slate-950 tracking-tight">
              Four Steps from Hazard Discovery to Audited Resolution
            </p>
          </div>

          <div className="grid md:grid-cols-4 gap-8 relative">
            {/* Step 1 */}
            <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs relative space-y-3">
              <div className="w-8 h-8 rounded-lg bg-[#0E2271] text-white flex items-center justify-center font-bold text-sm">
                1
              </div>
              <h3 className="font-bold text-base text-slate-900">Report an Issue</h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                Field technicians capture damage descriptions, coordinates, and urgency on mobile or tablet.
              </p>
            </div>

            {/* Step 2 */}
            <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs relative space-y-3">
              <div className="w-8 h-8 rounded-lg bg-[#0E2271] text-white flex items-center justify-center font-bold text-sm">
                2
              </div>
              <h3 className="font-bold text-base text-slate-900">Save Locally</h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                The report commits instantly to browser IndexedDB with a permanent client UUID idempotency key.
              </p>
            </div>

            {/* Step 3 */}
            <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs relative space-y-3">
              <div className="w-8 h-8 rounded-lg bg-[#0E2271] text-white flex items-center justify-center font-bold text-sm">
                3
              </div>
              <h3 className="font-bold text-base text-slate-900">Batch Synchronize</h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                When network recovers, the sync engine batches queued tickets to the Express API with exponential backoff.
              </p>
            </div>

            {/* Step 4 */}
            <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs relative space-y-3">
              <div className="w-8 h-8 rounded-lg bg-[#0E2271] text-white flex items-center justify-center font-bold text-sm">
                4
              </div>
              <h3 className="font-bold text-base text-slate-900">Triage & Resolve</h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                Coordinators assign repair teams, advance through state machines, and close audited work orders.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ─── SYSTEM BENEFITS ─────────────────────────────────────────── */}
      <section id="benefits" className="py-20 bg-white border-y border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div className="space-y-6">
              <h2 className="text-xs font-bold uppercase tracking-widest text-blue-700">Proven Operational Gains</h2>
              <p className="text-3xl sm:text-4xl font-extrabold text-slate-950 tracking-tight">
                Why Offline Resilience Matters for Modern Municipalities
              </p>
              <div className="space-y-4 text-sm text-slate-600">
                <div className="flex items-start gap-3">
                  <div className="w-5 h-5 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center shrink-0 mt-0.5">
                    <Check className="w-3.5 h-3.5" />
                  </div>
                  <p>
                    <strong className="text-slate-900">Reliable reporting in low-connectivity environments:</strong> No lost forms or stalled field work due to intermittent cellular dead zones.
                  </p>
                </div>

                <div className="flex items-start gap-3">
                  <div className="w-5 h-5 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center shrink-0 mt-0.5">
                    <Check className="w-3.5 h-3.5" />
                  </div>
                  <p>
                    <strong className="text-slate-900">Improved maintenance coordination:</strong> Direct role separation between field workers logging issues and coordinators triaging work.
                  </p>
                </div>

                <div className="flex items-start gap-3">
                  <div className="w-5 h-5 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center shrink-0 mt-0.5">
                    <Check className="w-3.5 h-3.5" />
                  </div>
                  <p>
                    <strong className="text-slate-900">Optimistic concurrency with zero silent overwrites:</strong> Version conflicts (HTTP 409) prompt user-guided visual side-by-side reconciliation.
                  </p>
                </div>

                <div className="flex items-start gap-3">
                  <div className="w-5 h-5 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center shrink-0 mt-0.5">
                    <Check className="w-3.5 h-3.5" />
                  </div>
                  <p>
                    <strong className="text-slate-900">Enterprise security & zero database key leaks:</strong> Frontend uses only Supabase public anon keys; privileged database queries remain locked on the backend.
                  </p>
                </div>
              </div>
            </div>

            <div id="architecture" className="p-8 rounded-2xl bg-[#0E2271] text-white space-y-6">
              <h3 className="font-extrabold text-xl text-white">Full-Stack Tech Stack</h3>
              <div className="space-y-4 text-xs font-mono">
                <div className="p-3 bg-white/10 rounded-xl border border-white/10">
                  <span className="text-blue-300 block font-bold">CLIENT TIER</span>
                  <span className="text-slate-200">React 19 + TypeScript + Vite + Tailwind CSS v4 + Dexie.js (IndexedDB) + PWA</span>
                </div>
                <div className="p-3 bg-white/10 rounded-xl border border-white/10">
                  <span className="text-blue-300 block font-bold">SERVER API</span>
                  <span className="text-slate-200">Node.js Express + TypeScript + Helmet + CORS Wildcards + Rate Limiting</span>
                </div>
                <div className="p-3 bg-white/10 rounded-xl border border-white/10">
                  <span className="text-blue-300 block font-bold">PERSISTENCE</span>
                  <span className="text-slate-200">Supabase Managed PostgreSQL + Row-Level Security (RLS) + Auth triggers</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ─── CALL TO ACTION ───────────────────────────────────────────── */}
      <section className="py-20 bg-gradient-to-br from-[#0E2271] to-[#1A3580] text-white">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 text-center space-y-6">
          <h2 className="text-3xl sm:text-4xl font-extrabold tracking-tight">
            Ready to Improve Infrastructure Reporting?
          </h2>
          <p className="text-base text-blue-200 max-w-2xl mx-auto leading-relaxed">
            Start reporting infrastructure issues and help coordinate faster maintenance responses across your district.
          </p>
          <div className="pt-2">
            <Link
              to={user ? '/dashboard' : '/register'}
              className="inline-flex items-center gap-2.5 px-8 py-4 rounded-xl text-base font-bold text-[#0E2271] bg-white hover:bg-slate-100 transition-colors shadow-xl"
            >
              <span>{user ? 'Access Dashboard' : 'Access the Platform'}</span>
              <ArrowRight className="w-5 h-5" />
            </Link>
          </div>
        </div>
      </section>

      {/* ─── FOOTER ───────────────────────────────────────────────────── */}
      <footer className="bg-slate-950 text-slate-400 py-12 border-t border-slate-900 text-xs">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-3">
            <div className="w-7 h-7 rounded-lg bg-blue-600 flex items-center justify-center text-white">
              <Database className="w-4 h-4" />
            </div>
            <div>
              <span className="font-bold text-white tracking-tight">InfraSync</span>
              <span className="text-slate-500 ml-2">Offline Infrastructure Reporting & Maintenance Management</span>
            </div>
          </div>

          <div className="flex items-center gap-6">
            <a href="#features" className="hover:text-white transition-colors">Features</a>
            <a href="#how-it-works" className="hover:text-white transition-colors">How It Works</a>
            <Link to="/login" className="hover:text-white transition-colors">Sign In</Link>
          </div>

          <div className="text-center sm:text-right space-y-1">
            <p className="text-slate-300 font-medium">
              Built by <span className="text-white font-semibold">NilePixel Technologies</span>
            </p>
            <p className="text-slate-500">
              &copy; {new Date().getFullYear()} NilePixel Technologies. All rights reserved.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
};
