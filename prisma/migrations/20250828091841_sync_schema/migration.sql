/*
  Warnings:

  - You are about to drop the column `amount` on the `FoodServingUnit` table. All the data in the column will be lost.

*/
-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_FoodServingUnit" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "foodId" INTEGER NOT NULL,
    "servingUnitId" INTEGER NOT NULL,
    "grams" REAL NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "FoodServingUnit_foodId_fkey" FOREIGN KEY ("foodId") REFERENCES "Food" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "FoodServingUnit_servingUnitId_fkey" FOREIGN KEY ("servingUnitId") REFERENCES "ServingUnit" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
INSERT INTO "new_FoodServingUnit" ("createdAt", "foodId", "grams", "id", "servingUnitId", "updatedAt") SELECT "createdAt", "foodId", "grams", "id", "servingUnitId", "updatedAt" FROM "FoodServingUnit";
DROP TABLE "FoodServingUnit";
ALTER TABLE "new_FoodServingUnit" RENAME TO "FoodServingUnit";
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
