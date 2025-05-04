import { useState } from 'react';
import { useToast } from '@/hooks/use-toast';

interface DescriptionEditorProps {
  initialValue?: string;
  onSave?: (description: string) => void;
  placeholder?: string;
  maxLength?: number;
  className?: string;
}

const DescriptionEditor = ({
  initialValue = '',
  onSave,
  placeholder = 'Add a description of your service...',
  maxLength = 1000,
  className = '',
}: DescriptionEditorProps) => {
  const [description, setDescription] = useState(initialValue);
  const [isEditing, setIsEditing] = useState(false);
  const { toast } = useToast();

  const handleSave = () => {
    if (description.trim().length === 0) {
      toast({
        title: "Description required",
        description: "Please enter a description before saving.",
        variant: "destructive",
      });
      return;
    }

    if (onSave) {
      onSave(description);
    }
    setIsEditing(false);
  };

  const handleCancel = () => {
    setDescription(initialValue);
    setIsEditing(false);
  };

  return (
    <div className={`space-y-3 ${className}`}>
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-medium">Description</h3>
        {!isEditing && (
          <button
            type="button"
            onClick={() => setIsEditing(true)}
            className="text-xs text-primary hover:text-primary/80 font-medium"
          >
            {initialValue ? 'Edit' : 'Add'}
          </button>
        )}
      </div>

      {isEditing ? (
        <>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value.slice(0, maxLength))}
            placeholder={placeholder}
            rows={5}
            className="w-full p-3 border border-border rounded-md focus:ring-2 focus:ring-primary focus:border-primary outline-none text-text-primary resize-none"
          />
          <div className="flex justify-between items-center">
            <span className="text-xs text-text-secondary">
              {description.length}/{maxLength} characters
            </span>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={handleCancel}
                className="px-3 py-1 rounded-md border border-border text-sm hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleSave}
                className="px-3 py-1 rounded-md bg-primary text-white text-sm hover:bg-primary/90"
              >
                Save
              </button>
            </div>
          </div>
        </>
      ) : (
        <div className="p-3 bg-gray-50 rounded-md border border-border min-h-[100px]">
          {description ? (
            <p className="text-text-primary whitespace-pre-wrap">{description}</p>
          ) : (
            <p className="text-text-secondary italic">{placeholder}</p>
          )}
        </div>
      )}
    </div>
  );
};

export default DescriptionEditor;