// AI service for handling natural language processing of calendar events
import { addDays, addHours, setHours, setMinutes } from 'date-fns';

// This is a placeholder implementation that simulates AI processing
// In a production app, this would call the OpenAI API or a local model

// Simple rule-based NLP for demo purposes
// This will be replaced with actual AI integration later
const processPrompt = async (prompt) => {
  prompt = prompt.toLowerCase();
  
  try {
    // Default values
    const now = new Date();
    let title = prompt;
    let start = now;
    let end = addHours(now, 1);
    
    // Extract date - very simple pattern matching
    if (prompt.includes('tomorrow')) {
      start = addDays(now, 1);
      end = addHours(start, 1);
    } else if (prompt.includes('next week')) {
      start = addDays(now, 7);
      end = addHours(start, 1);
    }
    
    // Extract time - very simple pattern matching
    if (prompt.includes('at ')) {
      const timeMatch = prompt.match(/at (\d+)(?::(\d+))?\s*(am|pm)?/i);
      if (timeMatch) {
        let hours = parseInt(timeMatch[1]);
        const minutes = timeMatch[2] ? parseInt(timeMatch[2]) : 0;
        const period = timeMatch[3]?.toLowerCase();
        
        // Adjust for PM
        if (period === 'pm' && hours < 12) {
          hours += 12;
        }
        // Adjust for AM
        if (period === 'am' && hours === 12) {
          hours = 0;
        }
        
        start = setHours(start, hours);
        start = setMinutes(start, minutes);
        end = addHours(start, 1);
      }
    }
    
    // Extract duration
    if (prompt.includes('for ')) {
      const durationMatch = prompt.match(/for (\d+)\s*(hour|hours|hr|hrs)/i);
      if (durationMatch) {
        const duration = parseInt(durationMatch[1]);
        end = addHours(start, duration);
      }
    }
    
    // Extract title - this is a naive approach
    // A real AI would do better at extracting the relevant information
    if (prompt.includes('meeting')) {
      title = prompt.includes('with') ? 
        `Meeting with ${prompt.split('with')[1].trim()}` : 
        'Meeting';
    } else if (prompt.includes('lunch')) {
      title = prompt.includes('with') ? 
        `Lunch with ${prompt.split('with')[1].trim()}` : 
        'Lunch';
    } else if (prompt.includes('call')) {
      title = prompt.includes('with') ? 
        `Call with ${prompt.split('with')[1].trim()}` : 
        'Call';
    }
    
    // For a real AI integration, we would use something like:
    /*
    const response = await openai.chat.completions.create({
      model: "gpt-3.5-turbo",
      messages: [
        {
          role: "system",
          content: "Extract event details from the following prompt. Respond with JSON only."
        },
        {
          role: "user",
          content: prompt
        }
      ],
      temperature: 0.7,
      max_tokens: 150,
      response_format: { type: "json_object" }
    });
    
    const parsedResponse = JSON.parse(response.choices[0].message.content);
    return {
      title: parsedResponse.title,
      start: new Date(parsedResponse.start_time),
      end: new Date(parsedResponse.end_time)
    };
    */
    
    return {
      title,
      start,
      end
    };
  } catch (error) {
    console.error('Error processing AI prompt:', error);
    throw new Error('Failed to process prompt');
  }
};

export default {
  processPrompt,
}; 