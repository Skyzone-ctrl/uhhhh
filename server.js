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
    const { productName, category, targetAudience, coreIdea, keyFeatures, techStack, strength } = req.body;

    if (!productName || !coreIdea) {
        return res.status(400).json({ error: 'Product Name and Core Idea are required.' });
    }

    const apiKey = process.env.KILO_API_KEY;
    if (!apiKey) {
        return res.status(500).json({ error: 'Kilo API key is missing on the server.' });
    }

    // Determine custom focus instructions based on "Coffee Strength" (strength focus)
    let focusInstructions = '';
    if (strength === 'latte') {
        focusInstructions = `Focus Level: LATTE (User-centric & Product-focused).
- Highlight User Personas and step-by-step User Journeys.
- Keep the technical database schema and APIs lightweight.`;
    } else if (strength === 'espresso') {
        focusInstructions = `Focus Level: ESPRESSO (Ultra Technical & Backend-dense).
- Provide a brief Database Schema draft and key API endpoints.
- Highlight security models and rate limiting.`;
    } else {
        focusInstructions = `Focus Level: CAPPUCCINO (Perfectly Balanced).
- Provide a balanced overview of personas, functional tables, and tech stack.`;
    }

    // Build a highly structured but extremely concise prompt for the PRD (max 400 words)
    const systemPrompt = `You are an expert Product Manager.
Generate a concise, professional, and elegant Product Requirement Document (PRD) in Indonesian language.
IMPORTANT: To avoid timeouts, keep the entire response highly compact, clean, and fast (MAXIMUM 400 words). Use small tables and brief lists.

${focusInstructions}

Structure:
# PRODUCT REQUIREMENT DOCUMENT (PRD)
## ${productName} - Specifications

### 1. EXECUTIVE SUMMARY & VISION
- **Executive Summary**: Brief pitch.
- **Problem & Solution**: Quick description.

### 2. TARGET AUDIENCE & PERSONAS
- Short user segments and 1 key persona.

### 3. USER JOURNEY
- Brief step-by-step flow map (e.g. [Onboarding] -> [Core Action]).

### 4. FUNCTIONAL REQUIREMENTS
A small table:
| ID | Feature | Priority | Brief Acceptance Criteria |

### 5. TECHNICAL ARCHITECTURE
- Recommended Stack: List elements.
- Short database & API draft (1 key endpoint).

### 6. KEY METRICS & ROADMAP
- 2 key KPIs and simple MVP scope.`;

    const userPrompt = `Generate a compact, short, and premium PRD for:
- **Product Name**: ${productName}
- **Category**: ${category || 'Software'}
- **Target Audience**: ${targetAudience || 'General Users'}
- **Core Idea**: ${coreIdea}
- **Key Features**: ${keyFeatures || 'Standard features'}
- **Tech Stack**: ${techStack || 'Recommended'}`;

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
        console.log(`Generating PRD for ${productName} (Strength: ${strength || 'cappuccino'}) using kilo-auto/free...`);
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
