"use server";

import {
  type SignUpSchema,
  signUpSchema,
} from "@/app/(auth)/sign-up/_types/signUpSchema";
import db from "@/lib/db";
import { executeAction } from "@/lib/executeAction";
import { hashPassword } from "@/lib/utils";

const signUp = async (data: SignUpSchema) => {
  await executeAction({
    actionFn: async () => {
      const validatedData = signUpSchema.parse(data);
      const hashedPassword = hashPassword(validatedData.password);

      await db.user.create({
        data: {
          name: validatedData.name,
          email: validatedData.email,
          password: await hashedPassword,
        },
      });
    },
  });
};

export { signUp };
