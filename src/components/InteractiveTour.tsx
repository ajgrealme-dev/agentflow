'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useRouter, usePathname, useSearchParams } from 'next/navigation';
import { Compass, ArrowRight, ArrowLeft, X, Sparkles } from 'lucide-react';

// Semi-auto tour: auto-advances every AUTO_ADVANCE_MS, but user can click Lanjutkan anytime
const AUTO_ADVANCE_MS = 5000;

interface TourStep {
  title: string;
  description: string;
  route: string;
  highlightSelector?: string;
  position: 'center' | 'bottom-right' | 'bottom-left' | 'top-right' | 'top-left';
}

const TOUR_STEPS: TourStep[] = [
  {
    title: 'Selamat Datang di AgentFlow! 🚀',
    description: 'Tur interaktif ini dirancang untuk menunjukkan bagaimana AgentFlow dapat menggantikan entri data manual 24/7 di perusahaan Anda menggunakan AI Agents otonom. Mari kita lihat alurnya!',
    route: '/',
    position: 'center'
  },
  {
    title: '1. Monitor Kinerja & Biaya (C-Suite) 📊',
    description: 'Ini adalah Executive Dashboard. Di sini pimpinan memantau kesehatan seluruh sistem secara real-time. Perhatikan metrik penghematan waktu ("Jam Kerja Dihemat") dan efisiensi biaya API token ("Biaya API Token").',
    route: '/',
    highlightSelector: '[data-tour="dashboard-stats"]',
    position: 'bottom-right'
  },
  {
    title: '2. Meja Kerja Agen & Alat Kerja AI 🛠️',
    description: 'Di halaman Workbench (Meja Kerja), Anda dapat melihat seluruh alat kerja (tools) yang digunakan setiap karyawan AI — dari tool OCR, RFQ Generator, hingga Scraper SEO. Klik salah satu node di bagan untuk melihat detail SOP dan uji coba tool secara langsung di Sandbox.',
    route: '/workbench',
    highlightSelector: '[data-tour="workbench-tools"]',
    position: 'bottom-right'
  },
  {
    title: '3. Command Center Otonom Ava 💬',
    description: 'Ini adalah Ava, pusat kendali AI otonom Anda. Cukup ketik perintah dalam bahasa Indonesia (misal: "siapa yang absen hari ini") atau klik salah satu pil "Aksi Cepat" untuk menyuruh Ava bekerja.',
    route: '/command',
    highlightSelector: '[data-tour="command-chat"]',
    position: 'top-right'
  },
  {
    title: '4. Jalankan Simulasi Divisi Keuangan AI 🧾',
    description: 'Di divisi Keuangan, Anda dapat memicu pengujian otonom secara langsung. Klik tombol "Jalankan Auto-Reminder WA" atau "Buat Invoice Draf AI" di tab invoices dan saksikan logs eksekusi mengalir di terminal sebelah kanan!',
    route: '/finance?tab=invoices&tool=invoices',
    highlightSelector: '[data-tour="finance-tools"]',
    position: 'bottom-right'
  },
  {
    title: 'Tur Selesai! 🎉 Anda Siap Presentasi',
    description: 'Hebat! Anda telah menguasai alur simulasi AgentFlow. Untuk melakukan presentasi/pitching ke calon klien atau manajer, Anda cukup memandu mereka melalui 4 langkah ini untuk menunjukkan efisiensi nyata.',
    route: '/',
    position: 'center'
  }
];

export default function InteractiveTour() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const [isTourActive, setIsTourActive] = useState(false);
  const [isAutoPilot, setIsAutoPilot] = useState(false);
  const [activeStep, setActiveStep] = useState(0);
  const [highlightRect, setHighlightRect] = useState<DOMRect | null>(null);
  // Countdown progress 0→100 for the auto-advance bar
  const [countdown, setCountdown] = useState(0);
  const countdownRef = useRef<NodeJS.Timeout | null>(null);
  // Ref to always hold the latest activeStep value inside closures
  const activeStepRef = useRef(0);

  // Keep ref in sync with state
  useEffect(() => { activeStepRef.current = activeStep; }, [activeStep]);

  const lastScrolledSelector = React.useRef<string | undefined | null>(null);

  // Initialize tour state from localStorage
  useEffect(() => {
    const active = localStorage.getItem('agentflow_tour_active') === 'true';
    const autopilot = localStorage.getItem('agentflow_tour_autopilot') === 'true';
    const step = parseInt(localStorage.getItem('agentflow_tour_step') || '0', 10);
    setIsTourActive(active);
    setIsAutoPilot(autopilot);
    setActiveStep(step);
  }, []);

  // Update spotlight bounding box based on step & routing
  useEffect(() => {
    if (!isTourActive) {
      setHighlightRect(null);
      lastScrolledSelector.current = null;
      return;
    }

    const step = TOUR_STEPS[activeStep];
    if (step?.highlightSelector) {
      const updateRect = () => {
        const el = document.querySelector(step.highlightSelector!);
        if (el) {
          setHighlightRect(el.getBoundingClientRect());
          
          // Scroll ONLY ONCE when the target selector changes
          if (lastScrolledSelector.current !== step.highlightSelector) {
            el.scrollIntoView({ behavior: 'smooth', block: 'center' });
            lastScrolledSelector.current = step.highlightSelector;
          }
        } else {
          setHighlightRect(null);
        }
      };

      updateRect();
      // Poll coordinates to accommodate layout changes/hydration delays
      const interval = setInterval(updateRect, 1000);
      return () => clearInterval(interval);
    } else {
      setHighlightRect(null);
      lastScrolledSelector.current = null;
    }
  }, [activeStep, isTourActive, pathname, searchParams]);

  // Semi-auto countdown timer: reset to 0, tick to 100 over AUTO_ADVANCE_MS, then auto-advance
  useEffect(() => {
    if (!isTourActive) {
      if (countdownRef.current) clearInterval(countdownRef.current);
      setCountdown(0);
      return;
    }

    setCountdown(0);
    const tickInterval = 100; // ms per tick
    const totalTicks = AUTO_ADVANCE_MS / tickInterval;
    let ticks = 0;

    countdownRef.current = setInterval(() => {
      ticks++;
      const progress = Math.min((ticks / totalTicks) * 100, 100);
      setCountdown(progress);

      if (ticks >= totalTicks) {
        clearInterval(countdownRef.current!);
        // Read fresh step from ref (avoids stale closure)
        const currentStep = activeStepRef.current;
        const nextStep = currentStep + 1;

        if (nextStep >= TOUR_STEPS.length) {
          // End of tour — clean up
          setIsTourActive(false);
          setIsAutoPilot(false);
          setActiveStep(0);
          setCountdown(0);
          setHighlightRect(null);
          localStorage.removeItem('agentflow_tour_active');
          localStorage.removeItem('agentflow_tour_autopilot');
          localStorage.removeItem('agentflow_tour_step');
          router.push('/');
        } else {
          // Advance to next step
          setActiveStep(nextStep);
          setCountdown(0);
          localStorage.setItem('agentflow_tour_step', String(nextStep));
          router.push(TOUR_STEPS[nextStep].route);
        }
      }
    }, tickInterval);

    return () => {
      if (countdownRef.current) clearInterval(countdownRef.current);
    };
  }, [activeStep, isTourActive]);

  // Auto-Pilot Execution Loop Engine
  useEffect(() => {
    if (!isTourActive || !isAutoPilot) return;

    let timer: NodeJS.Timeout;
    const step = TOUR_STEPS[activeStep];

    // Helper: simulate typing in chat inputs
    const typeText = (text: string, inputEl: HTMLInputElement, callback: () => void) => {
      let idx = 0;
      inputEl.value = '';
      const typeInterval = setInterval(() => {
        if (idx < text.length) {
          inputEl.value += text[idx];
          inputEl.dispatchEvent(new Event('input', { bubbles: true }));
          idx++;
        } else {
          clearInterval(typeInterval);
          setTimeout(callback, 800);
        }
      }, 70);
    };

    const runAutoAction = () => {
      // Step-specific otonom actions
      if (activeStep === 0) {
        // Welcome step: wait 5s
        timer = setTimeout(handleNext, 5000);
      } else if (activeStep === 1) {
        // Dashboard stats: wait 6s
        timer = setTimeout(handleNext, 6000);
      } else if (activeStep === 2) {
        // Workbench graph: wait 6s
        timer = setTimeout(handleNext, 6000);
      } else if (activeStep === 3) {
        // Command chatbot: type and submit
        const runChatAction = () => {
          const inputEl = document.querySelector('input[placeholder*="Ketik perintah"]') as HTMLInputElement;
          if (inputEl) {
            typeText('siapa yang absen hari ini', inputEl, () => {
              const sendBtn = document.querySelector('button svg.lucide-send')?.parentElement || document.querySelector('button[type="submit"]') as HTMLButtonElement;
              if (sendBtn) {
                sendBtn.click();
                // Wait for response and proceed
                timer = setTimeout(handleNext, 8000);
              } else {
                timer = setTimeout(handleNext, 3000);
              }
            });
          } else {
            timer = setTimeout(handleNext, 4000);
          }
        };

        // Delay starting action until page hydrates
        timer = setTimeout(runChatAction, 1500);
      } else if (activeStep === 4) {
        // Finance simulator: click reminder button
        const runFinanceAction = () => {
          const toolsBtn = document.querySelector('[data-tour="finance-tools"] button') as HTMLButtonElement;
          if (toolsBtn) {
            // Apply visual hover/click highlight
            toolsBtn.classList.add('ring-4', 'ring-primary', 'scale-[1.02]');
            setTimeout(() => {
              toolsBtn.click();
              toolsBtn.classList.remove('ring-4', 'ring-primary', 'scale-[1.02]');
              // Wait 9s for log streams to finish
              timer = setTimeout(handleNext, 9000);
            }, 1000);
          } else {
            timer = setTimeout(handleNext, 4000);
          }
        };

        timer = setTimeout(runFinanceAction, 1500);
      } else if (activeStep === 5) {
        // Conclusion: wait 6s then finish
        timer = setTimeout(endTour, 6000);
      }
    };

    // Ensure we are on the correct page before triggering otonom action
    const currentCleanPath = pathname + (searchParams.toString() ? '?' + searchParams.toString() : '');
    const targetCleanPath = step.route;
    
    if (pathname !== step.route.split('?')[0]) {
      router.push(step.route);
    } else {
      runAutoAction();
    }

    return () => {
      clearTimeout(timer);
    };
  }, [activeStep, isTourActive, isAutoPilot, pathname, searchParams]);

  const startTour = (autopilot: boolean = false) => {
    setIsTourActive(true);
    setIsAutoPilot(autopilot);
    setActiveStep(0);
    setCountdown(0);
    localStorage.setItem('agentflow_tour_active', 'true');
    localStorage.setItem('agentflow_tour_autopilot', autopilot ? 'true' : 'false');
    localStorage.setItem('agentflow_tour_step', '0');
    router.push(TOUR_STEPS[0].route);
  };

  const endTour = () => {
    setIsTourActive(false);
    setIsAutoPilot(false);
    setActiveStep(0);
    setCountdown(0);
    setHighlightRect(null);
    if (countdownRef.current) clearInterval(countdownRef.current);
    localStorage.removeItem('agentflow_tour_active');
    localStorage.removeItem('agentflow_tour_autopilot');
    localStorage.removeItem('agentflow_tour_step');
    router.push('/');
  };

  const handleNext = () => {
    const nextStep = activeStep + 1;
    if (countdownRef.current) clearInterval(countdownRef.current);
    setCountdown(0);
    if (nextStep >= TOUR_STEPS.length) {
      endTour();
      return;
    }
    setActiveStep(nextStep);
    localStorage.setItem('agentflow_tour_step', String(nextStep));
    router.push(TOUR_STEPS[nextStep].route);
  };

  const handlePrev = () => {
    if (activeStep <= 0) return;
    if (countdownRef.current) clearInterval(countdownRef.current);
    setCountdown(0);
    const prevStep = activeStep - 1;
    setActiveStep(prevStep);
    localStorage.setItem('agentflow_tour_step', String(prevStep));
    router.push(TOUR_STEPS[prevStep].route);
  };

  if (pathname === '/login') return null;

  const currentStep = TOUR_STEPS[activeStep];

  return (
    <>
      {/* Floating Action Trigger Button — Single semi-auto tour entry point */}
      {!isTourActive && (
        <div className="fixed bottom-6 right-6 z-50">
          <button
            onClick={() => startTour(false)}
            className="px-5 py-3.5 bg-primary hover:bg-primary-dark text-white font-bold rounded-full shadow-2xl flex items-center gap-2 hover:scale-105 active:scale-95 transition-all duration-300 cursor-pointer text-sm font-heading"
            style={{ boxShadow: '0 8px 30px 0 rgba(79, 70, 229, 0.45)' }}
          >
            <Compass className="animate-spin" size={16} style={{ animationDuration: '6s' }} />
            Mulai Tur 🧭
          </button>
        </div>
      )}

      {/* Spotlight Overlay Highlighter */}
      {isTourActive && highlightRect && (
        <div
          className="fixed pointer-events-none z-50 ring-4 ring-primary/70 border-2 border-primary rounded-2xl animate-pulse transition-all duration-300"
          style={{
            left: `${highlightRect.left - 4}px`,
            top: `${highlightRect.top - 4}px`,
            width: `${highlightRect.width + 8}px`,
            height: `${highlightRect.height + 8}px`,
            boxShadow: '0 0 35px 8px rgba(79, 70, 229, 0.4)',
          }}
        />
      )}

      {/* Guided Tour Tooltip Dialog Card */}
      {isTourActive && currentStep && (
        <div
          className={`fixed z-50 w-full max-w-sm p-6 rounded-2xl border border-light dark:border-zinc-800 bg-white/95 dark:bg-zinc-950/95 backdrop-blur-md shadow-2xl slide-up transition-all duration-300 ${
            currentStep.position === 'center'
              ? 'top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2'
              : currentStep.position === 'bottom-right'
              ? 'bottom-8 right-8'
              : currentStep.position === 'bottom-left'
              ? 'bottom-8 left-8'
              : currentStep.position === 'top-right'
              ? 'top-8 right-8'
              : 'top-8 left-8'
          }`}
          style={{ boxShadow: '0 20px 50px -12px rgba(0, 0, 0, 0.25)' }}
        >
          {/* Dual progress bars: step progress + countdown auto-advance */}
          <div className="space-y-1.5 mb-4">
            {/* Step progress */}
            <div className="w-full bg-zinc-200 dark:bg-zinc-800 h-1 rounded-full overflow-hidden">
              <div
                className="h-full bg-primary transition-all duration-500"
                style={{ width: `${((activeStep + 1) / TOUR_STEPS.length) * 100}%` }}
              />
            </div>
            {/* Auto-advance countdown bar */}
            <div className="w-full bg-zinc-200 dark:bg-zinc-800 h-1 rounded-full overflow-hidden">
              <div
                className="h-full bg-emerald-500 transition-none"
                style={{ width: `${countdown}%` }}
              />
            </div>
          </div>

          <div className="flex items-start justify-between gap-3 mb-2">
            <span className="text-[10px] font-bold text-primary uppercase tracking-wider font-mono flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping" />
              {isAutoPilot ? 'AUTO-PILOT AKTIF' : 'TUR SEMI-OTOMATIS'} · Langkah {activeStep + 1} dari {TOUR_STEPS.length}
            </span>
            <button
              onClick={endTour}
              className="p-1 rounded-lg hover:bg-zinc-100 dark:hover:bg-zinc-900 text-secondary hover:text-primary transition-colors cursor-pointer"
            >
              <X size={14} />
            </button>
          </div>

          <h4 className="text-sm font-bold text-primary mb-2 flex items-center gap-1.5 font-heading">
            <Sparkles size={14} className="text-yellow-500 animate-pulse" />
            {currentStep.title}
          </h4>

          <p className="text-xs text-secondary leading-relaxed mb-5">
            {currentStep.description}
          </p>

          <div className="flex items-center justify-between gap-3 pt-2 border-t border-zinc-100 dark:border-zinc-900">
            <button
              onClick={handlePrev}
              disabled={activeStep === 0}
              className="flex items-center gap-1 text-xs font-semibold text-secondary hover:text-primary disabled:opacity-30 disabled:pointer-events-none transition-colors cursor-pointer"
            >
              <ArrowLeft size={12} /> Kembali
            </button>

            <div className="flex gap-2">
              <button
                onClick={endTour}
                className="px-3 py-1.5 rounded-lg text-[11px] font-bold text-secondary hover:bg-zinc-100 dark:hover:bg-zinc-900 transition-colors cursor-pointer"
              >
                Lewati
              </button>
              <button
                onClick={handleNext}
                className="px-3 py-1.5 bg-primary hover:bg-primary-dark text-white rounded-lg text-[11px] font-bold shadow flex items-center gap-1 hover:scale-[1.02] active:scale-95 transition-all cursor-pointer font-heading"
              >
                {activeStep === TOUR_STEPS.length - 1 ? 'Selesai ✓' : 'Lanjutkan →'}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
