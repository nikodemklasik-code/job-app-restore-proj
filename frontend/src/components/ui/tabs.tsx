import * as React from 'react';
import { clsx } from 'clsx';

interface TabsContextValue {
  activeTab: string;
  setActiveTab: (tab: string) => void;
}

const TabsContext = React.createContext<TabsContextValue | null>(null);

const useTabs = () => {
  const ctx = React.useContext(TabsContext);
  if (!ctx) throw new Error('useTabs must be used inside <Tabs>');
  return ctx;
};

interface TabsProps extends React.HTMLAttributes<HTMLDivElement> {
  defaultValue?: string;
  value?: string;
  onValueChange?: (value: string) => void;
}

export const Tabs = ({ defaultValue = '', value, onValueChange, children, className, ...props }: TabsProps) => {
  const [activeTab, setActiveTab] = React.useState(value ?? defaultValue);

  const handleSetActiveTab = (tab: string) => {
    if (value === undefined) setActiveTab(tab);
    onValueChange?.(tab);
  };

  return (
    <TabsContext.Provider value={{ activeTab: value ?? activeTab, setActiveTab: handleSetActiveTab }}>
      <div className={clsx('w-full', className)} {...props}>
        {children}
      </div>
    </TabsContext.Provider>
  );
};

export const TabsList = ({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) => (
  <div
    className={clsx(
      'inline-flex h-10 items-center gap-1 rounded-xl bg-slate-100 p-1 text-slate-500 dark:bg-slate-800 dark:text-slate-400',
      className
    )}
    {...props}
  />
);

export const TabsTrigger = ({ className, value, ...props }: React.ButtonHTMLAttributes<HTMLButtonElement> & { value: string }) => {
  const { activeTab, setActiveTab } = useTabs();
  const isActive = activeTab === value;
  return (
    <button
      onClick={() => setActiveTab(value)}
      className={clsx(
        'inline-flex items-center justify-center whitespace-nowrap rounded-lg px-3 py-1.5 text-sm font-medium transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 disabled:pointer-events-none disabled:opacity-50',
        isActive
          ? 'bg-white text-slate-900 shadow-sm dark:bg-slate-900 dark:text-slate-100'
          : 'hover:text-slate-900 dark:hover:text-slate-100',
        className
      )}
      {...props}
    />
  );
};

export const TabsContent = ({ className, value, ...props }: React.HTMLAttributes<HTMLDivElement> & { value: string }) => {
  const { activeTab } = useTabs();
  if (activeTab !== value) return null;
  return <div className={clsx('mt-4', className)} {...props} />;
};
