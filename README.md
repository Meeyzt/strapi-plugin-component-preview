# Strapi Plugin: Component Preview

A Strapi 5 plugin that adds real-time component preview functionality to the Content Manager. Preview your dynamic zone components while editing pages with automatic demo data generation.

![Component Preview](https://placehold.co/800x400/4945FF/FFFFFF?text=Component+Preview+Plugin)

## ✨ Features

- 🎨 **Live Preview** - See your components rendered in real-time
- 🌙 **Dark Mode Support** - Automatically adapts to Strapi's theme
- 📝 **Demo Data Generation** - Automatically fills empty fields with placeholder content
- 🖼️ **Placeholder Images** - Generates placeholder images for media fields
- 🔗 **Schema-Aware** - Reads component schemas to understand field types
- 🪟 **Inline & External Preview** - Preview inline or open in new window
- ⚡ **No Server API Required** - Runs entirely client-side

## 📦 Installation

### Using npm

```bash
npm i strapi5-component-preview
```

### Manual Installation

Copy the plugin folder to your Strapi project:

```bash
cp -r strapi-plugin-component-preview ./src/plugins/component-preview
```

## ⚙️ Configuration

### 1. Enable the plugin

Add to your `config/plugins.ts`:

```typescript
export default {
  'component-preview': {
    enabled: true,
  },
};
```

### 2. Create Frontend Preview Page

Create a preview page in your frontend application (Next.js example):

```tsx
// app/preview/component/page.tsx
'use client';

import { useSearchParams } from 'next/navigation';
import { Suspense, useMemo } from 'react';
import { ComponentRenderer } from '@/components/ComponentRenderer';

function PreviewContent() {
  const searchParams = useSearchParams();
  
  const componentData = useMemo(() => {
    const data = searchParams.get('data');
    if (!data) return null;
    
    try {
      return JSON.parse(decodeURIComponent(atob(data)));
    } catch {
      return null;
    }
  }, [searchParams]);

  if (!componentData) {
    return <div>No component data</div>;
  }

  return <ComponentRenderer data={componentData} />;
}

export default function PreviewPage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <PreviewContent />
    </Suspense>
  );
}
```

## 🚀 Usage

1. Open any Page (or content type with dynamic zones) in Strapi admin
2. Look for the **"Component Preview"** panel in the right sidebar
3. Toggle **"Fill Empty Fields"** to generate demo data
4. Click on a component to preview inline
5. Use the **↗** button to open in a new window

## 🎯 Demo Data Generation

The plugin intelligently generates demo data based on:

| Field Type | Generated Value |
|------------|-----------------|
| String fields | Field name (e.g., `title` → `"title"`) |
| Media fields | Placeholder image with field name |
| Component fields | Recursively generated from schema |
| Repeatable components | 1 demo item |
| Empty arrays | 1 demo item |

### Media Placeholder

Media fields get placeholder images from [placehold.co](https://placehold.co):

```
https://placehold.co/800x600/4945FF/FFFFFF?text=fieldName
```

## 🎨 Theme Support

The plugin automatically adapts to Strapi's theme:

- Uses Strapi Design System tokens
- Works with both light and dark mode
- Consistent with Strapi's UI

## 📁 Project Structure

```
strapi-plugin-component-preview/
├── admin/
│   └── src/
│       ├── components/
│       │   ├── PreviewButton.tsx    # Main preview component
│       │   ├── PreviewPanel.tsx     # Preview panel wrapper
│       │   └── Initializer.tsx      # Plugin initializer
│       ├── pages/
│       │   ├── App.tsx
│       │   └── HomePage.tsx
│       ├── translations/
│       │   ├── en.json
│       │   └── tr.json
│       └── index.ts                 # Admin entry point
├── server/
│   └── src/
│       └── index.ts                 # Server entry point
├── frontend-examples/
│   ├── nextjs-app-router/
│   │   └── page.tsx
│   └── ComponentRenderer.tsx
├── package.json
└── README.md
```

## 🔧 Requirements

- Strapi v5.0.0 or higher
- Node.js 18+
- A frontend application with a preview route

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## 📄 License

MIT License - see [LICENSE](LICENSE) for details.

## 🙏 Credits

Created by [Pathi](https://github.com/pathi)

---

**Note:** This plugin requires a frontend application to render the components. The plugin sends component data via URL parameters to your frontend preview page.
# strapi-plugin-component-preview
