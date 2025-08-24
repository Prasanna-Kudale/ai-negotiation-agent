const API_BASE_URL = 'http://localhost:8000';

export interface NegotiationRequest {
  productName: string;
  currentPrice: number;
  desiredPrice?: number;
  tone: 'polite' | 'friendly' | 'assertive';
}

export interface NegotiationResponse {
  message: string;
  suggestedPrice: number;
  competitorPrices: any[];
  success: boolean;
}

export const negotiateAPI = {
  async generateMessage(request: NegotiationRequest): Promise<NegotiationResponse> {
    const response = await fetch(`${API_BASE_URL}/api/negotiate`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(request),
    });
    
    if (!response.ok) {
      throw new Error('Failed to generate negotiation message');
    }
    
    return response.json();
  },

  async sendMessage(message: string, method: string, recipient?: string) {
    const response = await fetch(`${API_BASE_URL}/api/send`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ message, method, recipient }),
    });
    
    return response.json();
  }
};
