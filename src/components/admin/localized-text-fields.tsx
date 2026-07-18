"use client";

import { useState } from "react";
import type { AppLocale } from "@/i18n/routing";
import { contentLocales, localeLabels } from "@/lib/i18n/localized-content";
import { localeOptions } from "@/i18n/locales";
import { RichContentEditor } from "@/components/admin/image-upload";
import { Input, Label, Textarea } from "@/components/ui/input";

type LocaleTabBarProps = {
  values: Record<AppLocale, string>;
  active: AppLocale;
  onChange: (locale: AppLocale) => void;
  requiredLocale?: AppLocale;
};

export function LocaleTabBar({
  values,
  active,
  onChange,
  requiredLocale = "tr",
}: LocaleTabBarProps) {
  return (
    <div className="mt-2 flex flex-wrap gap-1.5">
      {localeOptions.map((option) => {
        const filled = Boolean(values[option.code]?.trim());
        const isActive = active === option.code;
        return (
          <button
            key={option.code}
            type="button"
            onClick={() => onChange(option.code)}
            className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-semibold transition ${
              isActive
                ? "bg-brand-brown text-white"
                : "bg-brand-cream-light text-brand-brown-dark hover:bg-brand-cream"
            }`}
          >
            {option.label}
            {filled && (
              <span
                className={`h-1.5 w-1.5 rounded-full ${
                  isActive ? "bg-brand-cream" : "bg-brand-brown"
                }`}
              />
            )}
            {option.code === requiredLocale && (
              <span className="text-[10px] opacity-80">*</span>
            )}
          </button>
        );
      })}
    </div>
  );
}

type LocalizedTextFieldsProps = {
  label: string;
  values: Record<AppLocale, string>;
  onChange: (locale: AppLocale, value: string) => void;
  multiline?: boolean;
  rows?: number;
  requiredLocale?: AppLocale;
  placeholder?: string;
};

export function LocalizedTextFields({
  label,
  values,
  onChange,
  multiline = false,
  rows = 3,
  requiredLocale = "tr",
  placeholder,
}: LocalizedTextFieldsProps) {
  const [active, setActive] = useState<AppLocale>(requiredLocale);

  return (
    <div>
      <Label>{label}</Label>
      <LocaleTabBar
        values={values}
        active={active}
        onChange={setActive}
        requiredLocale={requiredLocale}
      />

      <div className="mt-3 space-y-2">
        {contentLocales.map((locale) => {
          const fieldId = `${label}-${locale}`.replace(/\s+/g, "-").toLowerCase();
          const commonProps = {
            id: fieldId,
            value: values[locale],
            onChange: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
              onChange(locale, e.target.value),
            placeholder:
              placeholder ||
              (locale === requiredLocale
                ? `${localeLabels[locale]} — zorunlu`
                : `${localeLabels[locale]} — isteğe bağlı`),
            className: active === locale ? "mt-0" : "hidden",
            required: locale === requiredLocale && active === locale,
          };

          return multiline ? (
            <Textarea key={locale} rows={rows} {...commonProps} />
          ) : (
            <Input key={locale} {...commonProps} />
          );
        })}
      </div>
    </div>
  );
}

type LocalizedRichContentFieldsProps = {
  label: string;
  values: Record<AppLocale, string>;
  onChange: (locale: AppLocale, value: string) => void;
  rows?: number;
  requiredLocale?: AppLocale;
};

export function LocalizedRichContentFields({
  label,
  values,
  onChange,
  rows = 10,
  requiredLocale = "tr",
}: LocalizedRichContentFieldsProps) {
  const [active, setActive] = useState<AppLocale>(requiredLocale);

  return (
    <div>
      <Label>{label}</Label>
      <LocaleTabBar
        values={values}
        active={active}
        onChange={setActive}
        requiredLocale={requiredLocale}
      />
      <div className="mt-3">
        {contentLocales.map((locale) => (
          <div key={locale} className={active === locale ? "" : "hidden"}>
            <RichContentEditor
              label={localeLabels[locale]}
              value={values[locale]}
              onChange={(value) => onChange(locale, value)}
              rows={rows}
              required={locale === requiredLocale}
            />
          </div>
        ))}
      </div>
    </div>
  );
}
