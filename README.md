# ai-negotiation-agent
AI-powered negotiation agent with real market data and email integration

# NegotiatorAI 🤖💼

An AI-powered negotiation assistant that helps you get the best prices using real market data and professional communication.

## Features
- 🔍 **Real-time competitor price analysis**
- 🤖 **AI-generated negotiation messages** 
- 📧 **Professional email delivery via MCP**
- 💬 **Interactive chat interface**
- 🎯 **Multiple negotiation tones** (polite, friendly, assertive)

## Tech Stack
**Backend:**
- FastAPI (Python)
- Portia SDK for AI
- MCP for email services
- Beautiful Soup for web scraping

**Frontend:**
- React + TypeScript
- Vite
- Tailwind CSS
- Lucide React icons

## Getting Started

### Backend Setup
```
cd backend
poetry install
poetry run python api_server.py
```

### Frontend Setup
```
cd frontend
npm install
npm run dev
```

## Environment Variables
Create `.env` file in backend:
```
GOOGLE_API_KEY=your_key_here
EMAIL_USER=your_email@gmail.com
EMAIL_PASS=your_app_password
```

## Project Status
🚧 **In Development** - Adding new features and improvements regularly!

## Future Improvements
- [ ] Add user authentication
- [ ] Save negotiation history
- [ ] Support for more marketplaces
- [ ] Mobile app version
- [ ] Integration with more email providers

## Contributing
This is a personal project, but suggestions and feedback are welcome!

## Contact
Feel free to reach out if you have questions or suggestions.
```

## **Step 6: Optional - Deploy Frontend to GitHub Pages**

If you want a live demo of your frontend:

```bash
cd "/Users/prasannakudale/Documents/Project/Negotiator AI Chatbot Application"

# Install GitHub Pages package
npm install --save-dev gh-pages

# Add to package.json
"homepage": "https://YOUR_USERNAME.github.io/negotiator-ai",
"scripts": {
  "predeploy": "npm run build",
  "deploy": "gh-pages -d dist"
}

# Deploy to GitHub Pages
npm run deploy
```

Your frontend will be live at: `https://YOUR_USERNAME.github.io/negotiator-ai`

**Note:** The backend API won't work on GitHub Pages since it only hosts static files. For a working demo, you'll need to deploy the backend separately to a service like Render or Railway.

## **Step 7: Keep Your Project Updated**

Regular workflow for future improvements:

```bash
# Make changes to your code
git add .
git commit -m "Add new feature: [describe what you added]"
git push origin main

# For frontend updates to GitHub Pages
npm run deploy
```

## **Benefits of Having Your Project on GitHub:**

✅ **Version Control** - Track all your changes and improvements  
✅ **Backup** - Your code is safely stored in the cloud  
✅ **Portfolio Piece** - Shows your full-stack development skills  
✅ **Open Source** - Others can learn from your code  
✅ **Collaboration** - Easy to work with others in the future  
✅ **Documentation** - README serves as project documentation  
✅ **Issue Tracking** - Keep track of bugs and feature requests  

## **Pro Tips for GitHub Success:**

- **Commit often** with clear, descriptive messages
- **Use branches** for new features (`git checkout -b feature-name`)
- **Write good documentation** in your README
- **Add screenshots** of your app in action
- **Use GitHub Issues** to track what you want to build next
- **Add topics/tags** to your repo for discoverability
