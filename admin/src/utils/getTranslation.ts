import { PLUGIN_ID } from "../pluginId";

export const getTranslation = (translations: Record<string, string>) => {
  return Object.keys(translations).reduce(
    (acc, key) => {
      acc[`${PLUGIN_ID}.${key}`] = translations[key];
      return acc;
    },
    {} as Record<string, string>
  );
};
