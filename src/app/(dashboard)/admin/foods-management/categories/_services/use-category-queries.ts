import { getCategories, getCategory } from "@/app/(dashboard)/admin/foods-management/categories/_services/categoryQueries";
import { useQuery } from "@tanstack/react-query";
import { useCategoryStore } from "@/app/(dashboard)/admin/foods-management/categories/_libs/use-category-store";

const useCategories = () => {
    return useQuery({
        queryKey: ["categories"],
        queryFn:  getCategories,
    })
}
const useCategory  = () => {
    const {selectedCategoryId}   =  useCategoryStore();
    return useQuery({
        queryKey: ["category",{selectedCategoryId}],
        queryFn:  () => getCategory(selectedCategoryId!),
        enabled: !!selectedCategoryId
    })
}
export{useCategories,useCategory}