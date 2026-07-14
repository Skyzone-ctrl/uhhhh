require('dotenv').config();
const express = require('express');
const path = require('path');
const axios = require('axios');
const compression = require('compression');

const app = express();
const port = process.env.PORT || 3000;

// Configure compression for better performance
app.use(compression({
    level: 6,
    threshold: 0,
    filter: (req) => {
        return true; // Always compress responses
    }
}));
app.use(express.json());
app.use(express.static(path.join(__dirname)));

// PRD Generation Route
app.post('/generate-prd', async (req, res) => {
    const { productName, category, targetAudience, coreIdea, keyFeatures, techStack } = req.body;

    if (!productName || !coreIdea) {
        return res.status(400).json({ error: 'Product Name and Core Idea are required.' });
    }

    const apiKey = process.env.KILO_API_KEY;
    if (!apiKey) {
        return res.status(500).json({ error: 'Kilo API key is missing on the server.' });
    }

    // Build a highly structured but concise prompt for the PRD
    const systemPrompt = `You are an expert Principal Product Manager.
Your task is to generate an exceptionally professional and comprehensive Product Requirement Document (PRD) in Indonesian language.
The PRD must be outstanding, fully elaborated, structured, and visually clean. Use Markdown formatting.
Keep the output comprehensive but concise (around 1000 words) so it generates quickly.

Structure the PRD with these sections:

# PRODUCT REQUIREMENT DOCUMENT (PRD)
## ${productName} - Specifications

---

### 1. EXECUTIVE SUMMARY & VISION
- **Executive Summary**: A concise elevator pitch and summary of the product.
- **Vision Statement**: The long-term impact and ultimate goal of this product.
- **Problem Statement**: The exact pain points of the user this product solves.
- **Value Proposition**: Why users will choose this product over alternatives.

### 2. TARGET AUDIENCE & USER PERSONAS
- **Target Market**: The demographics or user segments.
- **User Personas**: Detail at least two concise user personas (Name, Role, Goals, Pain Points).

### 3. USER JOURNEY & FLOWS
- Step-by-step user journey from onboarding to achieving their core goal.
- Present a textual flow map using arrows (e.g. [Onboarding] -> [Dashboard] -> [Core Action]).

### 4. FUNCTIONAL REQUIREMENTS
Create a structured markdown table of requirements:
| ID | Feature / Module | Requirement Description | Priority (Must/Should/Could) | Acceptance Criteria |
Fill this table with specific functional items.

### 5. NON-FUNCTIONAL REQUIREMENTS
- **Performance & Scalability**: Latency, load expectations.
- **Security & Compliance**: Encryption, authentication (JWT, OAuth), role-based access control.

### 6. TECHNICAL ARCHITECTURE & STACK
- Recommended tech stack with quick rationales.
- Database Schema Draft: A textual description of key database tables, fields, and relations.
- API Design Draft: At least 3 key RESTful endpoints with Method, Path, and brief structures.

### 7. RELEASE ROADMAP & PHASES
- **Phase 1: MVP (Minimum Viable Product)**: What is included and what is excluded.
- **Phase 2: Post-Launch & Scaling**: Upcoming features.

### 8. KEY METRICS & SUCCESS CRITERIA
- List of specific KPIs (e.g. DAU, retention rates) with target numbers.`;

    const userPrompt = `Generate a Product Requirement Document (PRD) for:
- **Product Name**: ${productName}
- **Category**: ${category || 'General Software'}
- **Target Audience**: ${targetAudience || 'General Users'}
- **Core Idea**: ${coreIdea}
- **Key Features**: ${keyFeatures || 'Standard modern software features'}
- **Tech Stack Preference**: ${techStack || 'To be recommended by AI'}`;

    const generateRequest = async (modelId) => {
        return await axios.post('https://api.kilo.ai/api/gateway/chat/completions', {
            model: modelId,
            messages: [
                { role: 'system', content: systemPrompt },
                { role: 'user', content: userPrompt }
            ]
        }, {
            headers: {
                'Authorization': `Bearer ${apiKey}`,
                'Content-Type': 'application/json'
            },
            timeout: 60000 // 1 minute timeout
        });
    };

    try {
        console.log(`Generating PRD for ${productName} using kilo-auto/free...`);
        let response;
        try {
            response = await generateRequest('kilo-auto/free');
        } catch (firstError) {
            console.warn('Primary model kilo-auto/free failed, trying fallback model openrouter/free...', firstError.message);
            // Fallback to openrouter/free which is very stable
            response = await generateRequest('openrouter/free');
        }

        if (response.data && response.data.choices && response.data.choices[0]) {
            const prdMarkdown = response.data.choices[0].message.content;
            return res.json({ prd: prdMarkdown });
        } else {
            console.error('Unexpected response format from Kilo Gateway:', response.data);
            return res.status(500).json({ error: 'Failed to generate PRD due to unexpected API response format.' });
        }

    } catch (error) {
        console.error('Error calling Kilo Gateway API:', error.response ? error.response.data : error.message);
        return res.status(500).json({
            error: 'Failed to communicate with Kilo AI Gateway.',
            details: error.response ? error.response.data : error.message
        });
    }
});

app.listen(port, () => {
    console.log(`PRD Maker server running at http://localhost:${port}`);
});
