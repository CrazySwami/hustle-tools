'use client';

interface TabNavigationProps {
  activeTab: string;
  onTabChange: (tab: string) => void;
}

export function TabNavigation({ activeTab, onTabChange }: TabNavigationProps) {
  const tabs = [
    { id: 'json', label: 'JSON Editor', icon: '📝' },
    { id: 'playground', label: 'Playground', icon: '🚀' },
    { id: 'html-generator', label: 'HTML Generator', icon: '🎨' },
  ];

  return (
    <div className="flex border-b border-gray-200 bg-white">
      {tabs.map((tab) => (
        <button
          key={tab.id}
          onClick={() => onTabChange(tab.id)}
          className={`
            flex items-center gap-2 px-6 py-3 text-sm font-medium transition-colors
            ${activeTab === tab.id
              ? 'border-b-2 border-blue-500 text-blue-600'
              : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
            }
          `}
        >
          <span>{tab.icon}</span>
          <span>{tab.label}</span>
        </button>
      ))}
    </div>
  );
}
