# AI-Powered Itinerary Generator

A serverless application that generates travel itineraries using AI and stores them in Firestore.

## Features
- Accepts destination and duration as input
- Generates structured travel itineraries using AI
- Stores results in Firestore with status tracking
- Asynchronous processing with immediate response
- Comprehensive input validation
- Error handling with retries and exponential backoff
- Real-time status tracking

## Tech Stack
- **Serverless API**: Cloudflare Workers
- **Database**: Google Cloud Firestore
- **AI Model**: OpenAI's GPT-4
- **Validation**: Zod
- **Language**: TypeScript
- **Testing**: Vitest
- **Code Formatting**: Prettier

## Acknowledgments
- Cloudflare Workers for the serverless platform
- Firebase for the database solution
- OpenAI for the AI model
- Zod for runtime validation
- Prettier for code formatting

## Setup
### Prerequisites
- Node.js (v20 or later)
- npm or yarn
- A Google Cloud project with Firestore enabled
- An OpenAI API key
- Cloudflare Workers account

### Installation
1. Clone the repository:
   ```bash
   git clone https://github.com/abbasi0abolfazl/ai-itinerary-generator.git
   cd ai-itinerary-generator
   ```
2. Install dependencies:
   ```bash
   npm install
   ```
3. Set up environment variables using Wrangler secrets:
   ```bash
   npx wrangler secret put FIREBASE_API_KEY
   npx wrangler secret put LLM_API_KEY
   ```
   When prompted, enter your Firebase API key and OpenAI API key respectively.
4. Deploy to Cloudflare Workers:
   ```bash
   npm run deploy
   ```

## Configuration
The `wrangler.toml` file contains the worker configuration:
```toml
name = "ai-itinerary-worker"
compatibility_date = "2025-08-09"
main = "src/index.ts"
# Environment variables should be set via Cloudflare dashboard or wrangler secrets
# Example: wrangler secret put FIREBASE_API_KEY
# Example: wrangler secret put LLM_API_KEY
```

**Important**: Never store API keys directly in `wrangler.toml` or commit them to version control. Always use Wrangler secrets for sensitive information.

### Local Development Environment
For local development, create a `.dev.vars` file in the root directory with your environment variables:
```
FIREBASE_API_KEY=your_firebase_api_key
LLM_API_KEY=your_openai_api_key
```
**Note**: This file should never be committed to version control and is already included in `.gitignore`.

## Firebase Configuration
The `src/firebase.ts` file handles the initialization of Firebase services. It uses the Firebase API key stored in Wrangler secrets to connect to your Firebase project.

### Firebase Setup
1. Create a Firebase project in the [Firebase Console](https://console.firebase.google.com/)
2. Enable Firestore in database mode
3. Register a web app in your Firebase project
4. Copy the Firebase configuration and update `src/firebase.ts`:

```typescript
export function initializeFirebase(env: Env) {
  const app = initializeApp({
    apiKey: env.FIREBASE_API_KEY, // Set via Wrangler secret
    authDomain: 'your-project.firebaseapp.com',
    projectId: 'your-project',
    storageBucket: 'your-project.firebasestorage.app',
    messagingSenderId: '123456789',
    appId: '1:123456789:web:abcdef123456',
  });
  return { app, auth: getAuth(app), db: getFirestore(app) };
}
```

**Important**: 
- Only the `apiKey` should be stored as a Wrangler secret
- Other configuration values (authDomain, projectId, etc.) are public and can be safely committed
- Update these values to match your Firebase project configuration

### Firestore Security Rules
The `firestore.rules` file defines security rules for Firestore access:
```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /itineraries/{jobId} {
      allow read: if request.auth.uid == resource.data.createdBy;
      allow create: if request.auth != null
                      && request.resource.data.status == 'processing'
                      && request.resource.data.destination is string
                      && request.resource.data.durationDays is number
                      && request.resource.data.createdAt == request.time
                      && request.resource.data.createdBy == request.auth.uid
                      && request.resource.data.itinerary.size() == 0
                      && request.resource.data.error == null;
      allow update: if request.auth.uid == resource.data.createdBy
                      && (request.resource.data.status == 'completed' || request.resource.data.status == 'failed')
                      && request.resource.data.completedAt == request.time
                      && request.resource.data.destination == resource.data.destination; 
    }
  }
}
```

These rules ensure:
- Users can only read their own itineraries
- Initial documents must have specific structure and status
- Updates can only change status and add results
- All access requires authentication

## API Usage
### Request
Send a POST request to the worker endpoint:
```bash
curl -X POST https://ai-itinerary-worker.your-subdomain.workers.dev/ \
  -H "Content-Type: application/json" \
  -d '{"destination": "Tokyo, Japan", "durationDays": 5}'
```

### Response
You'll receive an immediate response with a job ID:
```json
{
  "jobId": "uuid-generated-by-the-server"
}
```

## Architecture
The application follows an asynchronous processing pattern:
1. When a request is received, the worker creates a document in Firestore with status "processing".
2. The worker immediately returns a job ID to the client.
3. In the background, the worker calls the LLM to generate the itinerary.
4. Once the itinerary is generated, the worker updates the Firestore document with the result and sets the status to "completed" or "failed".

### Project Structure
```
.
├── firestore.rules           # Firestore security rules
├── index.ts                  # Root index file (note: main entry is src/index.ts)
├── package.json              # Project dependencies and scripts
├── package-lock.json         # Lock file for dependencies
├── README.md                 # This file
├── src/                      # Source code directory
│   ├── firebase.ts           # Firebase initialization
│   ├── index.ts              # Main worker entry point
│   ├── itinerary.ts          # Itinerary processing logic
│   ├── prompt.ts             # LLM prompt template
│   ├── types.ts              # TypeScript type definitions
│   ├── utils.ts              # Utility functions
│   └── validation.ts         # Zod schemas for validation
├── test/                     # Test files
│   ├── validateInput.test.ts
│   └── validateItineraryData.test.ts
├── tsconfig.json             # TypeScript configuration
├── vitest.config.mts         # Vitest configuration
├── worker-configuration.d.ts # Cloudflare Worker types
└── wrangler.toml             # Worker configuration
```

**Note**: The `node_modules` directory is not shown as it contains installed dependencies and is excluded from version control.

## Prompt Design
The prompt instructs the LLM to generate a structured JSON itinerary with the following requirements:
- Each day has a unique theme
- Each day includes three activities (morning, afternoon, evening)
- Activities reflect local culture, landmarks, cuisine, or nature
- No flights, hotels, or transportation included
- Output must be valid JSON only

## Security
- API keys are stored as Wrangler secrets
- Firestore security rules ensure proper access control
- Anonymous authentication is used for Firestore access
- No sensitive information is committed to version control
- Environment variables for local development are stored in `.dev.vars` (excluded from git)

## Development Workflow
### Code Formatting
This project uses Prettier for code formatting. The configuration is defined in `.prettierrc`. To format your code:
```bash
npm run format
```

To check if your code is properly formatted:
```bash
npm run format:check
```

### Testing
Run tests with:
```bash
npm test
```

The test suite includes:
- Input validation tests
- Itinerary data validation tests
- Error handling tests

To run tests in watch mode:
```bash
npm run test:watch
```

### Building
To build the project for production:
```bash
npm run build
```

### Deployment
Deploy to Cloudflare Workers:
```bash
npm run deploy
```

## Contributing Guidelines
We welcome contributions! Please follow these guidelines:
1. Fork the repository
2. Create a feature branch: `git checkout -b feature-name`
3. Make your changes and add tests if applicable
4. Format your code: `npm run format`
5. Ensure all tests pass: `npm test`
6. Commit your changes: `git commit -m 'Add some feature'`
7. Push to the branch: `git push origin feature-name`
8. Submit a pull request

### Code Style
- Use TypeScript for all code
- Follow the existing code style
- Write meaningful commit messages
- Add tests for new functionality
- Format code with Prettier before committing

### Testing Requirements
- All new features must include tests
- Maintain test coverage above 80%
- Ensure all tests pass before submitting a pull request

## Future Enhancements
Here are some potential improvements for future development:
1. **Svelte 5 Status Checker UI**: Build a web interface for users to check their itinerary status
2. **Advanced Error Handling**: Implement more sophisticated retry mechanisms
3. **Rate Limiting**: Add rate limiting to prevent abuse
4. **Caching**: Implement caching for frequently requested destinations
5. **Authentication**: Add user accounts to save itineraries
6. **Multi-language Support**: Add support for generating itineraries in different languages

## Troubleshooting
### Common Issues
1. **Deployment fails**: Ensure all environment variables are set correctly using Wrangler secrets
2. **Tests fail**: Check that all dependencies are installed and environment variables are set for local testing
3. **Firestore permissions**: Verify your Firestore security rules match the project requirements
4. **Formatting issues**: Run `npm run format` to ensure code formatting consistency
