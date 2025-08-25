'use server'
import db from "@/lib/db";
import { executeAction } from "@/lib/executeAction";
import { CategorySchema } from "../_types/schema";
const deleteCategory = async (id: number) => {
  await executeAction({
    actionFn: async () => {
     await  db.category.delete({ where: { id } });
    },
  });
};

const createCategory = async (data: CategorySchema) => {
  await executeAction({
    actionFn: async () => {
      await db.category.create({ data: {name:data.name} });
    },
  });
};

const updateCategory = async (data: CategorySchema) => {
  if(data.action !== 'update') return 
  await executeAction({
    actionFn: async () => {
      await db.category.update({ where: { id: Number(data.id) }, data: {name:data.name} });
    },
  });
};

export { deleteCategory ,createCategory,updateCategory};