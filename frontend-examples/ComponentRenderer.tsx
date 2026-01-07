// Bu dosyayı frontend projenize kopyalayın
// components/ComponentRenderer.tsx

import dynamic from 'next/dynamic';
import React from 'react';

// Component map - tüm componentlerinizi buraya ekleyin
// Her component için lazy loading kullanıyoruz
const componentMap: Record<string, React.ComponentType<any>> = {
  // Home Components
  'home.hero-section': dynamic(() => import('./blocks/home/HeroSection')),
  'home.about-us-section': dynamic(() => import('./blocks/home/AboutUsSection')),
  'home.gallery': dynamic(() => import('./blocks/home/Gallery')),
  'home.why-choose-us': dynamic(() => import('./blocks/home/WhyChooseUs')),
  'home.parts-accessories': dynamic(() => import('./blocks/home/PartsAccessories')),
  'home.dealers-service': dynamic(() => import('./blocks/home/DealersService')),
  'home.blog-list': dynamic(() => import('./blocks/home/BlogList')),
  
  // Shared Components
  'shared.hero': dynamic(() => import('./blocks/shared/Hero')),
  'shared.section-intro': dynamic(() => import('./blocks/shared/SectionIntro')),
  'shared.faq': dynamic(() => import('./blocks/shared/FAQ')),
  'shared.image-text': dynamic(() => import('./blocks/shared/ImageText')),
  'shared.model-slider-list': dynamic(() => import('./blocks/shared/ModelSliderList')),
  'shared.model-card': dynamic(() => import('./blocks/shared/ModelCard')),
  'shared.design-configurator': dynamic(() => import('./blocks/shared/DesignConfigurator')),
  'shared.detailed-gallery': dynamic(() => import('./blocks/shared/DetailedGallery')),
  'shared.spec-highlight-banner': dynamic(() => import('./blocks/shared/SpecHighlightBanner')),
  'shared.interior-spec-banner': dynamic(() => import('./blocks/shared/InteriorSpecBanner')),
  'shared.location-map': dynamic(() => import('./blocks/shared/LocationMap')),
  'shared.full-size-image': dynamic(() => import('./blocks/shared/FullSizeImage')),
  'shared.markdown-editor': dynamic(() => import('./blocks/shared/MarkdownEditor')),
  'shared.dynamic-form': dynamic(() => import('./blocks/shared/DynamicForm')),
  'shared.dynamic-content': dynamic(() => import('./blocks/shared/DynamicContent')),
  'shared.grid-container': dynamic(() => import('./blocks/shared/GridContainer')),
  'shared.horizontal-feature-cards': dynamic(() => import('./blocks/shared/HorizontalFeatureCards')),
  'shared.section-header': dynamic(() => import('./blocks/shared/SectionHeader')),
  'shared.title-description': dynamic(() => import('./blocks/shared/TitleDescription')),
  'shared.accordion': dynamic(() => import('./blocks/shared/Accordion')),
  'shared.image-masonry-grid': dynamic(() => import('./blocks/shared/ImageMasonryGrid')),
  'shared.button': dynamic(() => import('./blocks/shared/Button')),
  
  // About Components
  'about.story': dynamic(() => import('./blocks/about/Story')),
  
  // Accessories Components
  'accessories.accessory-grid': dynamic(() => import('./blocks/accessories/AccessoryGrid')),
};

interface ComponentRendererProps {
  block: {
    __component: string;
    id?: number;
    [key: string]: any;
  };
}

export function ComponentRenderer({ block }: ComponentRendererProps) {
  const Component = componentMap[block.__component];
  
  if (!Component) {
    // Development modunda bilinmeyen component'i göster
    if (process.env.NODE_ENV === 'development') {
      return (
        <div style={{
          padding: '32px',
          backgroundColor: '#FEF3C7',
          border: '1px solid #F59E0B',
          borderRadius: '8px',
          margin: '16px'
        }}>
          <p style={{ color: '#92400E', fontWeight: '600', marginBottom: '16px' }}>
            ⚠️ Unknown component: <code>{block.__component}</code>
          </p>
          <p style={{ color: '#92400E', fontSize: '14px', marginBottom: '16px' }}>
            Bu component henüz componentMap'e eklenmemiş. 
            Lütfen ComponentRenderer.tsx dosyasına ekleyin.
          </p>
          <details>
            <summary style={{ cursor: 'pointer', color: '#92400E' }}>
              Component Data
            </summary>
            <pre style={{ 
              marginTop: '12px',
              fontSize: '12px',
              overflow: 'auto',
              backgroundColor: 'rgba(0,0,0,0.05)',
              padding: '12px',
              borderRadius: '4px'
            }}>
              {JSON.stringify(block, null, 2)}
            </pre>
          </details>
        </div>
      );
    }
    
    // Production'da null döndür
    return null;
  }
  
  // Component'i render et, __component ve id hariç tüm props'ları geç
  const { __component, id, ...props } = block;
  
  return <Component {...props} />;
}

// Birden fazla block'u render etmek için yardımcı component
interface BlocksRendererProps {
  blocks: Array<{
    __component: string;
    id?: number;
    [key: string]: any;
  }>;
}

export function BlocksRenderer({ blocks }: BlocksRendererProps) {
  if (!blocks || !Array.isArray(blocks)) {
    return null;
  }
  
  return (
    <>
      {blocks.map((block, index) => (
        <ComponentRenderer 
          key={block.id || `${block.__component}-${index}`} 
          block={block} 
        />
      ))}
    </>
  );
}
