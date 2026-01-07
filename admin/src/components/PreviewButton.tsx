import React, { useState, useEffect, useCallback } from 'react';
import { Button, Box, Typography, Flex, Field, TextInput, Toggle, Loader, Badge } from '@strapi/design-system';
import { Eye, ArrowRight, ExternalLink } from '@strapi/icons';
import { unstable_useContentManagerContext as useContentManagerContext, useFetchClient } from '@strapi/strapi/admin';
import styled from 'styled-components';

// Theme-aware styled components using Strapi's design tokens
const PreviewContainer = styled(Box)`
  margin-top: 16px;
  border: 1px solid ${({ theme }) => theme.colors.neutral200};
  border-radius: ${({ theme }) => theme.borderRadius};
  background: ${({ theme }) => theme.colors.neutral0};
  overflow: hidden;
`;

const PreviewHeader = styled(Flex)`
  padding: 12px 16px;
  background: ${({ theme }) => theme.colors.neutral100};
  border-bottom: 1px solid ${({ theme }) => theme.colors.neutral200};
  cursor: pointer;
  
  &:hover {
    background: ${({ theme }) => theme.colors.neutral150};
  }
`;

const PreviewContent = styled(Box)`
  max-height: 600px;
  overflow-y: auto;
  background: ${({ theme }) => theme.colors.neutral0};
`;

const ComponentItem = styled(Flex)<{ $isSelected?: boolean }>`
  padding: 12px 16px;
  border-bottom: 1px solid ${({ theme }) => theme.colors.neutral150};
  cursor: pointer;
  background: ${({ theme, $isSelected }) => $isSelected ? theme.colors.primary100 : theme.colors.neutral0};
  transition: all 0.2s;
  
  &:hover {
    background: ${({ theme, $isSelected }) => $isSelected ? theme.colors.primary100 : theme.colors.neutral100};
  }
  
  &:last-child {
    border-bottom: none;
  }
`;

const PreviewButton_Styled = styled(Button)`
  padding: 4px 8px;
  min-width: auto;
`;

const SettingsBox = styled(Box)`
  padding: 12px 16px;
  background: ${({ theme }) => theme.colors.neutral100};
  border-bottom: 1px solid ${({ theme }) => theme.colors.neutral200};
`;

const DemoBadge = styled(Box)`
  background: ${({ theme }) => theme.colors.primary600};
  color: ${({ theme }) => theme.colors.neutral0};
  padding: 2px 6px;
  border-radius: 4px;
  font-size: 9px;
  font-weight: 600;
`;

const ComponentBadge = styled(Badge)`
  font-size: 9px;
  text-transform: uppercase;
`;

const IframeContainer = styled(Box)`
  width: 100%;
  height: 500px;
  background: ${({ theme }) => theme.colors.neutral100};
  position: relative;
`;

const PreviewFrame = styled.iframe`
  width: 100%;
  height: 100%;
  border: none;
`;

const PlaceholderBox = styled(Flex)`
  height: 100%;
  min-height: 200px;
  align-items: center;
  justify-content: center;
  flex-direction: column;
  gap: 8px;
  background: ${({ theme }) => theme.colors.neutral100};
`;

// Placeholder image generator
const createPlaceholderImage = (fieldName: string) => ({
  id: Math.floor(Math.random() * 10000),
  name: `${fieldName}.jpg`,
  alternativeText: fieldName,
  caption: fieldName,
  width: 800,
  height: 600,
  formats: {
    thumbnail: { url: `https://placehold.co/400x300/4945FF/FFFFFF?text=${fieldName}` },
    small: { url: `https://placehold.co/400x300/4945FF/FFFFFF?text=${fieldName}` },
    medium: { url: `https://placehold.co/800x600/4945FF/FFFFFF?text=${fieldName}` },
    large: { url: `https://placehold.co/1200x800/4945FF/FFFFFF?text=${fieldName}` },
  },
  url: `https://placehold.co/800x600/4945FF/FFFFFF?text=${fieldName}`,
  previewUrl: `https://placehold.co/800x600/4945FF/FFFFFF?text=${fieldName}`,
  mime: 'image/jpeg',
});

// Check if field name suggests it's an image/media field
const isMediaField = (key: string): boolean => {
  const k = key.toLowerCase();
  return k.includes('image') || k.includes('media') || k.includes('photo') || 
         k.includes('picture') || k.includes('icon') || k.includes('logo') || 
         k.includes('background') || k.includes('cover') || k.includes('thumbnail') ||
         k.includes('avatar') || k.includes('banner');
};

// Demo data generator - simple: key = value, 1 item for arrays
const generateDemoData = (blocks: any[], schemas: Record<string, any>): any[] => {
  
  const generateValueForAttribute = (attr: any, fieldName: string): any => {
    const type = attr.type;
    
    // Media fields
    if (type === 'media') {
      return createPlaceholderImage(fieldName);
    }
    
    // Component fields
    if (type === 'component') {
      const componentSchema = schemas[attr.component];
      if (componentSchema) {
        const item = generateComponentFromSchema(componentSchema, schemas);
        return attr.repeatable ? [item] : item;
      }
      return attr.repeatable ? [] : null;
    }
    
    // Dynamic zone
    if (type === 'dynamiczone') {
      return [];
    }
    
    // Relation fields
    if (type === 'relation') {
      return null;
    }
    
    // Simple types - field name = value
    return fieldName;
  };
  
  const generateComponentFromSchema = (schema: any, allSchemas: Record<string, any>): any => {
    const result: any = {};
    const attributes = schema.attributes || schema.schema?.attributes || {};
    
    for (const [fieldName, attr] of Object.entries(attributes) as [string, any][]) {
      result[fieldName] = generateValueForAttribute(attr, fieldName);
    }
    
    return result;
  };
  
  const enrichBlock = (block: any): any => {
    if (!block || typeof block !== 'object') return block;
    
    const componentUid = block.__component;
    const schema = schemas[componentUid];
    
    if (!schema) {
      // Fallback: just return block with basic enrichment
      return enrichBlockFallback(block);
    }
    
    const attributes = schema.attributes || schema.schema?.attributes || {};
    const enriched: any = { __component: componentUid };
    
    // Copy existing id if present
    if (block.id !== undefined) {
      enriched.id = block.id;
    }
    
    for (const [fieldName, attr] of Object.entries(attributes) as [string, any][]) {
      const existingValue = block[fieldName];
      
      // If value exists and is not empty, use it (but enrich nested)
      if (existingValue !== null && existingValue !== undefined && existingValue !== '') {
        if (Array.isArray(existingValue) && existingValue.length > 0) {
          enriched[fieldName] = existingValue.map((item: any) => 
            typeof item === 'object' && item.__component ? enrichBlock(item) : 
            typeof item === 'object' ? enrichBlockFallback(item) : item
          );
        } else if (typeof existingValue === 'object' && !Array.isArray(existingValue)) {
          enriched[fieldName] = existingValue.__component 
            ? enrichBlock(existingValue) 
            : enrichBlockFallback(existingValue);
        } else {
          enriched[fieldName] = existingValue;
        }
      } else {
        // Generate demo value from schema
        enriched[fieldName] = generateValueForAttribute(attr, fieldName);
      }
    }
    
    return enriched;
  };
  
  // Fallback enrichment for blocks without schema
  const enrichBlockFallback = (block: any): any => {
    if (!block || typeof block !== 'object') return block;
    
    const enriched = { ...block };
    
    for (const [key, value] of Object.entries(block)) {
      if (key === '__component' || key === 'id') continue;
      
      if (Array.isArray(value) && value.length > 0) {
        enriched[key] = value.map((item: any) => 
          typeof item === 'object' ? enrichBlockFallback(item) : item
        );
      } else if (Array.isArray(value) && value.length === 0) {
        enriched[key] = [{ id: 1, title: key, name: key }];
      } else if (value !== null && typeof value === 'object') {
        enriched[key] = enrichBlockFallback(value);
      } else if (value === null || value === undefined || value === '') {
        enriched[key] = isMediaField(key) ? createPlaceholderImage(key) : key;
      }
    }
    
    return enriched;
  };

  return blocks.map(enrichBlock);
};

export const PreviewButton = () => {
  const context = useContentManagerContext();
  const { get } = useFetchClient();
  const [isExpanded, setIsExpanded] = useState(true);
  const [selectedBlockIndex, setSelectedBlockIndex] = useState<number | null>(null);
  const [frontendUrl, setFrontendUrl] = useState(localStorage.getItem('component-preview-frontend-url') || 'http://localhost:3000');
  const [useDemoData, setUseDemoData] = useState(localStorage.getItem('component-preview-use-demo') === 'true');
  const [enrichedBlocks, setEnrichedBlocks] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [previewUrl, setPreviewUrl] = useState('');
  const [componentSchemas, setComponentSchemas] = useState<Record<string, any>>({});

  const formValues = context?.form?.values;
  const blocks = formValues?.blocks || [];
  const hasBlocks = Array.isArray(blocks) && blocks.length > 0;

  // Fetch component schemas from Strapi
  useEffect(() => {
    const fetchSchemas = async () => {
      try {
        const response = await get('/content-type-builder/components');
        const schemas: Record<string, any> = {};
        
        if (response?.data?.data) {
          for (const component of response.data.data) {
            schemas[component.uid] = component;
          }
        }
        
        setComponentSchemas(schemas);
      } catch (error) {
        console.error('Failed to fetch component schemas:', error);
      }
    };
    
    fetchSchemas();
  }, [get]);

  // Save settings
  useEffect(() => {
    localStorage.setItem('component-preview-frontend-url', frontendUrl);
    localStorage.setItem('component-preview-use-demo', String(useDemoData));
  }, [frontendUrl, useDemoData]);

  // Enrich blocks with demo data using schemas
  useEffect(() => {
    if (useDemoData && blocks.length > 0 && Object.keys(componentSchemas).length > 0) {
      setLoading(true);
      setTimeout(() => {
        const enriched = generateDemoData(blocks, componentSchemas);
        setEnrichedBlocks(enriched);
        setLoading(false);
      }, 100);
    } else if (!useDemoData) {
      setEnrichedBlocks(blocks);
    }
  }, [blocks, useDemoData, componentSchemas]);

  const displayBlocks = useDemoData && enrichedBlocks.length > 0 ? enrichedBlocks : blocks;
  const selectedBlock = selectedBlockIndex !== null ? displayBlocks[selectedBlockIndex] : null;

  // Generate preview URL
  useEffect(() => {
    if (selectedBlock) {
      const componentData = {
        __component: selectedBlock.__component,
        ...selectedBlock,
      };
      
      try {
        const encodedData = btoa(unescape(encodeURIComponent(JSON.stringify(componentData))));
        setPreviewUrl(`${frontendUrl}/preview/component?data=${encodedData}`);
      } catch (e) {
        console.error('Failed to encode data:', e);
      }
    } else {
      setPreviewUrl('');
    }
  }, [selectedBlock, frontendUrl]);

  const getComponentDisplayName = (component: string) => {
    if (!component) return 'Unknown';
    const parts = component.split('.');
    const name = parts[parts.length - 1];
    return name
      .replace(/-/g, ' ')
      .replace(/([A-Z])/g, ' $1')
      .trim()
      .split(' ')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
      .join(' ');
  };

  const getComponentCategory = (component: string) => {
    if (!component) return 'unknown';
    return component.split('.')[0];
  };

  const openInNewWindow = (block: any, index: number) => {
    const componentData = useDemoData && enrichedBlocks[index] 
      ? enrichedBlocks[index]
      : block;
      
    const data = {
      __component: componentData.__component,
      ...componentData,
    };
    
    try {
      const encodedData = btoa(unescape(encodeURIComponent(JSON.stringify(data))));
      const url = `${frontendUrl}/preview/component?data=${encodedData}`;
      window.open(url, '_blank', 'width=1400,height=900');
    } catch (e) {
      console.error('Failed to open preview:', e);
    }
  };

  if (!hasBlocks) {
    return null;
  }

  return (
    <PreviewContainer>
      <PreviewHeader onClick={() => setIsExpanded(!isExpanded)} justifyContent="space-between" alignItems="center">
        <Flex alignItems="center" gap={2}>
          <Eye width={16} height={16} />
          <Typography variant="sigma" fontWeight="bold">
            COMPONENT PREVIEW
          </Typography>
          <Badge size="S">{blocks.length}</Badge>
        </Flex>
        <ArrowRight 
          width={16} 
          height={16} 
          style={{ 
            transform: isExpanded ? 'rotate(90deg)' : 'rotate(0deg)',
            transition: 'transform 0.2s'
          }} 
        />
      </PreviewHeader>

      {isExpanded && (
        <PreviewContent>
          {/* Settings */}
          <SettingsBox>
            <Flex direction="column" gap={3}>
              <Flex alignItems="center" gap={3}>
                <Toggle
                  checked={useDemoData}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => setUseDemoData(e.target.checked)}
                />
                <Box>
                  <Flex alignItems="center" gap={2}>
                    <Typography variant="pi" fontWeight="semiBold">
                      Fill Empty Fields
                    </Typography>
                    {useDemoData && <DemoBadge>DEMO</DemoBadge>}
                  </Flex>
                </Box>
              </Flex>
              
              <Field.Root>
                <Field.Label>Frontend URL</Field.Label>
                <TextInput
                  value={frontendUrl}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => setFrontendUrl(e.target.value)}
                  placeholder="http://localhost:3000"
                  size="S"
                />
              </Field.Root>
            </Flex>
          </SettingsBox>

          {/* Component List */}
          {loading ? (
            <PlaceholderBox>
              <Loader small>Loading...</Loader>
            </PlaceholderBox>
          ) : (
            <Box>
              {displayBlocks.map((block, index) => (
                <ComponentItem 
                  key={index}
                  $isSelected={selectedBlockIndex === index}
                  justifyContent="space-between" 
                  alignItems="center"
                  onClick={() => setSelectedBlockIndex(selectedBlockIndex === index ? null : index)}
                >
                  <Box style={{ flex: 1 }}>
                    <Flex alignItems="center" gap={2}>
                      <Typography variant="omega" fontWeight="semiBold">
                        {getComponentDisplayName(block.__component)}
                      </Typography>
                      {useDemoData && <DemoBadge>DEMO</DemoBadge>}
                    </Flex>
                    <Box marginTop={1}>
                      <ComponentBadge size="S">
                        {getComponentCategory(block.__component)}
                      </ComponentBadge>
                    </Box>
                  </Box>
                  
                  <Flex gap={2} alignItems="center">
                    <Typography variant="pi" textColor="neutral500">
                      #{index + 1}
                    </Typography>
                    <PreviewButton_Styled 
                      variant="secondary" 
                      size="S"
                      onClick={(e: React.MouseEvent) => {
                        e.stopPropagation();
                        openInNewWindow(block, index);
                      }}
                    >
                      <ExternalLink width={14} height={14} />
                    </PreviewButton_Styled>
                  </Flex>
                </ComponentItem>
              ))}
            </Box>
          )}

          {/* Inline Preview */}
          {selectedBlock && previewUrl && (
            <IframeContainer>
              <PreviewFrame
                src={previewUrl}
                title="Component Preview"
                sandbox="allow-same-origin allow-scripts"
              />
            </IframeContainer>
          )}

          {!selectedBlock && !loading && (
            <PlaceholderBox>
              <Typography variant="pi" textColor="neutral500">
                Click a component to preview inline
              </Typography>
              <Typography variant="pi" textColor="neutral400">
                or use the ↗ button to open in new window
              </Typography>
            </PlaceholderBox>
          )}
        </PreviewContent>
      )}
    </PreviewContainer>
  );
};
