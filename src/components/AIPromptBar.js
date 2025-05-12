import React, { useState } from 'react';

function AIPromptBar({ onSubmit }) {
  const [prompt, setPrompt] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!prompt.trim()) return;
    
    setIsLoading(true);
    
    try {
      await onSubmit(prompt);
      setPrompt('');
    } catch (error) {
      console.error('Error processing AI prompt:', error);
      // Handle error - show notification, etc.
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="ai-prompt-bar">
      <form onSubmit={handleSubmit}>
        <input
          type="text"
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
          placeholder="Schedule an event with AI... (e.g., 'Meeting with John tomorrow at 3pm')"
          disabled={isLoading}
        />
        <button type="submit" disabled={isLoading || !prompt.trim()}>
          {isLoading ? 'Processing...' : 'Schedule'}
        </button>
      </form>
    </div>
  );
}

export default AIPromptBar; 