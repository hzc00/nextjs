"use client";
import { Button } from "@/components/ui/button";
import { Trash, Edit } from "lucide-react";
import { useCategoryMutations } from "@/app/(dashboard)/admin/foods-management/categories/_services/use-category-mutations";
import { useCategories } from "@/app/(dashboard)/admin/foods-management/categories/_services/use-category-queries";

export default function CategoryCards() {
  const deleteCategoryMutation = useCategoryMutations();
  const categoriesQuery = useCategories();
  return (
    <div className="grid grid-cols-4 gap-2">
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
              onClick={() => {}}
            >
              <Edit />
            </Button>
            <Button
              className="size-6"
              variant="ghost"
              size="icon"
              onClick={() => {
                deleteCategoryMutation.mutate(category.id);
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
