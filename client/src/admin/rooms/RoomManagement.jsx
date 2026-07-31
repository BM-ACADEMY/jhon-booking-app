import { useCallback, useEffect, useMemo, useState } from 'react';
import { FolderPlus, Plus } from 'lucide-react';
import { toast } from 'react-hot-toast';
import { Button } from '@/components/ui/button';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import api from '../../api';
import { roomToForm } from './utils';
import RoomSidebar from './components/RoomSidebar';
import RoomCalendarPanel from './components/RoomCalendarPanel';
import RoomConfigSheet from './components/RoomConfigSheet';
import AddRoomWizard from './components/AddRoomWizard';
import DraftResumeDialog from './components/DraftResumeDialog';
import CategoryDialog from './components/CategoryDialog';
import CategoryDeleteDialog from './components/CategoryDeleteDialog';
import RoomDeleteDialog from './components/RoomDeleteDialog';
import RoomPreviewDialog from './components/RoomPreviewDialog';
import PriceUnitDialog from './components/PriceUnitDialog';
import SettingsPanel from './components/SettingsPanel';

const RoomManagement = () => {
  // --- Data ---------------------------------------------------------------
  const [rooms, setRooms] = useState([]);
  const [categories, setCategories] = useState([]);
  const [priceUnits, setPriceUnits] = useState([]);
  const [loadingRooms, setLoadingRooms] = useState(true);

  // --- Browsing -----------------------------------------------------------
  const [activeMainTab, setActiveMainTab] = useState('rooms');
  const [search, setSearch] = useState('');
  const [activeCategory, setActiveCategory] = useState('All');
  const [selectedRoomId, setSelectedRoomId] = useState(null);

  // --- Config sheet -------------------------------------------------------
  const [sheetOpen, setSheetOpen] = useState(false);
  const [sheetSection, setSheetSection] = useState('general');
  const [selectedDates, setSelectedDates] = useState(null);

  // --- Wizard / draft -----------------------------------------------------
  const [wizardOpen, setWizardOpen] = useState(false);
  const [wizardInitialForm, setWizardInitialForm] = useState(null);
  const [wizardDraftId, setWizardDraftId] = useState(null);
  const [draftPrompt, setDraftPrompt] = useState(null);

  // --- Dialogs ------------------------------------------------------------
  const [catDialogOpen, setCatDialogOpen] = useState(false);
  const [editCatTarget, setEditCatTarget] = useState(null);
  const [deleteCatTarget, setDeleteCatTarget] = useState(null);
  const [deleteRoomTarget, setDeleteRoomTarget] = useState(null);
  const [viewRoomTarget, setViewRoomTarget] = useState(null);
  const [unitDialogOpen, setUnitDialogOpen] = useState(false);
  const [editUnitTarget, setEditUnitTarget] = useState(null);

  const fetchData = useCallback(async () => {
    try {
      setLoadingRooms(true);
      const [roomsRes, catsRes, unitsRes] = await Promise.all([
        api.get('/rooms/admin/all'),
        api.get('/categories'),
        api.get('/price-units'),
      ]);
      setRooms(roomsRes.data);
      setCategories(catsRes.data);
      setPriceUnits(unitsRes.data);
    } catch (err) {
      toast.error('Failed to load data');
    } finally {
      setLoadingRooms(false);
    }
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  const filteredRooms = useMemo(() => rooms.filter((r) => {
    const matchSearch = (r.name || '').toLowerCase().includes(search.toLowerCase());
    const matchCat = activeCategory === 'All' || r.category === activeCategory;
    return matchSearch && matchCat;
  }), [rooms, search, activeCategory]);

  const selectedRoom = useMemo(
    () => rooms.find((r) => r._id === selectedRoomId) || null,
    [rooms, selectedRoomId]
  );

  const getCatColor = useCallback((catName) => {
    const cat = categories.find((c) => c.name === catName);
    return cat ? cat.color : 'bg-gray-100 text-gray-700';
  }, [categories]);

  // --- Rooms --------------------------------------------------------------
  const handleSelectRoom = (room) => {
    setSelectedRoomId(room._id);
    setSelectedDates(null);
  };

  const openConfig = (room, section = 'general') => {
    setSelectedRoomId(room._id);
    setSheetSection(section);
    setSheetOpen(true);
  };

  const handleRangeSelect = (range) => {
    setSelectedDates(range);
    if (range && selectedRoom) {
      setSheetSection('pricing');
      setSheetOpen(true);
    }
  };

  // --- Wizard / draft -----------------------------------------------------
  const openWizard = async () => {
    setWizardInitialForm(null);
    setWizardDraftId(null);
    try {
      const res = await api.get('/rooms/admin/draft');
      if (res.data?._id) {
        setDraftPrompt(res.data);
        return; // show resume prompt instead of opening the wizard
      }
    } catch (_) { /* no draft found */ }
    setWizardOpen(true);
  };

  const resumeDraft = (draft) => {
    setDraftPrompt(null);
    setWizardInitialForm(roomToForm(draft, categories[0]?.name || ''));
    setWizardDraftId(draft._id);
    setWizardOpen(true);
  };

  const discardDraftAndCreate = () => {
    setDraftPrompt(null);
    setWizardInitialForm(null);
    setWizardDraftId(null);
    setWizardOpen(true);
  };

  // --- Categories ---------------------------------------------------------
  const openCatCreate = () => { setEditCatTarget(null); setCatDialogOpen(true); };
  const openCatEdit = (cat) => { setEditCatTarget(cat); setCatDialogOpen(true); };

  return (
    <div className="space-y-6">
      {/* Page header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-black tracking-tight text-gray-900">Property Management</h1>
          <p className="mt-1 text-xs font-bold uppercase tracking-widest text-gray-500">
            Control your listings and configurations
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Tabs value={activeMainTab} onValueChange={setActiveMainTab}>
            <TabsList>
              <TabsTrigger value="rooms">Rooms</TabsTrigger>
              <TabsTrigger value="settings">Settings</TabsTrigger>
            </TabsList>
          </Tabs>
          <Button variant="outline" onClick={openCatCreate}>
            <FolderPlus className="mr-1.5 h-4 w-4" /> Add Category
          </Button>
          <Button onClick={openWizard}>
            <Plus className="mr-1.5 h-4 w-4" /> Add Room
          </Button>
        </div>
      </div>

      {activeMainTab === 'rooms' ? (
        <div className="grid gap-5 lg:grid-cols-[340px_minmax(0,1fr)]">
          <div className="lg:h-[calc(100vh-13rem)]">
            <RoomSidebar
              rooms={filteredRooms}
              categories={categories}
              loading={loadingRooms}
              search={search}
              onSearchChange={setSearch}
              activeCategory={activeCategory}
              onCategoryChange={setActiveCategory}
              selectedRoomId={selectedRoomId}
              onSelectRoom={handleSelectRoom}
              onViewRoom={setViewRoomTarget}
              onConfigureRoom={(room) => openConfig(room, 'general')}
              onDeleteRoom={setDeleteRoomTarget}
              onEditCategory={openCatEdit}
              onDeleteCategory={setDeleteCatTarget}
              getCatColor={getCatColor}
            />
          </div>

          <RoomCalendarPanel
            room={selectedRoom}
            onRangeSelect={handleRangeSelect}
            onOpenSection={(section) => selectedRoom && openConfig(selectedRoom, section)}
          />
        </div>
      ) : (
        <SettingsPanel
          priceUnits={priceUnits}
          categories={categories}
          onAddUnit={() => { setEditUnitTarget(null); setUnitDialogOpen(true); }}
          onEditUnit={(u) => { setEditUnitTarget(u); setUnitDialogOpen(true); }}
          onUnitsChanged={fetchData}
          onAddCategory={openCatCreate}
          onEditCategory={openCatEdit}
          onDeleteCategory={setDeleteCatTarget}
        />
      )}

      {/* Sliding room configuration (autosaves) */}
      <RoomConfigSheet
        open={sheetOpen}
        onOpenChange={setSheetOpen}
        room={selectedRoom}
        categories={categories}
        priceUnits={priceUnits}
        selectedDates={selectedDates}
        defaultSection={sheetSection}
        onSaved={fetchData}
        onManageUnits={() => { setEditUnitTarget(null); setUnitDialogOpen(true); }}
      />

      {/* Add Room wizard + draft resume */}
      <AddRoomWizard
        open={wizardOpen}
        onOpenChange={setWizardOpen}
        categories={categories}
        priceUnits={priceUnits}
        initialForm={wizardInitialForm}
        initialDraftId={wizardDraftId}
        onSaved={fetchData}
        onManageUnits={() => { setEditUnitTarget(null); setUnitDialogOpen(true); }}
      />
      <DraftResumeDialog
        draft={draftPrompt}
        onOpenChange={setDraftPrompt}
        onResume={resumeDraft}
        onDiscard={discardDraftAndCreate}
      />

      {/* Categories */}
      <CategoryDialog
        open={catDialogOpen}
        onOpenChange={setCatDialogOpen}
        editTarget={editCatTarget}
        onSaved={fetchData}
      />
      <CategoryDeleteDialog
        target={deleteCatTarget}
        onOpenChange={setDeleteCatTarget}
        onDeleted={(cat) => {
          setDeleteCatTarget(null);
          if (activeCategory === cat.name) setActiveCategory('All');
          fetchData();
        }}
      />

      {/* Rooms */}
      <RoomDeleteDialog
        target={deleteRoomTarget}
        onOpenChange={setDeleteRoomTarget}
        onDeleted={(room) => {
          setDeleteRoomTarget(null);
          if (selectedRoomId === room._id) {
            setSelectedRoomId(null);
            setSheetOpen(false);
          }
          fetchData();
        }}
      />
      <RoomPreviewDialog
        room={viewRoomTarget}
        categories={categories}
        onOpenChange={setViewRoomTarget}
        onConfigure={(room) => { setViewRoomTarget(null); openConfig(room, 'general'); }}
      />

      {/* Price units */}
      <PriceUnitDialog
        open={unitDialogOpen}
        onOpenChange={setUnitDialogOpen}
        editTarget={editUnitTarget}
        onSaved={fetchData}
      />
    </div>
  );
};

export default RoomManagement;
