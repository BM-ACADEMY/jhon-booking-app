import { Edit2, Image as ImageIcon, Trash2 } from 'lucide-react';
import { imageSrc } from '../../utils';

/**
 * Photo grid: existing (persisted) images + local previews for newly picked
 * files, per-image labels, replace-in-place and delete. 5MB limit / no HEIC /
 * 12 images max are enforced in `useRoomForm` exactly as before.
 *
 * `imageApi` is the object returned by useRoomForm; `onDirty` lets the
 * autosaving config sheet know something changed.
 */
const GallerySection = ({ form, patch, imageApi = {}, readOnly = false, onDirty }) => {
  const {
    roomImages, setRoomImages, addFiles,
    triggerReplaceExisting, triggerReplaceNew, handleReplaceFile,
    replaceInputRef, canAddMoreImages,
  } = imageApi;

  const markDirty = () => onDirty?.();

  if (readOnly) {
    return (
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
        {(form.images || []).map((img, idx) => (
          <div key={idx} className="relative overflow-hidden rounded-xl border border-gray-100 shadow-sm">
            <img src={imageSrc(img)} alt={img.label || 'Photo'} className="aspect-[4/3] w-full object-cover" />
            {img.label && (
              <div className="absolute bottom-1.5 left-1.5 rounded-lg bg-black/50 px-2 py-0.5 text-[9px] font-bold text-white backdrop-blur-sm">
                {img.label}
              </div>
            )}
          </div>
        ))}
        {(!form.images || form.images.length === 0) && (
          <p className="col-span-full py-6 text-center text-[10px] font-bold uppercase tracking-widest text-gray-400">
            No photos uploaded.
          </p>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
        {/* Existing images */}
        {(form.images || []).map((img, idx) => (
          <div key={idx} className="flex flex-col gap-2 rounded-2xl border border-gray-100 bg-gray-50 p-2.5">
            <div className="group relative aspect-[4/3] overflow-hidden rounded-xl shadow-sm">
              <img src={imageSrc(img)} alt="Preview" className="h-full w-full object-cover" />
              <div className="absolute inset-0 flex items-center justify-center gap-2 bg-black/40 opacity-0 transition-opacity group-hover:opacity-100">
                <button
                  type="button"
                  title="Replace Image"
                  onClick={() => triggerReplaceExisting(idx)}
                  className="cursor-pointer rounded-xl bg-blue-500 p-2 text-white shadow-lg transition-all hover:bg-blue-600"
                >
                  <Edit2 className="h-4 w-4" />
                </button>
                <button
                  type="button"
                  title="Delete Image"
                  onClick={() => {
                    patch((p) => ({ ...p, images: p.images.filter((_, i) => i !== idx) }));
                    markDirty();
                  }}
                  className="cursor-pointer rounded-xl bg-red-500 p-2 text-white shadow-lg transition-all hover:bg-red-600"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            </div>
            <input
              type="text"
              placeholder="Image label (e.g. Kitchen)"
              value={img.label || ''}
              onChange={(e) => {
                const value = e.target.value;
                patch((p) => {
                  const next = [...p.images];
                  next[idx] = { ...next[idx], label: value };
                  return { ...p, images: next };
                });
              }}
              className="rounded-lg border border-gray-200 bg-white px-2.5 py-1.5 text-[10px] font-bold outline-none focus:border-primary-500"
            />
          </div>
        ))}

        {/* Local previews (not uploaded yet) */}
        {roomImages.map((imgObj, idx) => (
          <div key={`new-${idx}`} className="flex flex-col gap-2 rounded-2xl border border-primary-100 bg-primary-50/40 p-2.5">
            <div className="group relative aspect-[4/3] overflow-hidden rounded-xl shadow-sm">
              <img src={URL.createObjectURL(imgObj.file)} alt="New Preview" className="h-full w-full object-cover" />
              <div className="absolute inset-0 flex items-center justify-center gap-2 bg-black/40 opacity-0 transition-opacity group-hover:opacity-100">
                <button
                  type="button"
                  title="Replace Image"
                  onClick={() => triggerReplaceNew(idx)}
                  className="cursor-pointer rounded-xl bg-blue-500 p-2 text-white shadow-lg transition-all hover:bg-blue-600"
                >
                  <Edit2 className="h-4 w-4" />
                </button>
                <button
                  type="button"
                  title="Delete Image"
                  onClick={() => { setRoomImages((p) => p.filter((_, i) => i !== idx)); markDirty(); }}
                  className="cursor-pointer rounded-xl bg-red-500 p-2 text-white shadow-lg transition-all hover:bg-red-600"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            </div>
            <input
              type="text"
              placeholder="New label..."
              value={imgObj.label || ''}
              onChange={(e) => {
                const value = e.target.value;
                setRoomImages((p) => p.map((im, i) => (i === idx ? { ...im, label: value } : im)));
              }}
              className="rounded-lg border border-primary-200 bg-white px-2.5 py-1.5 text-[10px] font-bold outline-none focus:border-primary-500"
            />
          </div>
        ))}

        {canAddMoreImages && (
          <label className="group flex aspect-[4/3] cursor-pointer flex-col items-center justify-center rounded-2xl border-2 border-dashed border-gray-200 text-gray-400 transition-all hover:border-primary-500 hover:bg-primary-50/30 hover:text-primary-500">
            <div className="mb-2 flex h-10 w-10 items-center justify-center rounded-full bg-gray-50 transition-transform group-hover:scale-110">
              <ImageIcon className="h-5 w-5" />
            </div>
            <span className="text-[10px] font-black uppercase tracking-widest">Add Photo</span>
            <input
              type="file"
              multiple
              accept="image/*"
              className="hidden"
              onChange={(e) => {
                const added = addFiles(e.target.files);
                e.target.value = '';
                if (added) markDirty();
              }}
            />
          </label>
        )}
      </div>

      <input
        type="file"
        ref={replaceInputRef}
        accept="image/*"
        className="hidden"
        onChange={(e) => { if (handleReplaceFile(e)) markDirty(); }}
      />

      <p className="text-center text-[10px] font-bold uppercase tracking-widest text-gray-400">
        Assign labels like &quot;Master Bedroom&quot; or &quot;Dining Area&quot; to help guests orient themselves.
      </p>
    </div>
  );
};

export default GallerySection;
