import type { LucideIcon } from 'lucide-react';

interface TabPlaceholderProps {
  icon: LucideIcon;
  title: string;
  description?: string;
}

export default function TabPlaceholder({ icon: Icon, title, description = 'Working — Coming soon...' }: TabPlaceholderProps) {
  return (
    <div className="flex flex-col items-center justify-center p-12 text-center bg-transparent m-8 rounded-2xl border border-dashed border-border max-w-[600px] mx-auto mt-16 max-md:m-4 max-md:p-8 max-md:mt-8 animate-fade-in-up">
      <Icon size={42} className="mb-4 text-neutral-300 animate-pulse-slow" />
      <h3 className="text-xl font-bold text-text m-0 tracking-tight">{title}</h3>
      <p className="text-[15px] text-text-muted mt-2 m-0 max-w-[400px] leading-relaxed">{description}</p>
    </div>
  );
}
