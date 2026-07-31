import { useState, useRef, useCallback, useEffect } from 'react';
import { toast } from 'react-hot-toast';
import api from '../../../api';
import { DEFAULT_ROOM_FORM, buildFormData, matchDate } from '../utils';

const MAX_IMAGES = 12;
const MAX_IMAGE_BYTES = 5 * 1024 * 1024;

const isHeic = (file) => {
  const fName = (file.name || '').toLowerCase();
  return fName.endsWith('.heic') || fName.endsWith('.heif')
    || file.type === 'image/heic' || file.type === 'image/heif';
};

/**
 * Room form state + image handling + payload building.
 * Extracted verbatim from the old RoomManagement monolith; behaviour is unchanged.
 */
export const useRoomForm = (initialForm = DEFAULT_ROOM_FORM) => {
  const [roomForm, setRoomForm] = useState(initialForm);
  const [roomImages, setRoomImages] = useState([]); // [{ file, label }]
  const [replacingTarget, setReplacingTarget] = useState(null); // { type: 'existing'|'new', index }
  const replaceInputRef = useRef(null);

  // Refs kept in sync so debounced/async savers always read the latest values.
  const formRef = useRef(roomForm);
  const imagesRef = useRef(roomImages);
  useEffect(() => { formRef.current = roomForm; }, [roomForm]);
  useEffect(() => { imagesRef.current = roomImages; }, [roomImages]);

  const resetForm = useCallback((next = DEFAULT_ROOM_FORM) => {
    setRoomForm(next);
    formRef.current = next;
    setRoomImages([]);
    imagesRef.current = [];
  }, []);

  const patch = useCallback((partial) => {
    setRoomForm((p) => (typeof partial === 'function' ? partial(p) : { ...p, ...partial }));
  }, []);

  // --- Images -------------------------------------------------------------
  const addFiles = useCallback((fileList) => {
    const filesArray = Array.from(fileList || []);
    const validFiles = [];
    let hasTooLarge = false;
    let hasHeicFile = false;
    for (const f of filesArray) {
      if (isHeic(f)) { hasHeicFile = true; continue; }
      if (f.size > MAX_IMAGE_BYTES) hasTooLarge = true;
      else validFiles.push({ file: f, label: '' });
    }
    if (hasHeicFile) toast.error('HEIC format is not supported.');
    if (hasTooLarge) toast.error('Image upload limit is 5MB only.');
    if (validFiles.length > 0) setRoomImages((p) => [...p, ...validFiles]);
    return validFiles.length;
  }, []);

  const triggerReplaceExisting = useCallback((idx) => {
    setReplacingTarget({ type: 'existing', index: idx });
    setTimeout(() => replaceInputRef.current?.click(), 50);
  }, []);

  const triggerReplaceNew = useCallback((idx) => {
    setReplacingTarget({ type: 'new', index: idx });
    setTimeout(() => replaceInputRef.current?.click(), 50);
  }, []);

  const handleReplaceFile = useCallback((e) => {
    const file = e.target.files?.[0];
    if (!file || !replacingTarget) return false;

    if (isHeic(file)) {
      toast.error('HEIC format is not supported.');
      e.target.value = '';
      setReplacingTarget(null);
      return false;
    }

    if (file.size > MAX_IMAGE_BYTES) {
      toast.error('Image upload limit is 5MB only.');
      e.target.value = '';
      setReplacingTarget(null);
      return false;
    }

    if (replacingTarget.type === 'existing') {
      const imgToReplace = roomForm.images[replacingTarget.index];
      setRoomForm((p) => ({
        ...p,
        images: p.images.filter((_, i) => i !== replacingTarget.index)
      }));
      setRoomImages((p) => [...p, { file, label: imgToReplace?.label || '' }]);
    } else if (replacingTarget.type === 'new') {
      setRoomImages((p) => p.map((img, i) => (i === replacingTarget.index ? { ...img, file } : img)));
    }

    e.target.value = '';
    setReplacingTarget(null);
    return true;
  }, [replacingTarget, roomForm.images]);

  const totalImageCount = (roomForm.images?.length || 0) + roomImages.length;
  const canAddMoreImages = totalImageCount < MAX_IMAGES;

  // --- Map link -----------------------------------------------------------
  const handleMapLinkChange = useCallback(async (val) => {
    setRoomForm((p) => ({ ...p, mapLink: val }));
    const trimmed = (val || '').trim();
    if (trimmed.startsWith('http') && (trimmed.includes('goo.gl') || trimmed.includes('maps.app.goo.gl'))) {
      try {
        const res = await api.get(`/rooms/admin/resolve-map?url=${encodeURIComponent(trimmed)}`);
        if (res.data?.resolvedUrl) {
          setRoomForm((p) => ({ ...p, mapLink: res.data.resolvedUrl }));
        }
      } catch (err) {
        console.error('Failed to resolve map redirect', err);
      }
    }
  }, []);

  // --- Per-day pricing ----------------------------------------------------
  const setCustomPrice = useCallback((dateStr, value) => {
    if (!dateStr) return false;
    if (value === '' || value === null || isNaN(Number(value))) {
      toast.error('Please enter a valid price');
      return false;
    }
    const priceNum = Number(value);
    setRoomForm((p) => {
      const existing = [...(p.datePrices || [])];
      const idx = existing.findIndex((dp) => matchDate(dp.date, dateStr));
      if (idx >= 0) existing[idx] = { ...existing[idx], price: priceNum };
      else existing.push({ date: dateStr, price: priceNum });
      return { ...p, datePrices: existing };
    });
    return true;
  }, []);

  const resetCustomPrice = useCallback((dateStr) => {
    if (!dateStr) return false;
    setRoomForm((p) => ({
      ...p,
      datePrices: (p.datePrices || []).filter((dp) => !matchDate(dp.date, dateStr))
    }));
    return true;
  }, []);

  // --- Date blocking ------------------------------------------------------
  const addBlockRange = useCallback((startDate, endDate, reason) => {
    if (!startDate || !endDate) {
      toast.error('Please select both start and end dates');
      return false;
    }
    if (new Date(startDate) > new Date(endDate)) {
      toast.error('Start date cannot be after end date');
      return false;
    }
    const newBlock = {
      startDate: new Date(startDate).toISOString(),
      endDate: new Date(endDate).toISOString(),
      reason: reason || 'Maintenance'
    };
    setRoomForm((p) => ({ ...p, blockedDates: [...(p.blockedDates || []), newBlock] }));
    return true;
  }, []);

  const removeBlockRange = useCallback((idx) => {
    setRoomForm((p) => ({ ...p, blockedDates: p.blockedDates.filter((_, i) => i !== idx) }));
  }, []);

  // --- Payload / validation ----------------------------------------------
  const build = useCallback(
    (status) => buildFormData(formRef.current, imagesRef.current, status),
    []
  );

  /** Publish rule (unchanged): name + category + price are required. */
  const validatePublish = useCallback(() => {
    const f = formRef.current;
    if (!String(f.name || '').trim() || !f.category || !f.price) {
      toast.error('Please fill required fields (name, category, price)');
      return false;
    }
    return true;
  }, []);

  return {
    roomForm, setRoomForm, patch, resetForm,
    roomImages, setRoomImages, addFiles,
    replacingTarget, replaceInputRef,
    triggerReplaceExisting, triggerReplaceNew, handleReplaceFile,
    totalImageCount, canAddMoreImages,
    handleMapLinkChange,
    setCustomPrice, resetCustomPrice,
    addBlockRange, removeBlockRange,
    build, validatePublish,
    formRef, imagesRef,
  };
};

export default useRoomForm;
