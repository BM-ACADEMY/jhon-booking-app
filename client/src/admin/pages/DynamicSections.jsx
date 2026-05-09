import { useState } from 'react';
import { Layers, ToggleLeft, ToggleRight, GripVertical, Edit2, Plus } from 'lucide-react';

const defaultSections = [
  { id: 'about', label: 'About Section', description: 'Company info and story', isVisible: true, order: 1 },
  { id: 'features', label: 'Features / Amenities', description: 'Hotel amenities highlight grid', isVisible: true, order: 2 },
  { id: 'gallery', label: 'Photo Gallery', description: 'Image gallery showcase', isVisible: true, order: 3 },
  { id: 'testimonials', label: 'Testimonials', description: 'Guest reviews carousel', isVisible: true, order: 4 },
  { id: 'contact', label: 'Contact & Map', description: 'Contact form with Google Maps', isVisible: false, order: 5 },
  { id: 'social', label: 'Social Media Feed', description: 'Instagram / Facebook feed', isVisible: false, order: 6 },
];

const DynamicSections = () => {
  const [sections, setSections] = useState(defaultSections);

  const toggleVisibility = (id) => {
    setSections((prev) => prev.map((s) => s.id === id ? { ...s, isVisible: !s.isVisible } : s));
  };

  return (
    <div className="space-y-5">
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-6">
        <div className="flex items-center justify-between mb-5">
          <div>
            <h2 className="font-semibold text-gray-800 flex items-center gap-2">
              <Layers className="w-5 h-5 text-primary-500" />
              Homepage Sections
            </h2>
            <p className="text-sm text-gray-500 mt-0.5">Manage the visibility and order of homepage sections</p>
          </div>
          <button className="flex items-center gap-2 bg-primary-500 hover:bg-primary-600 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors">
            <Plus className="w-4 h-4" />
            Add Section
          </button>
        </div>

        <div className="space-y-2">
          {sections.map((section) => (
            <div
              key={section.id}
              className={`flex items-center gap-4 p-4 rounded-xl border transition-all ${section.isVisible ? 'border-gray-100 bg-gray-50' : 'border-gray-100 bg-white opacity-60'}`}
            >
              <GripVertical className="w-5 h-5 text-gray-300 cursor-grab flex-shrink-0" />
              <div className="w-7 h-7 rounded-lg bg-primary-100 flex items-center justify-center text-primary-600 font-bold text-xs flex-shrink-0">
                {section.order}
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-medium text-sm text-gray-800">{section.label}</p>
                <p className="text-xs text-gray-400 truncate">{section.description}</p>
              </div>
              <span className={`hidden sm:inline-block text-xs px-2.5 py-1 rounded-full font-medium ${section.isVisible ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}`}>
                {section.isVisible ? 'Visible' : 'Hidden'}
              </span>
              <div className="flex items-center gap-2 flex-shrink-0">
                <button className="p-1.5 rounded-lg hover:bg-white border border-transparent hover:border-gray-200 text-gray-400 hover:text-primary-600 transition-colors">
                  <Edit2 className="w-4 h-4" />
                </button>
                <button onClick={() => toggleVisibility(section.id)} title={section.isVisible ? 'Hide' : 'Show'}>
                  {section.isVisible
                    ? <ToggleRight className="w-7 h-7 text-green-500" />
                    : <ToggleLeft className="w-7 h-7 text-gray-300" />}
                </button>
              </div>
            </div>
          ))}
        </div>

        <div className="mt-5 pt-5 border-t border-gray-100 flex justify-end">
          <button className="px-6 py-2.5 bg-primary-500 hover:bg-primary-600 text-white rounded-lg text-sm font-medium transition-colors">
            Save Layout
          </button>
        </div>
      </div>

      {/* Info */}
      <div className="bg-primary-50 border border-primary-100 rounded-xl p-4 flex items-start gap-3">
        <Layers className="w-5 h-5 text-primary-500 mt-0.5 flex-shrink-0" />
        <div>
          <p className="text-sm font-medium text-primary-800">Drag to reorder sections</p>
          <p className="text-xs text-primary-600 mt-0.5">The order here reflects the order sections appear on your homepage. Toggle visibility to show or hide sections without deleting them.</p>
        </div>
      </div>
    </div>
  );
};

export default DynamicSections;
