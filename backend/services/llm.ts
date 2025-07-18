import axios from 'axios';

// LLM config facility
function getLLMConfig() {
  return {
    apiUrl: process.env.GROQ_API_URL || 'https://api.groq.com/openai/v1/chat/completions',
    apiKey: process.env.GROQ_API_KEY || 'YOUR_GROQ_API_KEY',
    model: process.env.GROQ_LLM_MODEL || 'llama-3.1-8b-instant', //  llama-3.1-8b-instant or gemma2-9b-it
    maxTokens: process.env.GROQ_MAX_TOKENS ? parseInt(process.env.GROQ_MAX_TOKENS, 10) : 10000,
  };
}

function extractJsonFromText(text: string): any {  
  try {
    return JSON.parse(text);
  } catch {}
  // Try to extract text between ```json and ```
  const jsonFenceMatch = text.match(/```json[\s\r\n]*([\s\S]*?)```/i);
  if (jsonFenceMatch && jsonFenceMatch[1]) {
    const jsonString = jsonFenceMatch[1].trim();
    try {
      return JSON.parse(jsonString);
    } catch {}
  }
  // Fallback: try to extract the first {...} JSON object from anywhere in the text
  const jsonObjectMatch = text.match(/\{[\s\S]*\}/);
  if (jsonObjectMatch) {
    try {
      return JSON.parse(jsonObjectMatch[0]);
    } catch {}
  }
  // If still not valid JSON, return as raw text
  return { raw: text };
}

/**
 * Extracts structured data from a NASA Donki report using Groq's LLM.
 * @param reportText The raw NASA Donki report text.
 * @returns The extracted data as a JSON object.
 */
export async function extractDonkiDataWithLLM(reportText: string): Promise<any> {
  const { apiUrl, apiKey, model, maxTokens } = getLLMConfig();

  const prompt = `Extract the following NASA Donki report into a structured JSON object with clearly labeled fields 
  (such as event type, date, location, summary, and any other relevant information). The report is markdown poorly structured and inconsistent.
  Also be consistent and use as keys for tables and the things you see as important in
   Convert dates to a nice format visually.
   For data in tables make sure we store the units for the data.
   Make sure you keep the order of events in the tables.
   Add a field "ai summary" where you interpret this report for general public in few words
   Return only the JSON object, adhering to the following schema:

{
  "header": {
    "source": "string",
    "message_type": "string",
    "issue_date": "string",
    "coverage_begin_date": "string",
    "coverage_end_date": "string",
    "message_id": "string",
    "disclaimer": "string"
  },
  "summary": {
    "solar_activity": "string",
    "cme_impacts": [
      {
        "start_time": "string",
        "predicted_impacts": [
          {
            "location": "string",
            "arrival_time": "string",
            "impact_type": "string",
            "notification": "string"
          }
        ]
      }
    ],
    "geomagnetic_activity": "string",
    "energetic_electron_flux": "string",
    "energetic_proton_flux": "string",
    "space_weather_impact": "string"
  },
  "events": {
    "flares": [
      {
        "event_type": "string",
        "date": "string",
        "start_time": "string",
        "stop_time": "string",
        "peak_time": "string",
        "class": "string",
        "location": "string"
      }
    ],
    "cmes": {
      "earth_directed": [
        {
          "event_type": "string",
          "start_time": "string",
          "speed": {"value": "string", "unit": "string"},
          "type": "string",
          "direction": "string",
          "half_angle_width": {"value": "string", "unit": "string"},
          "detecting_spacecraft": "string"
        }
      ],
      "non_earth_directed": [
        {
          "event_type": "string",
          "start_time": "string",
          "speed": {"value": "string", "unit": "string"},
          "type": "string",
          "direction": "string",
          "half_angle_width": {"value": "string", "unit": "string"},
          "detecting_spacecraft": "string"
        }
      ]
    }
  },
  "outlook": {
    "coverage_begin_date": "string",
    "coverage_end_date": "string",
    "solar_activity": "string",
    "geomagnetic_activity": "string"
  },
  "notes": "string",
  "ai_summary": "string"
}

- Use "event_type" to label events as "Flare" or "CME".
- For tables (flares, CMEs), maintain the exact order of events as in the input.
- Categorize CMEs into "earth_directed" and "non_earth_directed" based on the report's explicit sections "Earth directed" and "Non-Earth directed (POS = Plane Of Sky)". If a CME is listed under "Earth directed", place it in "earth_directed"; otherwise, place it in "non_earth_directed".
- Include units for table data (e.g., speed in km/s, half_angle_width in degrees).
- Format all dates as "Month Day, Year HH:MM UTC" (e.g., "July 3, 2025 07:08 UTC").
- If a field is missing, use null.
- For the "ai_summary", provide a 2-3 sentence summary for the general public, explaining the report's significance in simple terms.
  "${reportText}\"\"\"\n\n Return only the JSON object.`;
  console.log(`[LLM] Prompt length: ${prompt.length}, model: ${model}, max_tokens: ${maxTokens}`);

  const requestPayload = {
    model,
    messages: [
      { role: 'system', content: `You are a precise data extraction tool that extracts poorly structured data from NASA Donki reports.` },
      { role: 'user', content: prompt }
    ],
    max_tokens: maxTokens,
    temperature: 0.2,
    seed: 1,
    response_format: { type: 'json_object' }
  };  

  try {
    const response = await axios.post(
      apiUrl,
      requestPayload,
      {
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Content-Type': 'application/json'
        }
      }
    );
    const { choices, ...rest } = response.data;
    console.log('[LLM] Response metadata:', JSON.stringify(rest, null, 2));
    const text = response.data.choices?.[0]?.message?.content || '';
    return extractJsonFromText(text);
  } catch (error: any) {
    console.error('[LLM] Error during request:', error?.response?.data || error.message);
    throw new Error(`Failed to extract data with LLM: ${error.message}`);
  }
}
