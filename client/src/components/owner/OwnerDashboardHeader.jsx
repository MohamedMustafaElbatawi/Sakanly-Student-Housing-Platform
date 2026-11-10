import React from 'react';
import { PlusCircle, Menu, Home, ChevronLeft } from 'lucide-react';

export const OwnerDashboardHeader = ({
  ownerName,
  activeTabTitle = 'نظرة عامة',
  onOpenCreate,
  onToggleMobileMenu,
}) => {
  return (
    <header className="bg-white border-b border-sakanly-border py-3.5 sm:py-4 px-3 sm:px-6 lg:px-8 shadow-xs">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-4">
        
        {/* Left Side: Mobile Menu Button + Breadcrumb + Greeting */}
        <div className="flex items-center gap-2.5 sm:gap-3 min-w-0">
          {/* Mobile Menu Toggle Button */}
          <button
            type="button"
            onClick={onToggleMobileMenu}
            className="md:hidden p-2 rounded-xl text-slate-700 hover:text-sakanly-primary hover:bg-slate-100 transition-colors shrink-0"
            aria-label="فتح القائمة الجانبية"
          >
            <Menu className="w-5 h-5" />
          </button>

          <div className="min-w-0 flex-1">
            {/* Breadcrumb */}
            <nav aria-label="مسار التنقل" className="flex items-center gap-1.5 text-[10px] sm:text-[11px] text-sakanly-muted mb-0.5">
              <span className="flex items-center gap-1 shrink-0">
                <Home className="w-3 h-3" />
                لوحة المالك
              </span>
              <ChevronLeft className="w-3 h-3 text-slate-400 shrink-0" />
              <span className="font-bold text-sakanly-primary truncate">{activeTabTitle}</span>
            </nav>

            {/* Personalized Greeting */}
            <h1 className="text-sm sm:text-base lg:text-xl font-bold text-sakanly-dark flex items-center gap-1.5 truncate">
              <span className="truncate">مرحباً بك، {ownerName || 'م. أحمد الشناوي'}</span>
              <span className="text-sm sm:text-lg shrink-0">👋</span>
            </h1>
          </div>
        </div>

        {/* Right Side: Action Button «إضافة عقار جديد» */}
        <div className="flex items-center gap-2.5 w-full sm:w-auto shrink-0">
          <button
            type="button"
            onClick={onOpenCreate}
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-4 py-2 sm:py-2.5 bg-sakanly-primary hover:bg-sakanly-primary-hover active:bg-teal-800 text-white text-xs sm:text-sm font-bold rounded-xl shadow-xs hover:shadow-md transition-all duration-200 active:scale-[0.99]"
          >
            <PlusCircle className="w-4 h-4 text-white shrink-0" />
            <span>إضافة عقار جديد</span>
          </button>
        </div>

      </div>
    </header>
  );
};
