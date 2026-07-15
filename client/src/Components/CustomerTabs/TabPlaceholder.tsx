interface TabPlaceholderProps {
  icon: string;
  title: string;
  description?: string;
}

export default function TabPlaceholder({ icon, title, description = 'Working — Coming soon...' }: TabPlaceholderProps) {
  return (
    <div className="flex flex-col items-center justify-center p-12 text-center bg-transparent m-8 rounded-2xl border border-dashed border-neutral-800 max-w-[600px] mx-auto mt-16 max-md:m-4 max-md:p-8 animate-fade-in-up">
      <div className="text-[42px] mb-4 text-neutral-600 animate-pulse-slow">{icon}</div>
      <h3 className="text-xl font-bold text-white m-0 tracking-tight">{title}</h3>
      <p className="text-[15px] text-neutral-500 mt-2 m-0 max-w-[400px] leading-relaxed">{description}</p>
    </div>
  );
}
