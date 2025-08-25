import { createStore } from "@/lib/createStore";

type State = {
  selectedCategoryId: number | null;
  categoryDialogOpen: boolean;
};
type Action = {
  updateSelectedCategoryId: (id: number | null) => void;
  updateCategoryDialogOpen: (open: boolean) => void;
};

type store = State & Action;

const useCategoryStore = createStore<store>((set) => ({
    selectedCategoryId: null,
    updateSelectedCategoryId: (id) => set({ selectedCategoryId: id }),
    categoryDialogOpen: false,
    updateCategoryDialogOpen: (is) => set({ categoryDialogOpen: is }),
}),{
    name: 'category-store'
});

export { useCategoryStore}