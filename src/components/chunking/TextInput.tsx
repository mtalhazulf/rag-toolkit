interface TextInputProps {
  text: string;
  setText: (text: string) => void;
}

export function TextInput({ text, setText }: TextInputProps) {
  return (
    <div className="mb-6">
      <label className="block text-sm font-medium text-black mb-2">
        <div className="flex items-center justify-between">
          <span>Input Text:</span>
          <span className="text-xs text-black">{text.length} characters</span>
        </div>
        <textarea
          value={text}
          onChange={(e) => setText(e.target.value)}
          className="mt-1 block w-full rounded-md border border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 h-48 p-3 text-base text-black font-mono"
          placeholder="Enter or paste your text here..."
          required
        />
      </label>
    </div>
  );
} 