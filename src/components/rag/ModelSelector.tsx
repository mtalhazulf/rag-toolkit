interface ModelSelectorProps {
  selectedModel: 'gpt-4o-mini' | 'gpt-4o';
  setSelectedModel: (model: 'gpt-4o-mini' | 'gpt-4o') => void;
}

export function ModelSelector({ selectedModel, setSelectedModel }: ModelSelectorProps) {
  return (
    <div className="mb-6 p-4 bg-gray-50 rounded-lg">
      <h3 className="text-lg font-medium mb-2">Select OpenAI Model</h3>
      <p className="text-sm text-gray-600 mb-4">
        Choose which OpenAI model to use for generating answers. GPT-4o is more powerful but costs more.
      </p>
      <div className="flex flex-col space-y-2">
        <label className="inline-flex items-center">
          <input
            type="radio"
            className="form-radio h-5 w-5 text-blue-600"
            checked={selectedModel === 'gpt-4o-mini'}
            onChange={() => setSelectedModel('gpt-4o-mini')}
          />
          <span className="ml-2 text-gray-700">
            GPT-4o Mini
            <span className="ml-2 text-xs text-gray-500">(Faster, lower cost)</span>
          </span>
        </label>
        <label className="inline-flex items-center">
          <input
            type="radio"
            className="form-radio h-5 w-5 text-blue-600"
            checked={selectedModel === 'gpt-4o'}
            onChange={() => setSelectedModel('gpt-4o')}
          />
          <span className="ml-2 text-gray-700">
            GPT-4o
            <span className="ml-2 text-xs text-gray-500">(More powerful, higher cost)</span>
          </span>
        </label>
      </div>
    </div>
  );
} 