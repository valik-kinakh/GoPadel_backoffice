"use client";
import Input from "@/components/form/input/InputField";
import Label from "@/components/form/Label";
import Button from "@/components/ui/button/Button";
import { EyeCloseIcon, EyeIcon } from "@/icons";
import { setSessionToken } from "@/lib/utils/auth/tokenStorage";
import { postApiAdminLogin } from "@/lib/webApi/generated/requests";
import Link from "next/link";
import React, { useState } from "react";
import { useTranslations } from "next-intl";
import { z } from "zod";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { useAdmin } from "@/context/AdminContext";

const signInSchema = z.object({
  email: z
    .string()
    .trim()
    .min(1, "Email is required")
    .email("Enter a valid email address"),
  password: z.string().min(1, "Password is required"),
  keepLoggedIn: z.boolean().optional(),
});

type SignInFormValues = z.infer<typeof signInSchema>;

export default function SignInForm() {
  const router = useRouter();
  const { setAdmin } = useAdmin();
  const [showPassword, setShowPassword] = useState(false);
  const [authError, setAuthError] = useState<string | null>(null);
  const {
    control,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<SignInFormValues>({
    resolver: zodResolver(signInSchema),
    defaultValues: {
      email: "",
      password: "",
      keepLoggedIn: false,
    },
  });

  const t = useTranslations('SignIn');

  const signInMutation = useMutation({
    mutationFn: async (values: SignInFormValues) => {
      const { payload, error, response } = await postApiAdminLogin(
        {
          email: values.email,
          password: values.password,
        },
        { skipAuth: true, safeFetch: true },
      );

      if (error) {
        throw error;
      }

      const token = payload?.token ?? null;
      const admin = payload?.admin ?? null;
      if (!token) {
        if (response?.status === 401) {
          throw new Error("Invalid email or password.");
        }
        throw new Error("Unable to sign in. Please try again.");
      }

      return { token, keepLoggedIn: Boolean(values.keepLoggedIn), admin };
    },
    onSuccess: async ({ token, keepLoggedIn, admin }) => {
      setAuthError(null);
      await setSessionToken(token, {
        maxAgeSeconds: keepLoggedIn ? 60 * 60 * 24 * 30 : undefined,
      });
      setAdmin(admin);
      router.push('/');
    },
    onError: (error) => {
      setAuthError(
        error instanceof Error
          ? error.message
          : "Unable to sign in. Please try again.",
      );
    },
  });

  const onSubmit = async (values: SignInFormValues) => {
    setAuthError(null);
    await signInMutation.mutateAsync(values);
  };

  return (
    <div className="flex flex-col flex-1 lg:w-1/2 w-full">
      <div className="flex flex-col justify-center flex-1 w-full max-w-md mx-auto">
        <div>
          <div className="mb-5 sm:mb-8">
            <h1 className="mb-2 font-semibold text-gray-800 text-title-sm dark:text-white/90 sm:text-title-md">
              {t('title')}
            </h1>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              {t('description')}
            </p>
          </div>
          <div>
            <form onSubmit={handleSubmit(onSubmit)}>
              <div className="space-y-6">
                <div>
                  <Label>
                    {t('email')} <span className="text-error-500">*</span>{" "}
                  </Label>
                  <Controller
                    name="email"
                    control={control}
                    render={({ field }) => {
                      const { ...fieldProps } = field;
                      return (
                        <Input
                          {...fieldProps}
                          placeholder="example@gmail.com"
                          type="email"
                          error={Boolean(errors.email)}
                          hint={errors.email?.message ? t('emailHint') : undefined}
                        />
                      );
                    }}
                  />
                </div>
                <div>
                  <Label>
                    {t('password')} <span className="text-error-500">*</span>{" "}
                  </Label>
                  <div className="relative">
                    <Controller
                      name="password"
                      control={control}
                      render={({ field }) => {
                        const { ...fieldProps } = field;
                        return (
                          <Input
                            {...fieldProps}
                            type={showPassword ? "text" : "password"}
                            placeholder={t('tip')}
                            error={Boolean(errors.password)}
                            hint={errors.password?.message ? t('passwordHint') : undefined}
                          />
                        );
                      }}
                    />
                    <span
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute z-30 -translate-y-1/2 cursor-pointer right-4 top-1/2"
                    >
                      {showPassword ? (
                        <EyeIcon className="fill-gray-500 dark:fill-gray-400" />
                      ) : (
                        <EyeCloseIcon className="fill-gray-500 dark:fill-gray-400" />
                      )}
                    </span>
                  </div>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                  </div>
                  <Link
                    href="/reset-password"
                    className="text-sm text-brand-500 hover:text-brand-600 dark:text-brand-400"
                  >
                    {t('forgotPassword')}
                  </Link>
                </div>
                {authError && (
                  <p className="text-sm text-error-500">{authError}</p>
                )}
                <div>
                  <Button
                    className="w-full"
                    size="sm"
                    disabled={isSubmitting || signInMutation.isPending}
                  >
                    {t('title')}
                  </Button>
                </div>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
