"use client";
import Input from "@/components/form/input/InputField";
import Label from "@/components/form/Label";
import Button from "@/components/ui/button/Button";
import { useTranslations } from "next-intl";
import { useMemo, useState } from "react";
import { z } from "zod";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation } from "@tanstack/react-query";
import { postApiAdminPasswordRecover } from "@/lib/webApi/generated/requests";
import { useRouter } from "next/navigation";

export default function ResetPasswordForm() {
  const t = useTranslations("ResetPassword");
  const router = useRouter();
  const [statusMessage, setStatusMessage] = useState<{
    type: "success" | "error";
    text: string;
  } | null>(null);

  const resetSchema = useMemo(
    () =>
      z.object({
        email: z
          .string()
          .trim()
          .min(1, t("emailRequired"))
          .email(t("emailHint")),
      }),
    [t],
  );

  type ResetPasswordFormValues = z.infer<typeof resetSchema>;

  const {
    control,
    handleSubmit,
    formState: { errors, isSubmitting },
    reset,
  } = useForm<ResetPasswordFormValues>({
    resolver: zodResolver(resetSchema),
    defaultValues: {
      email: "",
    },
  });

  const recoverMutation = useMutation({
    mutationFn: async (values: ResetPasswordFormValues) => {
      const { error } = await postApiAdminPasswordRecover(
        { email: values.email },
        { skipAuth: true, safeFetch: true },
      );

      if (error) {
        throw error;
      }
    },
    onSuccess: () => {
      setStatusMessage({ type: "success", text: t("success") });
      reset({ email: "" });
      router.push("/signin");
    },
    onError: (error) => {
      setStatusMessage({
        type: "error",
        text: error instanceof Error ? error.message : t("error"),
      });
    },
  });

  const onSubmit = async (values: ResetPasswordFormValues) => {
    setStatusMessage(null);
    await recoverMutation.mutateAsync(values);
  };

  return (
    <div className="flex flex-col flex-1 lg:w-1/2 w-full">
      <div className="flex flex-col justify-center flex-1 w-full max-w-md mx-auto">
        <div>
          <div className="mb-5 sm:mb-8">
            <h1 className="mb-2 font-semibold text-gray-800 text-title-sm dark:text-white/90 sm:text-title-md">
              {t("title")}
            </h1>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              {t("description")}
            </p>
          </div>
          <form onSubmit={handleSubmit(onSubmit)}>
            <div className="space-y-6">
              <div>
                <Label>
                  {t("email")} <span className="text-error-500">*</span>{" "}
                </Label>
                <Controller
                  name="email"
                  control={control}
                  render={({ field }) => {
                    const { ...fieldProps } = field;
                    return (
                      <Input
                        {...fieldProps}
                        type="email"
                        placeholder="example@gmail.com"
                        error={Boolean(errors.email)}
                        hint={errors.email?.message}
                      />
                    );
                  }}
                />
              </div>
              {statusMessage && (
                <p
                  className={
                    statusMessage.type === "success"
                      ? "text-sm text-success-500"
                      : "text-sm text-error-500"
                  }
                >
                  {statusMessage.text}
                </p>
              )}
              <Button
                className="w-full"
                size="sm"
                disabled={isSubmitting || recoverMutation.isPending}
              >
                {t("submit")}
              </Button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
