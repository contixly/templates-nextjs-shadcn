"use client";

import * as React from "react";

/**
 * Represents metadata information for a document.
 */
type DocumentMetadata = {
  title: string | null;
  description: string | null;
  category?: { id: string; name: string; colorId: string } | null;
};

/**
 * Represents the context value for a document, combining document metadata
 * and handlers to manipulate the metadata.
 *
 * This type is used to encapsulate both the metadata associated with a document
 * and the functionality for updating or resetting it.
 *
 * Extends:
 * - `DocumentMetadata`: A base interface or type that contains the metadata properties of a document.
 *
 * Properties:
 * - `handlers`: An object containing methods to modify document metadata.
 *
 * Handlers:
 * - `setTitle`: Updates the title of the document. Accepts a string value for the title or null to clear it.
 * - `setDescription`: Updates the description of the document. Accepts a string value for the description or null to clear it.
 * - `setMetadata`: Updates multiple metadata fields of the document. Accepts a partial representation of `DocumentMetadata` to apply changes.
 * - `resetMetadata`: Resets all metadata fields of the document to their default or initial state.
 */
type DocumentContextValue = DocumentMetadata & {
  documentActions?: React.ReactNode | null;
  handlers: {
    setTitle: (title: string | null) => void;
    setDescription: (description: string | null) => void;
    setMetadata: (metadata: Partial<DocumentMetadata>) => void;
    resetMetadata: () => void;
    setDocumentActions: (actions: React.ReactNode) => void;
    resetDocumentActions: () => void;
  };
};

const DocumentContext = React.createContext<DocumentContextValue | null>(null);

/**
 * DocumentProvider is a React functional component that provides a context for managing
 * and sharing document metadata, such as the title and description, across the component tree.
 * It uses React Context API to store document metadata values and expose handlers for manipulating them.
 *
 * This provider should wrap the components that need access to the document metadata context.
 *
 * @param {Object} props - The props for the component.
 * @param {React.ReactNode} props.children - Child components that will consume the context.
 *
 * State:
 * - `title`: A string or null representing the document's title.
 * - `description`: A string or null representing the document's description.
 *
 * Handlers exposed in the context:
 * - `setTitle`: Updates the document's title.
 * - `setDescription`: Updates the document's description.
 * - `setMetadata`: Sets metadata values for the title and/or description using a partial metadata object.
 * - `resetMetadata`: Resets both the title and description to null.
 *
 * Context Value:
 * The value provided to the consumers of the context is an object containing:
 * - `title`: Current title of the document.
 * - `description`: Current description of the document.
 * - `handlers`: An object with the methods `setTitle`, `setDescription`, `setMetadata`, and `resetMetadata`
 *   to manipulate the document metadata.
 */
export const DocumentProvider = ({ children }: { children: React.ReactNode }) => {
  const [title, setTitleState] = React.useState<string | null>(null);
  const [description, setDescriptionState] = React.useState<string | null>(null);
  const [category, setCategoryState] = React.useState<DocumentMetadata["category"]>(null);
  const [documentActions, setDocumentActionsState] = React.useState<React.ReactNode>(null);

  const setTitle = React.useCallback((nextTitle: string | null) => {
    setTitleState(nextTitle);
  }, []);

  const setDescription = React.useCallback((nextDescription: string | null) => {
    setDescriptionState(nextDescription);
  }, []);

  const setMetadata = React.useCallback((metadata: Partial<DocumentMetadata>) => {
    if (Object.prototype.hasOwnProperty.call(metadata, "title")) {
      setTitleState(metadata.title ?? null);
    }
    if (Object.prototype.hasOwnProperty.call(metadata, "description")) {
      setDescriptionState(metadata.description ?? null);
    }
    if (Object.prototype.hasOwnProperty.call(metadata, "category")) {
      setCategoryState(metadata.category ?? null);
    }
  }, []);

  const resetMetadata = React.useCallback(() => {
    setTitleState(null);
    setDescriptionState(null);
    setCategoryState(null);
  }, []);

  const setDocumentActions = React.useCallback((actions: React.ReactNode) => {
    setDocumentActionsState(actions);
  }, []);

  const resetDocumentActions = React.useCallback(() => {
    setDocumentActionsState(null);
  }, []);

  const value = React.useMemo<DocumentContextValue>(
    () => ({
      title,
      description,
      category,
      documentActions,
      handlers: {
        setTitle,
        setDescription,
        setMetadata,
        resetMetadata,
        setDocumentActions,
        resetDocumentActions,
      },
    }),
    [
      title,
      description,
      category,
      documentActions,
      setTitle,
      setDescription,
      setMetadata,
      resetMetadata,
      setDocumentActions,
      resetDocumentActions,
    ]
  );

  return <DocumentContext.Provider value={value}>{children}</DocumentContext.Provider>;
};

export const useDocument = () => {
  const context = React.use(DocumentContext);

  if (!context) {
    throw new Error("useDocument must be used within DocumentProvider.");
  }

  return context;
};
