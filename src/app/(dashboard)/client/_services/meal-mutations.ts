"use server";

import { executeAction } from "@/lib/executeAction";
import { mealSchema, MealSchema } from "../_types/mealSchema";
import db from "@/lib/db";
import { toNumberSafe } from "@/lib/utils";

const createMeal = async (data: MealSchema) => {
  await executeAction({
    actionFn: async () => {
      const validateData = mealSchema.parse(data);

      const meal = await db.meal.create({
        data: {
          userId: toNumberSafe(validateData.userId),
          dateTime: validateData.dateTime,
        },
      });

      await Promise.all(
        validateData.mealFoods.map(async (mealFood) => {
          await db.mealFoods.create({
            data: {
              mealId: meal.id,
              foodId: toNumberSafe(mealFood.foodId),
              servingUnitId: toNumberSafe(mealFood.servingUnitId),
              amount: toNumberSafe(mealFood.amount),
            },
          });
        }),
      );
    },
  });
};

const updateMeal = async (data: MealSchema) => {
  await executeAction({
    actionFn: async () => {
      const validateData = mealSchema.parse(data);
      if (validateData.action !== "update") return;
      await db.meal.update({
        where: { id: toNumberSafe(validateData.id) },
        data: {
          userId: toNumberSafe(validateData.userId),
          dateTime: validateData.dateTime,
        },
      });

      await db.mealFoods.deleteMany({
        where: {
          mealId: toNumberSafe(validateData.id),
        },
      });

      await Promise.all(
        validateData.mealFoods.map(async (mealFood) => {
          await db.mealFoods.create({
            data: {
              mealId: toNumberSafe(validateData.id),
              foodId: toNumberSafe(mealFood.foodId),
              servingUnitId: toNumberSafe(mealFood.servingUnitId),
              amount: toNumberSafe(mealFood.amount),
            },
          });
        }),
      );
    },
  });
};

const deleteMeal = async (id: number) => {
  await executeAction({
    actionFn: async () => {
      await db.meal.delete({
        where: { id: toNumberSafe(id) },
      });

      await db.mealFoods.deleteMany({
        where: {
          mealId: toNumberSafe(id),
        },
      });
    },
  });
};

export { createMeal, updateMeal, deleteMeal };
