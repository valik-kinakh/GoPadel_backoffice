"use client";

import React, { useState } from "react";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useTranslations } from "next-intl";
import { useRouter } from "next/navigation";
import Input from "@/components/form/input/InputField";
import Label from "@/components/form/Label";
import Select from "@/components/form/Select";
import Button from "@/components/ui/button/Button";
import { EyeCloseIcon, EyeIcon } from "@/icons";

// Define the form schema with zod
const createAdminUserSchema = z.object({
  email: z
    .string()
    .trim()
    .min(1, "emailRequired")
    .email("emailInvalid"),
  password: z
    .string()
    .min(8, "passwordMinLength"),
  fullName: z
    .string()
    .trim()
    .min(2, "fullNameMinLength"),
  role: z.string().optional(),
  organizationId: z.string().optional(),
  clubId: z.string().optional(),
});

type CreateAdminUserFormValues = z.infer<typeof createAdminUserSchema>;

export default function CreateAdminUserForm() {
  const router = useRouter();
  const t = useTranslations("CreateAdminUser");
  const [showPassword, setShowPassword] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [submitSuccess, setSubmitSuccess] = useState<string | null>(null);

  const {
    control,
    handleSubmit,
    formState: { errors, isSubmitting },
    setValue,
  } = useForm<CreateAdminUserFormValues>({
    resolver: zodResolver(createAdminUserSchema),
    defaultValues: {
      email: "",
      password: "",
      fullName: "",
      role: "",
      organizationId: "",
      clubId: "",
    },
  });

  const onSubmit = async (values: CreateAdminUserFormValues) => {
    setSubmitError(null);
    setSubmitSuccess(null);

    try {
      // TODO: Replace with actual API call when backend endpoint is ready
      console.log("Form submitted with values:", values);
      
      // Simulate API call
      await new Promise((resolve) => setTimeout(resolve, 1000));
      
      setSubmitSuccess(t("successMessage"));
      
      // Redirect to user access page after success
      setTimeout(() => {
        router.push("/user-access");
      }, 1500);
    } catch (error) {
      setSubmitError(t("errorMessage"));
      console.error("Error creating admin user:", error);
    }
  };

  const handleCancel = () => {
    router.push("/user-access");
  };

  // Empty arrays for selects (as requested)
  const roleOptions: { value: string; label: string }[] = [];
  const organizationOptions: { value: string; label: string }[] = [];
  const clubOptions: { value: string; label: string }[] = [];

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
      {/* Success Message */}
      {submitSuccess && (
        <div className="rounded-lg bg-green-50 p-4 text-sm text-green-800 dark:bg-green-900/20 dark:text-green-400">
          {submitSuccess}
        </div>
      )}

      {/* Error Message */}
      {submitError && (
        <div className="rounded-lg bg-red-50 p-4 text-sm text-red-800 dark:bg-red-900/20 dark:text-red-400">
          {submitError}
        </div>
      )}

      {/* Email Field */}
      <div>
        <Label htmlFor="email">{t("email")}</Label>
        <Controller
          name="email"
          control={control}
          render={({ field }) => (
            <Input
              {...field}
              id="email"
              type="email"
              placeholder={t("emailPlaceholder")}
              className="mt-2"
            />
          )}
        />
        {errors.email && (
          <p className="mt-1 text-sm text-red-600 dark:text-red-400">
            {t(errors.email.message as string)}
          </p>
        )}
      </div>

      {/* Password Field */}
      <div>
        <Label htmlFor="password">{t("password")}</Label>
        <div className="relative mt-2">
          <Controller
            name="password"
            control={control}
            render={({ field }) => (
              <Input
                {...field}
                id="password"
                type={showPassword ? "text" : "password"}
                placeholder={t("passwordPlaceholder")}
              />
            )}
          />
          <button
            type="button"
            onClick={() => setShowPassword(!showPassword)}
            className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
          >
            {showPassword ? (
              <EyeCloseIcon className="h-5 w-5" />
            ) : (
              <EyeIcon className="h-5 w-5" />
            )}
          </button>
        </div>
        {errors.password && (
          <p className="mt-1 text-sm text-red-600 dark:text-red-400">
            {t(errors.password.message as string)}
          </p>
        )}
      </div>

      {/* Full Name Field */}
      <div>
        <Label htmlFor="fullName">{t("fullName")}</Label>
        <Controller
          name="fullName"
          control={control}
          render={({ field }) => (
            <Input
              {...field}
              id="fullName"
              type="text"
              placeholder={t("fullNamePlaceholder")}
              className="mt-2"
            />
          )}
        />
        {errors.fullName && (
          <p className="mt-1 text-sm text-red-600 dark:text-red-400">
            {t(errors.fullName.message as string)}
          </p>
        )}
      </div>

      {/* Role Select */}
      <div>
        <Label htmlFor="role">{t("role")}</Label>
        <Controller
          name="role"
          control={control}
          render={({ field }) => (
            <div className="mt-2">
              <Select
                options={roleOptions}
                placeholder={t("rolePlaceholder")}
                onChange={(value) => setValue("role", value)}
                defaultValue={field.value}
              />
            </div>
          )}
        />
        {errors.role && (
          <p className="mt-1 text-sm text-red-600 dark:text-red-400">
            {errors.role.message}
          </p>
        )}
      </div>

      {/* Organization Select */}
      <div>
        <Label htmlFor="organizationId">{t("organizationId")}</Label>
        <Controller
          name="organizationId"
          control={control}
          render={({ field }) => (
            <div className="mt-2">
              <Select
                options={organizationOptions}
                placeholder={t("organizationPlaceholder")}
                onChange={(value) => setValue("organizationId", value)}
                defaultValue={field.value}
              />
            </div>
          )}
        />
        {errors.organizationId && (
          <p className="mt-1 text-sm text-red-600 dark:text-red-400">
            {errors.organizationId.message}
          </p>
        )}
      </div>

      {/* Club Select */}
      <div>
        <Label htmlFor="clubId">{t("clubId")}</Label>
        <Controller
          name="clubId"
          control={control}
          render={({ field }) => (
            <div className="mt-2">
              <Select
                options={clubOptions}
                placeholder={t("clubPlaceholder")}
                onChange={(value) => setValue("clubId", value)}
                defaultValue={field.value}
              />
            </div>
          )}
        />
        {errors.clubId && (
          <p className="mt-1 text-sm text-red-600 dark:text-red-400">
            {errors.clubId.message}
          </p>
        )}
      </div>

      {/* Action Buttons */}
      <div className="flex gap-3 pt-3">
        <Button
          type="submit"
          variant="primary"
          size="md"
          disabled={isSubmitting}
          className="flex-1"
        >
          {isSubmitting ? t("Shared.loading") : t("submitButton")}
        </Button>
        <Button
          type="button"
          variant="outline"
          size="md"
          onClick={handleCancel}
          disabled={isSubmitting}
        >
          {t("cancelButton")}
        </Button>
      </div>
    </form>
  );
}
