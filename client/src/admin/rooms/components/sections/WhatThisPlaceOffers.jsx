import { useState } from 'react';
import * as Icons from 'lucide-react';
import { Search } from 'lucide-react';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';

// Import SVG Assets
import airIcon from '@/assets/svg/air.svg';
import bedLinenIcon from '@/assets/svg/bed linen.svg';
import blenderIcon from '@/assets/svg/blender.svg';
import bodySoapIcon from '@/assets/svg/body soap.svg';
import cleaningIcon from '@/assets/svg/cleaing.svg';
import clothesStorageIcon from '@/assets/svg/clothes storage.svg';
import coffeeIcon from '@/assets/svg/coffee.svg';
import conditionerIcon from '@/assets/svg/conditioner.svg';
import cookerIcon from '@/assets/svg/cooker.svg';
import diningTableIcon from '@/assets/svg/dining table.svg';
import essentialsIcon from '@/assets/svg/essentials.svg';
import extraPillowsIcon from '@/assets/svg/extra pillows and blankets.svg';
import firstAidIcon from '@/assets/svg/first and kit.svg';
import fridgeIcon from '@/assets/svg/fridge.svg';
import hairdryerIcon from '@/assets/svg/hairdryer.svg';
import hangersIcon from '@/assets/svg/hangers.svg';
import hotWaterIcon from '@/assets/svg/hot water.svg';
import ironIcon from '@/assets/svg/iron.svg';
import kettleIcon from '@/assets/svg/kettle.svg';
import paidCotIcon from '@/assets/svg/paid cot.svg';
import paidFoldingIcon from '@/assets/svg/paid floading.svg';
import parkingIcon from '@/assets/svg/parking.svg';
import blindsIcon from '@/assets/svg/room darkening blinds.svg';
import shampooIcon from '@/assets/svg/shampoo.svg';
import showerGelIcon from '@/assets/svg/shower gel.svg';
import tvIcon from '@/assets/svg/tv.svg';
import washingMachineIcon from '@/assets/svg/washing machine.svg';
import wifiIcon from '@/assets/svg/wifi.svg';
import workspaceIcon from '@/assets/svg/workspace.svg';

const PREDEFINED_AMENITIES = [
  {
    category: 'Bathroom',
    items: [
      { name: 'Hairdryer', icon: 'Wind', svg: hairdryerIcon },
      { name: 'Cleaning Products', icon: 'Sparkles', svg: cleaningIcon },
      { name: 'Shampoo', icon: 'Droplet', svg: shampooIcon },
      { name: 'Conditioner', icon: 'Droplets', svg: conditionerIcon },
      { name: 'Body Soap', icon: 'Bath', svg: bodySoapIcon },
      { name: 'Hot Water', icon: 'Flame', svg: hotWaterIcon },
      { name: 'Shower Gel', icon: 'Droplet', svg: showerGelIcon }
    ]
  },
  {
    category: 'Bedroom and laundry',
    items: [
      { name: 'Washing Machine', icon: 'WashingMachine', svg: washingMachineIcon },
      { name: 'Essentials', icon: 'Heart', svg: essentialsIcon },
      { name: 'Hangers', icon: 'Shirt', svg: hangersIcon },
      { name: 'Bed Linen', icon: 'BedDouble', svg: bedLinenIcon },
      { name: 'Extra Pillows and Blankets', icon: 'Bed', svg: extraPillowsIcon },
      { name: 'Room-Darkening Blinds', icon: 'EyeOff', svg: blindsIcon },
      { name: 'Iron', icon: 'Check', svg: ironIcon }
    ]
  },
  {
    category: 'Entertainment',
    items: [
      { name: 'TV', icon: 'Tv', svg: tvIcon }
    ]
  },
  {
    category: 'Family',
    items: [
      { name: 'Paid Cot', icon: 'Baby', svg: paidCotIcon },
      { name: 'Paid Folding Chair', icon: 'Baby', svg: paidFoldingIcon }
    ]
  },
  {
    category: 'Heating and cooling',
    items: [
      { name: 'Air Conditioning', icon: 'Snowflake', svg: airIcon }
    ]
  },
  {
    category: 'Home safety',
    items: [
      { name: 'Exterior Security Cameras', icon: 'Cctv', svg: firstAidIcon /* Fallback or Lucide icon placeholder if no explicit SVG */ },
      { name: 'First Aid Kit', icon: 'PlusSquare', svg: firstAidIcon }
    ]
  },
  {
    category: 'Internet and office',
    items: [
      { name: 'Wifi', icon: 'Wifi', svg: wifiIcon },
      { name: 'Dedicated Workspace', icon: 'Laptop', svg: workspaceIcon }
    ]
  },
  {
    category: 'Kitchen and dining',
    items: [
      { name: 'Kitchen', icon: 'ChefHat', svg: cookerIcon /* Fallback to cooker SVG */ },
      { name: 'Fridge', icon: 'Refrigerator', svg: fridgeIcon },
      { name: 'Cooking Basics', icon: 'CookingPot', svg: cookerIcon },
      { name: 'Crockery and Cutlery', icon: 'Utensils', svg: diningTableIcon },
      { name: 'Cooker', icon: 'Flame', svg: cookerIcon },
      { name: 'Kettle', icon: 'Coffee', svg: kettleIcon },
      { name: 'Blender', icon: 'RefreshCw', svg: blenderIcon },
      { name: 'Dining Table', icon: 'Table', svg: diningTableIcon },
      { name: 'Coffee', icon: 'Coffee', svg: coffeeIcon }
    ]
  },
  {
    category: 'Parking and facilities',
    items: [
      { name: 'Free Parking on Premises', icon: 'Car', svg: parkingIcon }
    ]
  },
  {
    category: 'Services',
    items: [
      { name: 'Self Check-In', icon: 'Key', svg: wifiIcon /* Wifi/key placeholder */ },
      { name: 'Building staff', icon: 'Users', svg: workspaceIcon }
    ]
  },
  {
    category: 'Not included',
    items: [
      { name: 'Tumble Dryer', icon: 'WashingMachine', svg: washingMachineIcon },
      { name: 'Smoke Alarm', icon: 'Bell', svg: firstAidIcon },
      { name: 'Carbon Monoxide Alarm', icon: 'Bell', svg: firstAidIcon },
      { name: 'Heating', icon: 'Thermometer', svg: airIcon }
    ]
  }
];

const WhatThisPlaceOffers = ({ form, patch, readOnly = false }) => {
  const [searchQuery, setSearchQuery] = useState('');

  const handleToggleAmenity = (item) => {
    patch((p) => {
      const current = p.amenities || [];
      const exists = current.some((a) => a.name === item.name);
      let next;
      if (exists) {
        next = current.filter((a) => a.name !== item.name);
      } else {
        next = [...current, item];
      }
      return { ...p, amenities: next };
    });
  };

  const filteredCategories = PREDEFINED_AMENITIES.map((cat) => {
    const items = cat.items.filter((item) =>
      item.name.toLowerCase().includes(searchQuery.toLowerCase())
    );
    return { ...cat, items };
  }).filter((cat) => cat.items.length > 0);

  return (
    <div className="space-y-5">
      <div className="relative">
        <Search className="absolute left-3 top-2.5 h-4 w-4 text-zinc-400" />
        <Input
          type="text"
          placeholder="Search amenities..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="pl-9 border-zinc-200 focus:outline-none"
        />
      </div>

      <div className="space-y-6 max-h-[60vh] overflow-y-auto pr-1">
        {filteredCategories.map((cat) => (
          <div key={cat.category} className="space-y-2.5">
            <h5 className="text-xs font-bold text-zinc-800 border-b border-zinc-100 pb-1">
              {cat.category}
            </h5>
            <div className="grid grid-cols-1 gap-2.5">
              {cat.items.map((item) => {
                const isChecked = (form.amenities || []).some((a) => a.name === item.name);
                const IconComponent = Icons[item.icon] || Icons.Check;
                return (
                  <label
                    key={item.name}
                    className="flex items-center gap-3 rounded-lg border border-zinc-100 bg-white p-2.5 hover:bg-zinc-50 transition-colors cursor-pointer select-none"
                  >
                    <Checkbox
                      checked={isChecked}
                      disabled={readOnly}
                      onCheckedChange={() => handleToggleAmenity(item)}
                    />
                    {item.svg ? (
                      <img src={item.svg} className="w-4 h-4 shrink-0 object-contain" alt={item.name} style={{ filter: 'grayscale(100%) brightness(0.6)' }} />
                    ) : (
                      <IconComponent className="w-4 h-4 text-zinc-400 shrink-0" />
                    )}
                    <span className="text-xs font-medium text-zinc-700">{item.name}</span>
                  </label>
                );
              })}
            </div>
          </div>
        ))}

        {filteredCategories.length === 0 && (
          <div className="py-8 text-center text-xs font-medium text-zinc-400">
            No amenities match your search.
          </div>
        )}
      </div>
    </div>
  );
};

export default WhatThisPlaceOffers;
