export default function Modal({ isOpen, onClose, title, children }) {
  return (
    <>
      {isOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          {/* Backdrop */}
          <div 
            className="absolute inset-0 bg-black/60 backdrop-blur-sm transition-opacity" 
            onclick={onClose}
          />
          
          {/* Dialog */}
          <div className="relative w-full max-w-2xl bg-[#0c0c0e] border border-[#27272a] rounded-xl shadow-2xl overflow-hidden flex flex-col max-h-[80vh]">
            <div className="px-6 py-4 border-b border-[#27272a] flex items-center justify-between bg-[#09090b]">
              <h3 className="text-lg font-semibold text-white">{title}</h3>
              <button 
                onclick={onClose}
                className="text-zinc-500 hover:text-white p-1 transition-colors"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            
            <div className="flex-1 overflow-y-auto p-6">
              {children}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
