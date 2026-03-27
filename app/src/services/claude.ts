import { parseDataUrl } from '../utils/image';

interface IdentifyResponse {
  commonName: string;
  scientificName: string;
  habitat: string;
  diet: string;
  funFact: string;
  rarityScore: number;
}

interface ErrorResponse {
  error: string;
}

type ApiResult = IdentifyResponse | ErrorResponse;

const PROMPT = `Identify the animal in this photo. Respond with ONLY valid JSON (no markdown, no code fences):
{"commonName": "...", "scientificName": "...", "habitat": "...", "diet": "...", "funFact": "...", "rarityScore": <1-100>}

Guidelines:
- commonName: The common English name
- scientificName: The Latin binomial name
- habitat: A short description of where this animal lives (1 sentence)
- diet: What it eats (1 sentence)
- funFact: An interesting fact about this animal (1 sentence)
- rarityScore: How rare this animal is to encounter in the wild (1=extremely common like a pigeon, 100=extremely rare like a snow leopard)

If no animal is clearly visible in the image, respond with: {"error": "No animal detected in this image"}`;

export async function identifyAnimal(
  imageDataUrl: string,
  apiKey: string,
): Promise<IdentifyResponse> {
  const { base64, mediaType } = parseDataUrl(imageDataUrl);

  const res = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'x-api-key': apiKey,
      'anthropic-version': '2023-06-01',
      'content-type': 'application/json',
      'anthropic-dangerous-direct-browser-access': 'true',
    },
    body: JSON.stringify({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 1024,
      messages: [
        {
          role: 'user',
          content: [
            {
              type: 'image',
              source: { type: 'base64', media_type: mediaType, data: base64 },
            },
            { type: 'text', text: PROMPT },
          ],
        },
      ],
    }),
  });

  if (!res.ok) {
    const body = await res.text();
    throw new Error(`API error (${res.status}): ${body}`);
  }

  const data = await res.json();
  const text: string = data.content?.[0]?.text ?? '';

  // Extract JSON from the response (handle possible markdown code fences)
  const jsonMatch = text.match(/\{[\s\S]*\}/);
  if (!jsonMatch) throw new Error('Could not parse API response');

  const parsed: ApiResult = JSON.parse(jsonMatch[0]);

  if ('error' in parsed) {
    throw new Error(parsed.error);
  }

  return parsed;
}
