'use server';

import db from '@/lib/db';
import { CategorySchema } from '@/app/(dashboard)/admin/foods-management/categories/_types/schema';
const getCategories = async () => {
    return await db.category.findMany();
}

const getCategory = async (id: number):Promise<CategorySchema> => {
    const res = await db.category.findUnique({ where: { id } });
    return {
        id,
        name: res?.name ??'',
        action: 'update'
    }
}
export  {getCategories,getCategory}