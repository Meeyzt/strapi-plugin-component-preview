import { getTranslation } from "./utils/getTranslation";
import { PLUGIN_ID } from "./pluginId";
import { Initializer } from "./components/Initializer";
import { PreviewButton } from "./components/PreviewButton";

export default {
  register(app: any) {
    // Plugin sayfasını kaydet
    app.addMenuLink({
      to: `plugins/${PLUGIN_ID}`,
      icon: () => "👁️",
      intlLabel: {
        id: `${PLUGIN_ID}.plugin.name`,
        defaultMessage: "Component Preview",
      },
      permissions: [],
      Component: async () => {
        const { App } = await import("./pages/App");
        return App;
      },
    });

    // Content Manager'da preview butonu ekle
    app
      .getPlugin("content-manager")
      ?.injectComponent?.("editView", "right-links", {
        name: "component-preview-button",
        Component: PreviewButton,
      });

    app.registerPlugin({
      id: PLUGIN_ID,
      initializer: Initializer,
      isReady: false,
      name: PLUGIN_ID,
    });
  },

  bootstrap(app: any) {
    // Bootstrap işlemleri
  },

  async registerTrads(app: any) {
    const { locales } = app;

    const importedTranslations = await Promise.all(
      (locales as string[]).map((locale) => {
        return import(`./translations/${locale}.json`)
          .then(({ default: data }) => {
            return {
              data: getTranslation(data),
              locale,
            };
          })
          .catch(() => {
            return {
              data: {},
              locale,
            };
          });
      })
    );

    return importedTranslations;
  },
};
