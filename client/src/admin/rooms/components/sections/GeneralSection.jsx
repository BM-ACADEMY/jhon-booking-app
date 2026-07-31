import ReactQuill from 'react-quill';
import 'react-quill/dist/quill.snow.css';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue
} from '@/components/ui/select';
import { quillModules, quillFormats, QUILL_RESPONSIVE_CSS } from '../../utils';
import { BasePricingFields } from './PricingSection';

const PROPERTY_TYPES = ['Entire Villa', 'Private Room', 'Shared Room', 'Apartment', 'Cottage'];

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

    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
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
        <Label htmlFor="room-property-type">Property Type</Label>
        <Select
          value={form.propertyType || undefined}
          disabled={readOnly}
          onValueChange={(v) => patch({ propertyType: v })}
        >
          <SelectTrigger id="room-property-type">
            <SelectValue placeholder="Select type" />
          </SelectTrigger>
          <SelectContent>
            {PROPERTY_TYPES.map((t) => (
              <SelectItem key={t} value={t}>{t}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
    </div>

    <div className="space-y-1.5">
      <Label htmlFor="room-size">Size (optional)</Label>
      <Input
        id="room-size"
        value={form.size}
        disabled={readOnly}
        onChange={(e) => patch({ size: e.target.value })}
        placeholder="e.g. 35 m²"
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
      <Label>Description (Rich Text)</Label>
      {readOnly ? (
        <div
          className="prose prose-sm max-w-none rounded-xl border border-gray-200 bg-gray-50 p-4 text-sm text-gray-600"
          dangerouslySetInnerHTML={{ __html: form.description || 'No description provided.' }}
        />
      ) : (
        <div className="quill-responsive-container overflow-hidden rounded-xl border border-gray-200 bg-gray-50">
          <ReactQuill
            theme="snow"
            value={form.description}
            onChange={(content) => patch({ description: content })}
            modules={quillModules}
            formats={quillFormats}
            className="bg-white"
          />
        </div>
      )}
      <style dangerouslySetInnerHTML={{ __html: QUILL_RESPONSIVE_CSS }} />
    </div>
  </div>
);

export default GeneralSection;
