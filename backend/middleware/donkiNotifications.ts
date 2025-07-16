import { Request, Response, NextFunction } from 'express';
import { processDonkiNotificationsResponse } from '../services/donkiNotifications';

/**
 * Middleware to process DONKI/notifications responses and append LLM results.
 * Only acts on GET requests to /donki/notifications endpoints.
 */
export default function donkiNotificationsMiddleware(req: Request, res: Response, next: NextFunction) {
  if (req.method === 'GET' && /donki\/notifications/i.test(req.originalUrl)) {
    // Intercept res.send to process the response before sending
    const originalSend = res.send.bind(res);
    res.send = (body: any) => {
      (async () => {
        try {
          const responseText = typeof body === 'string' ? body : body.toString('utf-8');
          const processed = await processDonkiNotificationsResponse(responseText);
          res.setHeader('Content-Type', 'application/json');
          originalSend(JSON.stringify(processed));
        } catch (e) {
          // If processing fails, send the original body
          originalSend(body);
        }
      })();
      return res;
    };
  }
  next();
} 