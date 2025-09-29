"use server";

import { useMutation } from "@tanstack/react-query";
import { useRouter } from "next/router";
import { SignUpSchema } from "../_types/signUpSchema";
import { signUp } from "./mutations";
import { toast } from "sonner";

const useSignUp = () => {
  const router = useRouter();

  return useMutation({
    mutationFn: async (data: SignUpSchema) => {
      await signUp(data);
    },
    onSuccess: () => {
      toast.success("Signed up successfully.");
      router.replace("/sign-in");
    },
  });
};

export { useSignUp };
