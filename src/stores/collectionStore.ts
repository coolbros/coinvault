import { create } from 'zustand';
import { Specimen, Tag, ValuationRecord, ConditionAssessment } from '../db/schema';
import { specimenRepository, SpecimenFilterOptions, CollectionStatistics } from '../db/repositories/specimenRepository';
import { tagRepository } from '../db/repositories/tagRepository';
import { valuationRepository } from '../db/repositories/valuationRepository';
import { conditionRepository } from '../db/repositories/conditionRepository';

export interface CollectionState {
  specimens: Specimen[];
  tags: Tag[];
  selectedSpecimen: Specimen | null;
  statistics: CollectionStatistics | null;
  isLoading: boolean;
  viewMode: 'grid' | 'list';
  isMultiSelectMode: boolean;
  selectedSpecimenIds: string[];

  // Filter & Search states
  searchQuery: string;
  selectedCountry?: string;
  selectedMetal?: string;
  selectedEra?: string;
  selectedCondition?: string;
  selectedTagId?: string;
  yearMin?: number;
  yearMax?: number;
  isFavoriteFilter: boolean;
  sortBy: 'created_at' | 'year' | 'value' | 'country' | 'denomination' | 'grade';
  sortOrder: 'asc' | 'desc';

  // Actions
  loadSpecimens: () => void;
  loadTags: () => void;
  refreshStatistics: () => void;
  selectSpecimen: (id: string | null) => void;
  getSpecimenById: (id: string) => Specimen | null;
  getSpecimenHistory: (id: string) => { valuations: ValuationRecord[]; conditions: ConditionAssessment[] };
  updateSpecimenDetails: (id: string, updates: Partial<Specimen>) => Specimen | null;
  setViewMode: (mode: 'grid' | 'list') => void;
  setSearchQuery: (query: string) => void;
  setFilters: (filters: Partial<SpecimenFilterOptions>) => void;
  resetFilters: () => void;
  toggleFavorite: (id: string) => void;
  deleteSpecimen: (id: string) => boolean;
  duplicateSpecimen: (id: string) => Specimen | null;

  // Multi-select actions
  toggleMultiSelectMode: (enabled?: boolean) => void;
  toggleSelectSpecimenId: (id: string) => void;
  selectAllSpecimens: () => void;
  clearSelectedSpecimens: () => void;
  deleteSelectedSpecimens: () => number;
}

export const useCollectionStore = create<CollectionState>((set, get) => ({
  specimens: [],
  tags: [],
  selectedSpecimen: null,
  statistics: null,
  isLoading: false,
  viewMode: 'grid',
  isMultiSelectMode: false,
  selectedSpecimenIds: [],

  searchQuery: '',
  selectedCountry: undefined,
  selectedMetal: undefined,
  selectedEra: undefined,
  selectedCondition: undefined,
  selectedTagId: undefined,
  yearMin: undefined,
  yearMax: undefined,
  isFavoriteFilter: false,
  sortBy: 'created_at',
  sortOrder: 'desc',

  loadSpecimens: () => {
    set({ isLoading: true });
    try {
      const {
        searchQuery,
        selectedCountry,
        selectedMetal,
        selectedCondition,
        selectedTagId,
        yearMin,
        yearMax,
        isFavoriteFilter,
        sortBy,
        sortOrder,
      } = get();

      const filterOptions: SpecimenFilterOptions = {
        search: searchQuery || undefined,
        country: selectedCountry,
        metal: selectedMetal,
        condition: selectedCondition,
        tagId: selectedTagId,
        yearMin,
        yearMax,
        isFavorite: isFavoriteFilter || undefined,
        sortBy,
        sortOrder,
      };

      const specimens = specimenRepository.list(filterOptions);
      const statistics = specimenRepository.getCollectionStatistics();
      set({ specimens, statistics, isLoading: false });
    } catch (err) {
      console.error('Error loading specimens:', err);
      set({ isLoading: false });
    }
  },

  loadTags: () => {
    try {
      const tags = tagRepository.listAll();
      set({ tags });
    } catch (err) {
      console.error('Error loading tags:', err);
    }
  },

  refreshStatistics: () => {
    try {
      const statistics = specimenRepository.getCollectionStatistics();
      set({ statistics });
    } catch (err) {
      console.error('Error refreshing statistics:', err);
    }
  },

  selectSpecimen: (id: string | null) => {
    if (!id) {
      set({ selectedSpecimen: null });
      return;
    }
    const specimen = specimenRepository.getById(id);
    set({ selectedSpecimen: specimen });
  },

  getSpecimenById: (id: string) => {
    const specimen = specimenRepository.getById(id);
    if (specimen) {
      set({ selectedSpecimen: specimen });
    }
    return specimen;
  },

  getSpecimenHistory: (id: string) => {
    const valuations = valuationRepository.getHistoryForSpecimen(id);
    const conditions = conditionRepository.getHistoryForSpecimen(id);
    return { valuations, conditions };
  },

  updateSpecimenDetails: (id: string, updates: Partial<Specimen>) => {
    const updated = specimenRepository.update(id, updates);
    if (updated) {
      set({ selectedSpecimen: updated });
      get().loadSpecimens();
    }
    return updated;
  },

  setViewMode: (viewMode: 'grid' | 'list') => set({ viewMode }),

  setSearchQuery: (searchQuery: string) => {
    set({ searchQuery });
    get().loadSpecimens();
  },

  setFilters: (filters: Partial<SpecimenFilterOptions>) => {
    set((state) => ({
      ...state,
      selectedCountry: filters.country !== undefined ? filters.country : state.selectedCountry,
      selectedMetal: filters.metal !== undefined ? filters.metal : state.selectedMetal,
      selectedCondition: filters.condition !== undefined ? filters.condition : state.selectedCondition,
      selectedTagId: filters.tagId !== undefined ? filters.tagId : state.selectedTagId,
      yearMin: filters.yearMin !== undefined ? filters.yearMin : state.yearMin,
      yearMax: filters.yearMax !== undefined ? filters.yearMax : state.yearMax,
      isFavoriteFilter: filters.isFavorite !== undefined ? filters.isFavorite : state.isFavoriteFilter,
      sortBy: filters.sortBy !== undefined ? filters.sortBy : state.sortBy,
      sortOrder: filters.sortOrder !== undefined ? filters.sortOrder : state.sortOrder,
    }));
    get().loadSpecimens();
  },

  resetFilters: () => {
    set({
      searchQuery: '',
      selectedCountry: undefined,
      selectedMetal: undefined,
      selectedEra: undefined,
      selectedCondition: undefined,
      selectedTagId: undefined,
      yearMin: undefined,
      yearMax: undefined,
      isFavoriteFilter: false,
      sortBy: 'created_at',
      sortOrder: 'desc',
    });
    get().loadSpecimens();
  },

  toggleFavorite: (id: string) => {
    specimenRepository.toggleFavorite(id);
    get().loadSpecimens();
  },

  deleteSpecimen: (id: string) => {
    const success = specimenRepository.delete(id);
    if (success) {
      get().loadSpecimens();
      if (get().selectedSpecimen?.id === id) {
        set({ selectedSpecimen: null });
      }
    }
    return success;
  },

  duplicateSpecimen: (id: string) => {
    const copy = specimenRepository.duplicate(id);
    if (copy) {
      get().loadSpecimens();
    }
    return copy;
  },

  toggleMultiSelectMode: (enabled) => {
    const newMode = enabled !== undefined ? enabled : !get().isMultiSelectMode;
    set({
      isMultiSelectMode: newMode,
      selectedSpecimenIds: newMode ? get().selectedSpecimenIds : [],
    });
  },

  toggleSelectSpecimenId: (id: string) => {
    const current = get().selectedSpecimenIds;
    if (current.includes(id)) {
      set({ selectedSpecimenIds: current.filter((x) => x !== id) });
    } else {
      set({ selectedSpecimenIds: [...current, id] });
    }
  },

  selectAllSpecimens: () => {
    set({ selectedSpecimenIds: get().specimens.map((s) => s.id) });
  },

  clearSelectedSpecimens: () => {
    set({ selectedSpecimenIds: [] });
  },

  deleteSelectedSpecimens: () => {
    const ids = get().selectedSpecimenIds;
    if (ids.length === 0) return 0;
    const count = specimenRepository.bulkDelete(ids);
    set({ isMultiSelectMode: false, selectedSpecimenIds: [] });
    get().loadSpecimens();
    return count;
  },
}));
