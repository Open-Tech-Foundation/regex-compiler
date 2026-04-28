import Modal from './Modal';
import { EXAMPLE_REGISTRY } from '../data/examples';

export default function SampleLibraryModal({ isOpen, onClose, onLoadExample }) {
  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Sample Library" size="sm">
      <div className="grid grid-cols-1 gap-4">
        {EXAMPLE_REGISTRY.map((ex) => (
          <button
            key={ex.id}
            onclick={() => onLoadExample(ex)}
            className="group flex flex-col p-6 bg-[#09090b] border border-[#27272a] hover:border-blue-500/50 rounded-xl transition-all text-left cursor-pointer"
          >
            <h4 className="text-lg font-bold text-white group-hover:text-blue-400 transition-colors mb-2">
              {ex.title}
            </h4>
            <p className="text-sm text-zinc-200 line-clamp-2 leading-relaxed mb-4">
              {ex.description}
            </p>
            <div className="flex flex-wrap gap-2">
              {ex.features.map((feat, fIdx) => (
                <span
                  key={fIdx}
                  className="px-2.5 py-1 rounded-full bg-purple-500/20 border border-purple-500/40 text-[10px] font-bold text-purple-200 uppercase tracking-tight"
                >
                  {feat}
                </span>
              ))}
            </div>
          </button>
        ))}
      </div>
    </Modal>
  );
}
