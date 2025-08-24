from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import asyncio
from typing import Optional
# Import your existing functions
from negotiatorAi import (
    scrape_ebay, suggest_price, generate_negotiation_prompt, 
    extract_message_from_response, MCPEmailClient, send_telegram_message
)

from portia import Config, LLMProvider, Portia
from dotenv import load_dotenv
import os

load_dotenv()

app = FastAPI(title="NegotiatorAI API")

# Enable CORS for React frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],  # React dev server
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Request/Response models
class NegotiationRequest(BaseModel):
    productName: str
    currentPrice: float
    desiredPrice: Optional[float] = None
    tone: str = "polite"

class NegotiationResponse(BaseModel):
    message: str
    suggestedPrice: float
    competitorPrices: list
    success: bool

class SendMessageRequest(BaseModel):
    message: str
    method: str  # "email" or "telegram"
    recipient: Optional[str] = None

@app.post("/api/negotiate", response_model=NegotiationResponse)
async def negotiate(request: NegotiationRequest):
    try:
        # Get competitor prices
        competitor_prices = await scrape_ebay(request.productName)
        
        # Calculate suggested price
        suggested_price = suggest_price(request.currentPrice, competitor_prices)
        final_price = request.desiredPrice or suggested_price
        
        # Generate message
        prompt = generate_negotiation_prompt(
            request.productName, request.currentPrice, final_price, 
            competitor_prices, request.tone
        )
        
        config = Config.from_default(
            llm_provider=LLMProvider.GOOGLE,
            default_model="google/gemini-2.0-flash",
            google_api_key=os.getenv('GOOGLE_API_KEY'),
        )
        portia = Portia(config=config)
        
        try:
            negotiation_response = portia.run(prompt)
            message = extract_message_from_response(negotiation_response)
        except:
            # Fallback message
            message = f"Hi! I'm interested in your {request.productName} listed at ${request.currentPrice}. Would you consider ${final_price}? Thanks!"
        
        return NegotiationResponse(
            message=message,
            suggestedPrice=suggested_price,
            competitorPrices=competitor_prices,
            success=True
        )
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/api/send")
async def send_message(request: SendMessageRequest):
    try:
        if request.method == "telegram":
            success = send_telegram_message(request.message)
        elif request.method == "email":
            mcp_client = MCPEmailClient("./email-mcp-server")
            success = await mcp_client.send_email_via_mcp(
                request.recipient, 
                "Negotiation Message", 
                request.message
            )
        else:
            raise HTTPException(status_code=400, detail="Invalid method")
            
        return {"success": success}
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
