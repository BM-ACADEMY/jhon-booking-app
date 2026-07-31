import { MapPin } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { parseGoogleMapLink } from '../../utils';

/**
 * Address + Google Map link (with the goo.gl short-link resolve behaviour kept
 * in `useRoomForm.handleMapLinkChange`) — shared by the wizard's Location step
 * and the sheet's Advanced Settings section.
 */
export const LocationFields = ({ form, patch, readOnly = false, onMapLinkChange }) => (
  <div className="space-y-5">
    <div className="space-y-1.5">
      <Label htmlFor="room-address">Address</Label>
      <Input
        id="room-address"
        value={form.address}
        disabled={readOnly}
        onChange={(e) => patch({ address: e.target.value })}
        placeholder="Street / landmark"
      />
    </div>

    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
      <div className="space-y-1.5">
        <Label htmlFor="room-city">City</Label>
        <Input
          id="room-city"
          value={form.city}
          disabled={readOnly}
          onChange={(e) => patch({ city: e.target.value })}
        />
      </div>
      <div className="space-y-1.5">
        <Label htmlFor="room-state">State</Label>
        <Input
          id="room-state"
          value={form.state}
          disabled={readOnly}
          onChange={(e) => patch({ state: e.target.value })}
        />
      </div>
      <div className="space-y-1.5">
        <Label htmlFor="room-country">Country</Label>
        <Input
          id="room-country"
          value={form.country}
          disabled={readOnly}
          onChange={(e) => patch({ country: e.target.value })}
        />
      </div>
    </div>

    <div className="space-y-1.5">
      <Label htmlFor="room-map">Google Map Link / URL</Label>
      <Textarea
        id="room-map"
        rows={3}
        value={form.mapLink || ''}
        disabled={readOnly}
        onChange={(e) => onMapLinkChange?.(e.target.value)}
        className="resize-none"
        placeholder="Paste coordinates, place URL, or maps.app.goo.gl short link"
      />
    </div>

    {form.mapLink && (
      <div className="space-y-2">
        <Label>Map Preview</Label>
        <div className="h-48 w-full overflow-hidden rounded-2xl border border-gray-200 bg-gray-50 shadow-inner">
          <iframe
            title="Map preview"
            src={parseGoogleMapLink(form.mapLink)}
            width="100%"
            height="100%"
            style={{ border: 0 }}
            allowFullScreen=""
            loading="lazy"
          />
        </div>
      </div>
    )}
  </div>
);

/** Advanced settings accordion section: location details + property meta. */
const AdvancedSection = ({ form, patch, readOnly = false, onMapLinkChange }) => (
  <div className="space-y-6">
    <div>
      <h4 className="mb-4 flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-gray-500">
        <MapPin className="h-3.5 w-3.5 text-primary-500" /> Location
      </h4>
      <LocationFields
        form={form}
        patch={patch}
        readOnly={readOnly}
        onMapLinkChange={onMapLinkChange}
      />
    </div>
  </div>
);

export default AdvancedSection;
