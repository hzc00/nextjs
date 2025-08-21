import { useMutation,useQueryClient } from "@tanstack/react-query"
import { deleteCategory } from "@/app/(dashboard)/admin/foods-management/categories/_services/categoryMutations"
import { toast } from "sonner"
const useCategoryMutations = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: async (id: number) => await deleteCategory(id),
        onSuccess: () => {
            toast.success('Category deleted successfully');
            queryClient.invalidateQueries({ queryKey: ['categories'] });
        },
    })

}
export {useCategoryMutations}