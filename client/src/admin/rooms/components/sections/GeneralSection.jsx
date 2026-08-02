import ReactQuill from 'react-quill';
import 'react-quill/dist/quill.snow.css';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue
} from '@/components/ui/select';
import { quillModules, quillFormats, QUILL_RESPONSIVE_CSS } from '../../utils';
import { BasePricingFields } from './PricingSection';

const GeneralSection = ({
  form, patch, categories = [], readOnly = false,
  showPricing = false, priceUnits = [], onManageUnits,
}) => (
  <div className="space-y-5">
    <div className="space-y-1.5">
      <Label htmlFor="room-name">Property Name *</Label>
      <Input
        id="room-name"
        value={form.name}
        disabled={readOnly}
        onChange={(e) => patch({ name: e.target.value })}
        placeholder="e.g. Villa Mandala Serenity"
      />
    </div>

    <div className="space-y-1.5">
      <Label htmlFor="room-category">Category *</Label>
      <Select
        value={form.category || undefined}
        disabled={readOnly}
        onValueChange={(v) => patch({ category: v })}
      >
        <SelectTrigger id="room-category">
          <SelectValue placeholder="Select category" />
        </SelectTrigger>
        <SelectContent>
          {categories.map((c) => (
            <SelectItem key={c._id} value={c.name}>{c.name}</SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>

    <div className="space-y-1.5">
      <Label htmlFor="room-inventory">Maximum Physical Rooms (Inventory) *</Label>
      <Input
        id="room-inventory"
        type="number"
        min={1}
        value={form.maxInventory !== undefined ? form.maxInventory : ''}
        disabled={readOnly}
        onChange={(e) => patch({ maxInventory: e.target.value === '' ? '' : Number(e.target.value) })}
        placeholder="e.g. 2"
        className="border-zinc-200 focus:outline-none"
      />
    </div>

    {showPricing && (
      <BasePricingFields
        form={form}
        patch={patch}
        priceUnits={priceUnits}
        readOnly={readOnly}
        onManageUnits={onManageUnits}
      />
    )}

    <div className="space-y-1.5">
      <Label className="text-xs font-semibold text-zinc-700">Description</Label>
      {readOnly ? (
        <div
          className="prose prose-sm max-w-none rounded-lg border border-zinc-200 bg-zinc-50/50 p-4 text-sm text-zinc-600 shadow-sm"
          dangerouslySetInnerHTML={{ __html: form.description || 'No description provided.' }}
        />
      ) : (
        <div className="quill-responsive-container overflow-hidden shadow-sm">
          <ReactQuill
            theme="snow"
            value={form.description}
            onChange={(content) => patch({ description: content })}
            modules={quillModules}
            formats={quillFormats}
          />
        </div>
      )}
      <style dangerouslySetInnerHTML={{ __html: QUILL_RESPONSIVE_CSS }} />
    </div>
  </div>
);

export default GeneralSection;
