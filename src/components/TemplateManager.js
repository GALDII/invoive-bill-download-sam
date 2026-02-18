import React, { useState } from 'react';
import { FileText, Trash2, Copy, Save } from 'lucide-react';
import Button from './ui/Button';
import Card from './ui/Card';
import Modal from './ui/Modal';
import InputGroup from './ui/InputGroup';
import ConfirmDialog from './ui/ConfirmDialog';

const TemplateManager = ({ templates, onSaveTemplate, onLoadTemplate, onDeleteTemplate }) => {
  const [showSaveModal, setShowSaveModal] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(null);
  const [templateName, setTemplateName] = useState('');

  const handleSaveTemplate = () => {
    if (!templateName.trim()) {
      alert('Please enter a template name');
      return;
    }
    onSaveTemplate(templateName);
    setTemplateName('');
    setShowSaveModal(false);
  };

  return (
    <>
      <Card title="Invoice Templates" icon={<FileText className="text-indigo-500" />}>
        <div className="space-y-4">
          <Button onClick={() => setShowSaveModal(true)} variant="secondary" className="w-full">
            <Save size={16} /> Save Current Invoice as Template
          </Button>

          <div className="space-y-2 max-h-64 overflow-y-auto">
            {templates.length === 0 ? (
              <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                No templates saved
              </div>
            ) : (
              templates.map((template) => (
                <div
                  key={template.id}
                  className="flex items-center justify-between p-3 bg-gray-50 dark:bg-slate-900 rounded-lg border border-gray-200 dark:border-slate-700"
                >
                  <div>
                    <h4 className="font-medium text-gray-900 dark:text-white">
                      {template.name}
                    </h4>
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                      Created: {new Date(template.createdAt).toLocaleDateString()}
                    </p>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      variant="ghost"
                      onClick={() => onLoadTemplate(template.id)}
                      title="Apply Template"
                    >
                      <Copy size={16} />
                    </Button>
                    <Button
                      variant="ghost"
                      onClick={() => setShowDeleteConfirm(template.id)}
                      title="Delete"
                    >
                      <Trash2 size={16} className="text-red-500" />
                    </Button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </Card>

      {/* Save Template Modal */}
      <Modal
        isOpen={showSaveModal}
        onClose={() => {
          setShowSaveModal(false);
          setTemplateName('');
        }}
        title="Save Template"
        size="sm"
      >
        <div className="space-y-4">
          <InputGroup
            label="Template Name"
            value={templateName}
            onChange={(e) => setTemplateName(e.target.value)}
            placeholder="e.g., Standard Invoice"
            required
          />
          <div className="flex gap-2 justify-end">
            <Button variant="secondary" onClick={() => setShowSaveModal(false)}>
              Cancel
            </Button>
            <Button onClick={handleSaveTemplate}>
              Save Template
            </Button>
          </div>
        </div>
      </Modal>

      {/* Delete Confirmation */}
      <ConfirmDialog
        isOpen={showDeleteConfirm !== null}
        onClose={() => setShowDeleteConfirm(null)}
        onConfirm={() => {
          onDeleteTemplate(showDeleteConfirm);
          setShowDeleteConfirm(null);
        }}
        title="Delete Template"
        message="Are you sure you want to delete this template?"
        confirmText="Delete"
        cancelText="Cancel"
        variant="danger"
      />
    </>
  );
};

export default TemplateManager;

