import { useState, useEffect, useCallback } from 'react';
import { X, Sparkles, FileText, Upload, Loader2 } from 'lucide-react';
import type { Task, TaskCreate, TaskUpdate } from '../types';
import { TaskStatus, TaskPriority } from '../types';
import { aiService, driveService } from '../services';

interface TaskFormProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: TaskCreate | TaskUpdate) => void;
  task?: Task | null;
  initialStatus?: TaskStatus;
}

const statusLabels: Record<TaskStatus, string> = {
  [TaskStatus.TODO]: 'To Do',
  [TaskStatus.IN_PROGRESS]: 'In Progress',
  [TaskStatus.DONE]: 'Done',
};

interface ValidationErrors {
  title?: string;
}

interface AIReport {
  report: string;
  filename: string;
}

export function TaskForm({
  isOpen,
  onClose,
  onSubmit,
  task,
  initialStatus = TaskStatus.TODO,
}: TaskFormProps) {
  const isEditing = !!task;

  const [formData, setFormData] = useState<TaskCreate>({
    title: '',
    description: '',
    status: initialStatus,
    priority: TaskPriority.MEDIUM,
    tags: [],
  });

  const [errors, setErrors] = useState<ValidationErrors>({});
  const [touched, setTouched] = useState<Record<string, boolean>>({});
  
  // AI Analysis states
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [aiReport, setAiReport] = useState<AIReport | null>(null);
  const [showAIReport, setShowAIReport] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [uploadSuccess, setUploadSuccess] = useState<string | null>(null);

  useEffect(() => {
    if (task) {
      setFormData({
        title: task.title,
        description: task.description || '',
        status: task.status,
        priority: task.priority,
        due_date: task.due_date?.split('T')[0],
        tags: [...task.tags],
        assignee: task.assignee || '',
        estimated_hours: task.estimated_hours,
      });
    } else {
      setFormData({
        title: '',
        description: '',
        status: initialStatus,
        priority: TaskPriority.MEDIUM,
        tags: [],
      });
    }
    setErrors({});
    setTouched({});
    setAiReport(null);
    setShowAIReport(false);
    setUploadError(null);
    setUploadSuccess(null);
  }, [task, initialStatus, isOpen]);

  const validateField = useCallback((name: keyof TaskCreate, value: unknown): string | undefined => {
    if (name === 'title') {
      if (!value || (typeof value === 'string' && value.trim().length < 1)) {
        return 'Title is required';
      }
    }
    return undefined;
  }, []);

  const validateForm = useCallback((): boolean => {
    const newErrors: ValidationErrors = {};
    const titleError = validateField('title', formData.title);
    if (titleError) newErrors.title = titleError;
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }, [formData, validateField]);

  const handleFieldChange = (field: keyof TaskCreate, value: unknown) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (touched[field]) {
      const error = validateField(field, value);
      setErrors(prev => ({ ...prev, [field]: error }));
    }
  };

  const handleBlur = (field: keyof TaskCreate) => {
    setTouched(prev => ({ ...prev, [field]: true }));
    const error = validateField(field, formData[field]);
    setErrors(prev => ({ ...prev, [field]: error }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setTouched({ title: true });
    if (validateForm()) {
      onSubmit(formData);
      onClose();
    }
  };

  const handleAIAnalysis = async () => {
    if (!formData.title.trim()) {
      setTouched(prev => ({ ...prev, title: true }));
      return;
    }

    setIsAnalyzing(true);
    setUploadError(null);
    setUploadSuccess(null);

    try {
      const response = await aiService.generateReport({
        title: formData.title,
        description: formData.description || '',
        priority: formData.priority || 'medium',
        status: formData.status || 'todo',
        tags: formData.tags || [],
        due_date: formData.due_date,
        estimated_hours: formData.estimated_hours,
      });

      setAiReport({
        report: response.report,
        filename: response.filename,
      });
      setShowAIReport(true);
    } catch (error) {
      setUploadError(error instanceof Error ? error.message : 'Failed to analyze task');
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleUploadToDrive = async () => {
    if (!aiReport) return;

    // Get Google access token from user
    const accessToken = prompt('Please enter your Google access token (from OAuth):');
    if (!accessToken) {
      setUploadError('Access token is required to upload to Google Drive');
      return;
    }

    setIsUploading(true);
    setUploadError(null);
    setUploadSuccess(null);

    try {
      const response = await driveService.uploadReport(
        {
          filename: aiReport.filename,
          content: aiReport.report,
          task_title: formData.title,
        },
        accessToken
      );

      setUploadSuccess(`Report uploaded successfully! View it here: ${response.view_url}`);
    } catch (error) {
      setUploadError(error instanceof Error ? error.message : 'Failed to upload to Google Drive');
    } finally {
      setIsUploading(false);
    }
  };

  const isFormValid = !errors.title && formData.title.trim().length > 0;

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-md animate-scale-in">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900">
            {isEditing ? 'Edit Task' : 'New Task'}
          </h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6">
          <div className="space-y-4">
            {/* Title */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                Task Name <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={formData.title}
                onChange={(e) => handleFieldChange('title', e.target.value)}
                onBlur={() => handleBlur('title')}
                className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 transition-all ${
                  errors.title && touched.title
                    ? 'border-red-300 focus:border-red-500 focus:ring-red-200'
                    : 'border-gray-300 focus:border-blue-500 focus:ring-blue-200'
                }`}
                placeholder="Enter task name"
              />
              {errors.title && touched.title && (
                <p className="mt-1 text-sm text-red-600">{errors.title}</p>
              )}
            </div>

            {/* Status */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                Status
              </label>
              <select
                value={formData.status}
                onChange={(e) => handleFieldChange('status', e.target.value as TaskStatus)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-200 focus:border-blue-500"
              >
                {Object.entries(statusLabels).map(([value, label]) => (
                  <option key={value} value={value}>
                    {label}
                  </option>
                ))}
              </select>
            </div>

            {/* Description */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                Description
              </label>
              <textarea
                value={formData.description}
                onChange={(e) => handleFieldChange('description', e.target.value)}
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-200 focus:border-blue-500 resize-none"
                placeholder="Add a description..."
              />
              
              {/* AI Analysis Button */}
              <button
                type="button"
                onClick={handleAIAnalysis}
                disabled={isAnalyzing || !formData.title.trim()}
                className="mt-2 flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-purple-500 to-purple-600 hover:from-purple-600 hover:to-purple-700 disabled:from-gray-300 disabled:to-gray-400 disabled:cursor-not-allowed text-white rounded-lg font-medium transition-all duration-200 shadow-sm"
              >
                {isAnalyzing ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Analyzing...
                  </>
                ) : (
                  <>
                    <Sparkles className="w-4 h-4" />
                    AI Analysis
                  </>
                )}
              </button>
            </div>
          </div>
        </form>

        {/* Footer */}
        <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-gray-200 bg-gray-50 rounded-b-xl">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-gray-700 hover:bg-gray-200 rounded-lg transition-colors font-medium"
          >
            Cancel
          </button>
          <button
            type="submit"
            onClick={handleSubmit}
            disabled={!isFormValid}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed text-white rounded-lg transition-colors font-medium"
          >
            {isEditing ? 'Update Task' : 'Create Task'}
          </button>
        </div>
      </div>

      {/* AI Report Modal */}
      {showAIReport && aiReport && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/60 p-4">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-2xl max-h-[80vh] flex flex-col animate-scale-in">
            {/* Modal Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 bg-gradient-to-r from-purple-50 to-blue-50 rounded-t-xl">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-purple-100 rounded-lg">
                  <Sparkles className="w-5 h-5 text-purple-600" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">AI Task Analysis</h3>
                  <p className="text-sm text-gray-500">Review the generated report before uploading</p>
                </div>
              </div>
              <button
                onClick={() => setShowAIReport(false)}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <X className="w-5 h-5 text-gray-500" />
              </button>
            </div>

            {/* Report Content */}
            <div className="flex-1 overflow-auto p-6">
              <div className="bg-gray-50 rounded-lg border border-gray-200 p-4">
                <div className="flex items-center gap-2 mb-3 pb-3 border-b border-gray-200">
                  <FileText className="w-4 h-4 text-gray-400" />
                  <span className="text-sm font-medium text-gray-600">{aiReport.filename}</span>
                </div>
                <pre className="text-sm text-gray-700 whitespace-pre-wrap font-mono leading-relaxed">
                  {aiReport.report}
                </pre>
              </div>

              {/* Status Messages */}
              {uploadError && (
                <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
                  {uploadError}
                </div>
              )}
              {uploadSuccess && (
                <div className="mt-4 p-3 bg-green-50 border border-green-200 rounded-lg text-green-700 text-sm">
                  {uploadSuccess}
                </div>
              )}
            </div>

            {/* Modal Footer */}
            <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-gray-200 bg-gray-50 rounded-b-xl">
              <button
                onClick={() => setShowAIReport(false)}
                className="px-4 py-2 text-gray-700 hover:bg-gray-200 rounded-lg transition-colors font-medium"
              >
                Close
              </button>
              <button
                onClick={handleUploadToDrive}
                disabled={isUploading}
                className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 disabled:from-gray-300 disabled:to-gray-400 disabled:cursor-not-allowed text-white rounded-lg font-medium transition-all duration-200"
              >
                {isUploading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Uploading...
                  </>
                ) : (
                  <>
                    <Upload className="w-4 h-4" />
                    Upload to Google Drive
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
