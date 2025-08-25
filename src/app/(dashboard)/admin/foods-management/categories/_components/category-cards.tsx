"use client";
import { Button } from "@/components/ui/button";
import { Trash, Edit } from "lucide-react";
import { useDeleteCategory } from "@/app/(dashboard)/admin/foods-management/categories/_services/use-category-mutations";
import { useCategories } from "@/app/(dashboard)/admin/foods-management/categories/_services/use-category-queries";
import { alert } from "@/lib/use-global-store";
import { useCategoryStore } from "@/app/(dashboard)/admin/foods-management/categories/_libs/use-category-store";

export default function CategoryCards() {
  const { updateSelectedCategoryId, updateCategoryDialogOpen } =
    useCategoryStore();
  const deleteCategoryMutation = useDeleteCategory();
  const categoriesQuery = useCategories();
  return (
    <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
      {categoriesQuery.data?.map((category) => (
        <div
          className="bg-accent flex flex-col justify-between gap-3 rounded-lg p-6 shadow-md"
          key={category.id}
        >
          <p className="truncate">{category.name}</p>
          <div className="flex gap-1">
            <Button
              className="size-6"
              variant="ghost"
              size="icon"
              onClick={() => {
                updateSelectedCategoryId(category.id);
                updateCategoryDialogOpen(true);
              }}
            >
              <Edit />
            </Button>
            <Button
              className="size-6"
              variant="ghost"
              size="icon"
              onClick={() => {
                alert({
                  onConfirm: () => deleteCategoryMutation.mutate(category.id),
                });
              }}
            >
              <Trash />
            </Button>
          </div>
        </div>
      ))}
    </div>
  );
}
