import { extractDonkiDataWithLLM } from './llm';

/**
 * Post-processes the DONKI/notifications response, appending processedMessage to items with messageType: 'Report'.
 * @param responseText NASA API response as JSON string
 * @returns Promise<any> with the modified response object (array or original)
 */
export async function processDonkiNotificationsResponse(responseText: string): Promise<any> {
  console.log('[DONKI LLM] processDonkiNotificationsResponse input type:', typeof responseText);
  if (typeof responseText === 'string') {
    console.log('[DONKI LLM] processDonkiNotificationsResponse input (first 500 chars):', responseText.slice(0, 500));
  }
  try {
    const json = JSON.parse(responseText);
    console.log('[DONKI LLM] Parsed JSON type:', Array.isArray(json) ? 'array' : typeof json, 
      'length:', Array.isArray(json) ? json.length : undefined);
    if (Array.isArray(json)) {
      await Promise.all(json.map(async (item, idx) => {
        if (item.messageType === 'Report' && item.messageBody) {
          try {
            console.log(`[DONKI LLM] [${idx}] Processing message...`);
            item.processedMessage = await extractDonkiDataWithLLM(item.messageBody);
            console.log(`[DONKI LLM] [${idx}] LLM processing complete`);
          } catch (e) {
            console.error(`[DONKI LLM] [${idx}] LLM processing failed:`, e);
            // Do not add processedMessage if LLM fails
          }
        } else if (item.messageType === 'Report') {          
          console.warn(`[DONKI LLM] [${idx}] No message to process. messageType:`, item.messageType, 
            'messageBody:', item.messageBody);          
        }
      }));
      return json;
    }
  } catch (e) {
    console.error('[DONKI LLM] Error processing DONKI notifications response', e);
    // If parsing or processing fails, just return the original data
  }
  // If not an array or error, return the original parsed or string
  try {
    return JSON.parse(responseText);
  } catch {
    return responseText;
  }
} 