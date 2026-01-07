import type { Core } from "@strapi/strapi";

const register = ({ strapi }: { strapi: Core.Strapi }) => {
  // Register phase - plugin registers itself
};

const bootstrap = async ({ strapi }: { strapi: Core.Strapi }) => {
  // Bootstrap phase
};

const destroy = ({ strapi }: { strapi: Core.Strapi }) => {
  // Destroy phase
};

export default {
  register,
  bootstrap,
  destroy,
};
