import React, { useState, useEffect } from 'react';
import { 
  Main, 
  Box, 
  Typography, 
  Flex, 
  Grid,
  Card,
  CardBody,
  CardContent,
  Badge,
  Loader,
  Field,
  TextInput,
  Button,
  Modal
} from '@strapi/design-system';
import { Eye } from '@strapi/icons';
import { Layouts } from '@strapi/strapi/admin';
import { useFetchClient } from '@strapi/strapi/admin';
import styled from 'styled-components';
import { PLUGIN_ID } from '../pluginId';

const ComponentCard = styled(Card)`
  cursor: pointer;
  transition: all 0.2s;
  
  &:hover {
    transform: translateY(-2px);
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
  }
`;

const CategoryBadge = styled(Badge)`
  text-transform: uppercase;
  font-size: 10px;
`;

const PreviewFrame = styled.iframe`
  width: 100%;
  height: 70vh;
  border: none;
  border-radius: 4px;
`;

interface ComponentInfo {
  uid: string;
  displayName: string;
  category: string;
  icon: string;
  attributes: Record<string, any>;
}

interface ComponentsResponse {
  components: ComponentInfo[];
  grouped: Record<string, ComponentInfo[]>;
}

export const HomePage = () => {
  const { get } = useFetchClient();
  const [components, setComponents] = useState<ComponentsResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [frontendUrl, setFrontendUrl] = useState(
    localStorage.getItem('component-preview-frontend-url') || 'http://localhost:3000'
  );
  const [previewComponent, setPreviewComponent] = useState<ComponentInfo | null>(null);
  const [previewData, setPreviewData] = useState<any>(null);
  const [previewLoading, setPreviewLoading] = useState(false);

  useEffect(() => {
    fetchComponents();
  }, []);

  const fetchComponents = async () => {
    try {
      const response = await get(`/${PLUGIN_ID}/components`);
      setComponents(response.data);
    } catch (error) {
      console.error('Failed to fetch components:', error);
    } finally {
      setLoading(false);
    }
  };

  const openPreview = async (component: ComponentInfo) => {
    setPreviewComponent(component);
    setPreviewLoading(true);
    
    try {
      // Demo data al
      const response = await get(`/${PLUGIN_ID}/demo/${encodeURIComponent(component.uid)}`);
      setPreviewData(response.data);
    } catch (error) {
      console.error('Failed to fetch demo data:', error);
      setPreviewData({ __component: component.uid, error: 'Failed to generate demo data' });
    } finally {
      setPreviewLoading(false);
    }
  };

  const getPreviewUrl = () => {
    if (!previewData) return '';
    const encodedData = btoa(encodeURIComponent(JSON.stringify(previewData)));
    return `${frontendUrl}/preview/component?data=${encodedData}`;
  };

  const saveFrontendUrl = () => {
    localStorage.setItem('component-preview-frontend-url', frontendUrl);
    alert('Frontend URL saved!');
  };

  const getCategoryColor = (category: string) => {
    const colors: Record<string, string> = {
      home: 'primary',
      shared: 'secondary',
      about: 'success',
      accessories: 'warning',
      page: 'neutral',
    };
    return colors[category] || 'neutral';
  };

  if (loading) {
    return (
      <Main>
        <Layouts.Header title="Component Preview" />
        <Layouts.Content>
          <Flex justifyContent="center" padding={8}>
            <Loader>Loading components...</Loader>
          </Flex>
        </Layouts.Content>
      </Main>
    );
  }

  return (
    <Main>
      <Layouts.Header 
        title="Component Preview" 
        subtitle="Browse and preview your page components"
      />
      <Layouts.Content>
        {/* Settings Section */}
        <Box paddingBottom={6}>
          <Card>
            <CardBody>
              <Flex gap={4} alignItems="flex-end">
                <Box style={{ flex: 1 }}>
                  <Field.Root>
                    <Field.Label>Frontend Preview URL</Field.Label>
                    <TextInput
                      value={frontendUrl}
                      onChange={(e: React.ChangeEvent<HTMLInputElement>) => setFrontendUrl(e.target.value)}
                      placeholder="http://localhost:3000"
                    />
                    <Field.Hint>The URL of your frontend application where previews will be rendered</Field.Hint>
                  </Field.Root>
                </Box>
                <Button onClick={saveFrontendUrl}>Save URL</Button>
              </Flex>
            </CardBody>
          </Card>
        </Box>

        {/* Components by Category */}
        {components?.grouped && Object.entries(components.grouped).map(([category, categoryComponents]) => (
          <Box key={category} paddingBottom={6}>
            <Flex paddingBottom={4} alignItems="center" gap={2}>
              <Typography variant="beta" fontWeight="bold" textTransform="capitalize">
                {category}
              </Typography>
              <Badge>{categoryComponents.length}</Badge>
            </Flex>
            
            <Grid.Root gap={4}>
              {categoryComponents.map((component) => (
                <Grid.Item key={component.uid} col={4} s={6} xs={12}>
                  <ComponentCard onClick={() => openPreview(component)}>
                    <CardBody>
                      <CardContent>
                        <Flex direction="column" gap={2}>
                          <Flex justifyContent="space-between" alignItems="flex-start">
                            <Typography variant="delta" fontWeight="bold">
                              {component.displayName}
                            </Typography>
                            <Button variant="ghost" size="S" startIcon={<Eye />}>
                              Preview
                            </Button>
                          </Flex>
                          <Typography variant="pi" textColor="neutral500">
                            {component.uid}
                          </Typography>
                          <Flex gap={2} wrap="wrap">
                            {Object.keys(component.attributes || {}).slice(0, 5).map((attr) => (
                              <Badge key={attr} size="S">
                                {attr}
                              </Badge>
                            ))}
                            {Object.keys(component.attributes || {}).length > 5 && (
                              <Badge size="S">
                                +{Object.keys(component.attributes).length - 5} more
                              </Badge>
                            )}
                          </Flex>
                        </Flex>
                      </CardContent>
                    </CardBody>
                  </ComponentCard>
                </Grid.Item>
              ))}
            </Grid.Root>
          </Box>
        ))}

        {/* Preview Modal */}
        {previewComponent && (
          <Modal.Root open={!!previewComponent} onOpenChange={() => setPreviewComponent(null)}>
            <Modal.Content style={{ width: '90vw', maxWidth: '1400px' }}>
              <Modal.Header>
                <Flex direction="column" gap={1}>
                  <Modal.Title>
                    Preview: {previewComponent.displayName}
                  </Modal.Title>
                  <Typography variant="pi" textColor="neutral500">
                    {previewComponent.uid} - Auto-generated demo data
                  </Typography>
                </Flex>
              </Modal.Header>
              <Modal.Body style={{ padding: 0 }}>
                {previewLoading ? (
                  <Flex justifyContent="center" padding={8}>
                    <Loader>Generating demo data...</Loader>
                  </Flex>
                ) : (
                  <PreviewFrame
                    src={getPreviewUrl()}
                    title="Component Preview"
                    sandbox="allow-same-origin allow-scripts"
                  />
                )}
              </Modal.Body>
              <Modal.Footer>
                <Flex gap={2}>
                  <Button variant="tertiary" onClick={() => setPreviewComponent(null)}>
                    Close
                  </Button>
                  <Button 
                    variant="secondary" 
                    onClick={() => {
                      navigator.clipboard.writeText(JSON.stringify(previewData, null, 2));
                      alert('Demo data copied to clipboard!');
                    }}
                  >
                    Copy Demo Data
                  </Button>
                </Flex>
              </Modal.Footer>
            </Modal.Content>
          </Modal.Root>
        )}

        {/* Usage Instructions */}
        <Box paddingTop={4}>
          <Card>
            <CardBody>
              <CardContent>
                <Typography variant="delta" fontWeight="bold" paddingBottom={4}>
                  📖 How to Use
                </Typography>
                <Box paddingTop={3}>
                  <ol style={{ paddingLeft: '20px', lineHeight: '2' }}>
                    <li>Set your frontend URL above (e.g., http://localhost:3000)</li>
                    <li><strong>Quick Preview:</strong> Click any component card above to see it with auto-generated demo data</li>
                    <li><strong>Page Preview:</strong> Go to Content Manager → Pages → Edit a page</li>
                    <li>Click the "Preview Components" button in the right sidebar</li>
                    <li>Toggle "Fill Empty Fields" to auto-generate placeholder content</li>
                  </ol>
                </Box>
                <Box paddingTop={4}>
                  <Typography variant="omega" textColor="neutral600">
                    Note: Your frontend needs to have a <code>/preview/component</code> route that handles the preview rendering.
                    See the documentation for frontend setup instructions.
                  </Typography>
                </Box>
              </CardContent>
            </CardBody>
          </Card>
        </Box>
      </Layouts.Content>
    </Main>
  );
};
