'use client';

import { useSearchParams } from 'next/navigation';
import { useMemo, Suspense, useEffect } from 'react';
import { ComponentRegistry } from '@/utils/component-registry';

interface ComponentData {
    __component: string;
    id?: number;
    [key: string]: unknown;
}

function ComponentRenderer({ block }: { block: ComponentData }) {
    const Component = ComponentRegistry[block.__component];

    if (!Component) {
        return (
            <div className="p-8 bg-yellow-50 border border-yellow-200 rounded-lg m-4">
                <p className="text-yellow-800 font-semibold">
                    Unknown component: {block.__component}
                </p>
                <details className="mt-4">
                    <summary className="cursor-pointer text-yellow-700 text-sm">
                        View component data
                    </summary>
                    <pre className="mt-2 text-xs overflow-auto bg-yellow-100 p-4 rounded">
                        {JSON.stringify(block, null, 2)}
                    </pre>
                </details>
            </div>
        );
    }

    return (
        <Suspense
            fallback={
                <div className="flex items-center justify-center p-8">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                </div>
            }
        >
            <Component {...block} />
        </Suspense>
    );
}

function PreviewContent() {
    const searchParams = useSearchParams();

    const { componentData, error } = useMemo(() => {
        const data = searchParams.get('data');
        if (!data) return { componentData: null, error: null };

        try {
            // Decode base64 and then URI decode
            const decoded = decodeURIComponent(atob(data));
            return { componentData: JSON.parse(decoded) as ComponentData, error: null };
        } catch (err) {
            console.error('Failed to parse component data:', err);
            return { 
                componentData: null, 
                error: err instanceof Error ? err.message : 'Failed to parse component data' 
            };
        }
    }, [searchParams]);

    // Notify parent (Strapi admin) that preview is ready
    useEffect(() => {
        window.parent?.postMessage({ type: 'PREVIEW_READY' }, '*');
    }, [componentData]);

    if (error) {
        return (
            <div className="flex items-center justify-center min-h-screen bg-red-50">
                <div className="text-center p-8 max-w-md">
                    <div className="text-red-500 text-5xl mb-4">⚠️</div>
                    <h1 className="text-xl font-bold text-red-800 mb-2">Preview Error</h1>
                    <p className="text-red-600 text-sm">{error}</p>
                </div>
            </div>
        );
    }

    if (!componentData) {
        return (
            <div className="flex items-center justify-center min-h-screen bg-gray-50">
                <div className="text-center p-8">
                    <div className="text-gray-400 text-5xl mb-4">🔍</div>
                    <h1 className="text-2xl font-bold text-gray-800 mb-2">No Preview Data</h1>
                    <p className="text-gray-600">Select a component from Strapi admin to preview</p>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen p-2">
            {/* Component Preview */}
            <div className="preview-container">
                <ComponentRenderer block={componentData} />
            </div>
        </div>
    );
}

export default function PreviewPage() {
    return (
        <Suspense
            fallback={
                <div className="flex items-center justify-center min-h-screen bg-gray-100">
                    <div className="text-center">
                        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
                        <p className="text-gray-600">Loading preview...</p>
                    </div>
                </div>
            }
        >
            <PreviewContent />
        </Suspense>
    );
}
