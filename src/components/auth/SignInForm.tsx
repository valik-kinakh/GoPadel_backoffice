"use client";
import Checkbox from "@/components/form/input/Checkbox";
import Input from "@/components/form/input/InputField";
import Label from "@/components/form/Label";
import Button from "@/components/ui/button/Button";
import { EyeCloseIcon, EyeIcon } from "@/icons";
import Link from "next/link";
import React, { useState } from "react";
import { useTranslations } from "next-intl";
import { z } from "zod";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";

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
  const [showPassword, setShowPassword] = useState(false);
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

  const onSubmit = async (values: SignInFormValues) => {
    // TODO: Wire up API login + session token storage.
    // Keeping this placeholder to avoid changing auth flow behavior.
    console.log("Sign in", values);
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
                    <Controller
                      name="keepLoggedIn"
                      control={control}
                      render={({ field }) => (
                        <Checkbox
                          checked={Boolean(field.value)}
                          onChange={field.onChange}
                        />
                      )}
                    />
                    <span className="block font-normal text-gray-700 text-theme-sm dark:text-gray-400">
                      {t('keepLoggedIn')}
                    </span>
                  </div>
                  <Link
                    href="/reset-password"
                    className="text-sm text-brand-500 hover:text-brand-600 dark:text-brand-400"
                  >
                    {t('forgotPassword')}
                  </Link>
                </div>
                <div>
                  <Button className="w-full" size="sm" disabled={isSubmitting}>
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
