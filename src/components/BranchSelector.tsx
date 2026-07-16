import type { Branch } from '../types';

interface BranchSelectorProps {
  branches: Branch[];
  activeBranchId: string;
  onChange: (id: string) => void;
}

export default function BranchSelector({ branches, activeBranchId, onChange }: BranchSelectorProps) {
  return (
    <section className="bg-[#0e0e0e] py-6 border-b border-white/5">
      <div className="max-w-7xl mx-auto px-8">
        <div className="flex gap-4 overflow-x-auto hide-scrollbar">
          {branches.map(branch => (
            <button
              key={branch.id}
              id={`branch-tab-${branch.id}`}
              onClick={() => onChange(branch.id)}
              className={`whitespace-nowrap px-6 py-2 rounded-full font-headline text-xs tracking-widest font-bold transition-all ${
                activeBranchId === branch.id
                  ? 'border border-[#d62b2b] bg-[#d62b2b]/10 text-[#d62b2b]'
                  : 'border border-white/10 text-[#e5e2e1]/60 hover:border-white/30'
              }`}
            >
              {branch.name.toUpperCase()}
            </button>
          ))}
        </div>
      </div>
    </section>
  );
}
