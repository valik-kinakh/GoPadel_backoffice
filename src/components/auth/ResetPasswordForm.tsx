"use client";
import Input from "@/components/form/input/InputField";
import Label from "@/components/form/Label";
import Button from "@/components/ui/button/Button";
import { useTranslations } from "next-intl";

export default function ResetPasswordForm() {
  const t = useTranslations("ResetPassword");

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
          <form>
            <div className="space-y-6">
              <div>
                <Label>
                  {t("email")} <span className="text-error-500">*</span>{" "}
                </Label>
                <Input type="email" placeholder="example@gmail.com" />
              </div>
              <Button className="w-full" size="sm">
                {t("submit")}
              </Button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
