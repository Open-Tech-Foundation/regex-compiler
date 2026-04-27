export default function Modal({ isOpen, onClose, title, children, size = "md" }) {
  const sizeClasses = {
    sm: "max-w-xl",
    md: "max-w-2xl",
    lg: "max-w-4xl",
    xl: "max-w-6xl"
  };

  const paddingClasses = {
    sm: "p-6",
    md: "p-8",
    lg: "p-8",
    xl: "p-10"
  };

  return (
    <>
      {isOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          {/* Backdrop */}
          <div 
            className="absolute inset-0 bg-black/70 backdrop-blur-sm transition-opacity" 
            onclick={onClose}
          />
          
          {/* Dialog */}
          <div className={`relative w-full ${sizeClasses[size]} bg-[#0c0c0e] border border-[#27272a] rounded-xl shadow-2xl overflow-hidden flex flex-col max-h-[85vh] transition-all animate-in fade-in zoom-in-95 duration-200`}>
            <div className={`px-6 py-4 border-b border-[#27272a] flex items-center justify-between bg-[#09090b]`}>
              <h3 className="text-lg font-bold text-white tracking-tight">{title}</h3>
              <button 
                onclick={onClose}
                className="text-zinc-500 hover:text-white p-1.5 hover:bg-zinc-800 rounded-lg transition-all"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            
            <div className={`flex-1 overflow-y-auto ${paddingClasses[size]} custom-scrollbar`}>
              {children}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
