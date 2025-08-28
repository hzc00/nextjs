import { FoodCards } from "./_components/food-cards";
import { FoodFiltersDrawer } from "./_components/food-filters-drawer";
import { FoodFormDialog } from "./_components/food-form-dialog";

export default async function page() {
  return (
    <>
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-3xl font-semibold">Food List</h1>
        <FoodFormDialog />
      </div>
      <FoodFiltersDrawer />
      <FoodCards />
    </>
  );
}
