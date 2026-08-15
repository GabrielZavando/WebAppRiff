## MODIFIED Requirements

### Requirement: Backend SHALL declare a sample environment file listing required variables
The backend-runtime SHALL include an `apps/backend/.env.example` listing the environment variables that the backend reads at startup. The file SHALL contain `PORT=3000` and SHALL declare the Firebase credentials `FIREBASE_PROJECT_ID`, `FIREBASE_CLIENT_EMAIL`, and `FIREBASE_PRIVATE_KEY`. The `.gitignore` SHALL exclude `.env` from version control.

#### Scenario: env.example documents the PORT variable
- **WHEN** the file `apps/backend/.env.example` is read
- **THEN** it contains a line declaring `PORT=3000`
- **AND** the file `apps/backend/.gitignore` exists and contains a rule ignoring `.env`

#### Scenario: env.example documents the Firebase credentials
- **WHEN** the file `apps/backend/.env.example` is read
- **THEN** it contains `FIREBASE_PROJECT_ID`
- **AND** it contains `FIREBASE_CLIENT_EMAIL`
- **AND** it contains `FIREBASE_PRIVATE_KEY`
