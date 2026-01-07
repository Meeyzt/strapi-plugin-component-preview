import React, { useState, useEffect, useRef, useMemo } from 'react';
import { Box, Typography, Flex, Loader, Badge, Field, TextInput, Toggle, Button } from '@strapi/design-system';
import { useFetchClient } from '@strapi/strapi/admin';
import styled from 'styled-components';
import { PLUGIN_ID } from '../pluginId';

interface PreviewPanelProps {
  blocks: any[];
  onClose: () => void;
}

const Container = styled(Flex)`
  height: 100%;
  background: #f6f6f9;
`;

const Sidebar = styled(Box)`
  width: 320px;
  background: white;
  border-right: 1px solid #dcdce4;
  overflow-y: auto;
  height: 100%;
`;

const PreviewArea = styled(Box)`
  flex: 1;
  background: #f0f0f5;
  overflow: hidden;
  position: relative;
  height: 100%;
`;

const IframeContainer = styled(Box)`
  width: 100%;
  height: 100%;
  background: white;
  border-radius: 0;
`;

const ComponentItem = styled(Box)<{ $isSelected: boolean }>`
  padding: 12px 16px;
  cursor: pointer;
  border-bottom: 1px solid #eaeaea;
  background: ${props => props.$isSelected ? '#f0f0ff' : 'white'};
  transition: background 0.2s;
  
  &:hover {
    background: ${props => props.$isSelected ? '#f0f0ff' : '#f6f6f9'};
  }
`;

const ComponentBadge = styled(Badge)`
  font-size: 10px;
  text-transform: uppercase;
`;

const PreviewFrame = styled.iframe`
  width: 100%;
  height: 100%;
  border: none;
`;

const PlaceholderBox = styled(Flex)`
  height: 100%;
  align-items: center;
  justify-content: center;
  flex-direction: column;
  gap: 16px;
  color: #666;
`;

const ToolbarContainer = styled(Flex)`
  padding: 8px 16px;
  background: white;
  border-bottom: 1px solid #dcdce4;
  gap: 16px;
`;

const DemoToggleContainer = styled(Flex)`
  padding: 12px 16px;
  background: #f0f0ff;
  border-bottom: 1px solid #dcdce4;
  align-items: center;
  gap: 12px;
`;

const DemoBadge = styled(Box)`
  background: #4945FF;
  color: white;
  padding: 2px 8px;
  border-radius: 4px;
  font-size: 10px;
  font-weight: 600;
`;

export const PreviewPanel = ({ blocks, onClose }: PreviewPanelProps) => {
  const { post } = useFetchClient();
  const [selectedBlockIndex, setSelectedBlockIndex] = useState<number | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string>('');
  const [loading, setLoading] = useState(false);
  const [frontendUrl, setFrontendUrl] = useState(localStorage.getItem('component-preview-frontend-url') || 'http://localhost:3000');
  const [useDemoData, setUseDemoData] = useState(localStorage.getItem('component-preview-use-demo') === 'true');
  const [enrichedBlocks, setEnrichedBlocks] = useState<any[]>([]);
  const iframeRef = useRef<HTMLIFrameElement>(null);

  // Demo data modunu kaydet
  useEffect(() => {
    localStorage.setItem('component-preview-use-demo', String(useDemoData));
  }, [useDemoData]);

  // Blocks'ları demo data ile zenginleştir
  useEffect(() => {
    const enrichBlocks = async () => {
      if (useDemoData && blocks.length > 0) {
        try {
          const response = await post(`/${PLUGIN_ID}/enrich`, { blocks });
          setEnrichedBlocks(response.data);
        } catch (error) {
          console.error('Failed to enrich blocks:', error);
          setEnrichedBlocks(blocks);
        }
      } else {
        setEnrichedBlocks(blocks);
      }
    };
    enrichBlocks();
  }, [blocks, useDemoData]);

  const displayBlocks = useDemoData ? enrichedBlocks : blocks;
  const selectedBlock = selectedBlockIndex !== null ? displayBlocks[selectedBlockIndex] : null;

  // Frontend URL'ini kaydet
  useEffect(() => {
    localStorage.setItem('component-preview-frontend-url', frontendUrl);
  }, [frontendUrl]);

  // Preview URL oluştur
  useEffect(() => {
    if (selectedBlock) {
      setLoading(true);
      
      // Component verisini base64 encode et
      const componentData = {
        __component: selectedBlock.__component,
        ...selectedBlock,
      };
      
      const encodedData = btoa(encodeURIComponent(JSON.stringify(componentData)));
      const url = `${frontendUrl}/preview/component?data=${encodedData}`;
      setPreviewUrl(url);
      
      // Loading durumunu kapat (iframe yüklendiğinde)
      setTimeout(() => setLoading(false), 500);
    } else {
      setPreviewUrl('');
    }
  }, [selectedBlock, frontendUrl]);

  // Component adını güzelleştir
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

  // Component kategorisini al
  const getComponentCategory = (component: string) => {
    if (!component) return 'unknown';
    return component.split('.')[0];
  };

  return (
    <Container>
      {/* Sol Sidebar - Component Listesi */}
      <Sidebar>
        <Box padding={4} background="neutral100" borderBottom="1px solid #dcdce4">
          <Typography variant="beta" fontWeight="bold">
            Page Components ({blocks.length})
          </Typography>
        </Box>
        
        {/* Demo Data Toggle */}
        <DemoToggleContainer>
          <Toggle
            checked={useDemoData}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) => setUseDemoData(e.target.checked)}
          />
          <Box>
            <Flex alignItems="center" gap={2}>
              <Typography variant="omega" fontWeight="semiBold">
                Fill Empty Fields
              </Typography>
              {useDemoData && <DemoBadge>DEMO</DemoBadge>}
            </Flex>
            <Typography variant="pi" textColor="neutral500">
              Auto-generate placeholder content
            </Typography>
          </Box>
        </DemoToggleContainer>
        
        <Box padding={3}>
          <Field.Root>
            <Field.Label>Frontend URL</Field.Label>
            <TextInput
              value={frontendUrl}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => setFrontendUrl(e.target.value)}
              placeholder="http://localhost:3000"
            />
          </Field.Root>
        </Box>

        <Box>
          {displayBlocks.map((block, index) => (
            <ComponentItem
              key={index}
              $isSelected={selectedBlockIndex === index}
              onClick={() => setSelectedBlockIndex(index)}
            >
              <Flex justifyContent="space-between" alignItems="center">
                <Box>
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
                <Typography variant="pi" textColor="neutral500">
                  #{index + 1}
                </Typography>
              </Flex>
            </ComponentItem>
          ))}
        </Box>
      </Sidebar>

      {/* Sağ Alan - Preview */}
      <PreviewArea>
        {loading && (
          <PlaceholderBox>
            <Loader>Loading preview...</Loader>
          </PlaceholderBox>
        )}
        
        {!loading && !selectedBlock && (
          <PlaceholderBox>
            <Typography variant="delta" textColor="neutral600">
              👈 Select a component to preview
            </Typography>
            <Typography variant="omega" textColor="neutral500">
              Click on any component from the list on the left
            </Typography>
          </PlaceholderBox>
        )}

        {!loading && selectedBlock && previewUrl && (
          <IframeContainer>
            <PreviewFrame
              ref={iframeRef}
              src={previewUrl}
              title="Component Preview"
              sandbox="allow-same-origin allow-scripts"
            />
          </IframeContainer>
        )}
      </PreviewArea>
    </Container>
  );
};
