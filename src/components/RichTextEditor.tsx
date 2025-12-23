"use client";

import { useEffect, useState } from "react";

interface RichTextEditorProps {
    value?: string;
    onChange?: (value: string) => void;
    placeholder?: string;
    className?: string;
}

// Wrapper component for @shadcn-editor/editor
// This component will try to use shadcn editor if available, otherwise fallback to textarea
const RichTextEditor: React.FC<RichTextEditorProps> = ({
    value,
    onChange,
    placeholder = "Nhập nội dung...",
    className = "",
}) => {
    const [EditorComponent, setEditorComponent] = useState<any>(null);
    const [isMounted, setIsMounted] = useState(false);
    const [editorState, setEditorState] = useState<any>(null);

    useEffect(() => {
        setIsMounted(true);
    }, []);

    useEffect(() => {
        if (!isMounted) return;

        // Try to dynamically import shadcn editor from the standard location
        const loadEditor = async () => {
            try {
                // Standard path for shadcn-editor after installation
                // Using relative path for better build-time resolution
                const EditorModule =
                    await import("../blocks/editor-00");
                const Editor =
                    EditorModule.default || EditorModule.Editor || EditorModule;
                if (Editor) {
                    setEditorComponent(() => Editor);
                    // Parse initial value if it's a JSON string
                    if (value) {
                        try {
                            const parsed = JSON.parse(value);
                            setEditorState(parsed);
                        } catch {
                            // If not JSON, create initial state from plain text
                            setEditorState({
                                root: {
                                    children: [
                                        {
                                            children: [
                                                {
                                                    detail: 0,
                                                    format: 0,
                                                    mode: "normal",
                                                    style: "",
                                                    text: value,
                                                    type: "text",
                                                    version: 1,
                                                },
                                            ],
                                            direction: "ltr",
                                            format: "",
                                            indent: 0,
                                            type: "paragraph",
                                            version: 1,
                                        },
                                    ],
                                    direction: "ltr",
                                    format: "",
                                    indent: 0,
                                    type: "root",
                                    version: 1,
                                },
                            });
                        }
                    }
                    return;
                }
            } catch (error) {
                // Editor not found, will use textarea fallback
                console.warn(
                    "@shadcn-editor/editor not found at @/components/blocks/editor-00, using textarea fallback",
                );
            }
        };

        loadEditor();
    }, [isMounted, value]);

    // If editor component is available, use it
    if (EditorComponent && isMounted) {
        return (
            <div className={className}>
                <EditorComponent
                    editorSerializedState={editorState}
                    onSerializedChange={(newState: any) => {
                        setEditorState(newState);
                        // Convert editor state to JSON string for storage
                        const stringValue = JSON.stringify(newState);
                        onChange?.(stringValue);
                    }}
                />
            </div>
        );
    }

    // Fallback to textarea
    return (
        <div className={className}>
            <textarea
                value={value || ""}
                onChange={(e) => onChange?.(e.target.value)}
                placeholder={placeholder}
                className="w-full min-h-[200px] p-3 border border-gray-300 rounded resize-y focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                style={{ minHeight: "200px" }}
            />
        </div>
    );
};

export default RichTextEditor;

