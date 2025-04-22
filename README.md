
# NavigationTracker

## Setup Instructions

1. **Install dependencies**  
   Run the following command in the project root:

   ```bash
   npm install
   ```

2. **Configure PostgreSQL**  
   Make sure your PostgreSQL is running and accessible.  
   Default user/password:
   ```
   user: postgres
   password: postgres
   ```

3. **Create `.env` file**  
   At the root of the project, create a `.env` file with the necessary environment variables.  
   Make sure to add your [TomTom API key](https://developer.tomtom.com/):

   ```
   TOMTOM_API_KEY=your_api_key_here
   DATABASE_URL=postgres://postgres:postgres@localhost:5432/navigationtracker
   ```

4. **Start the development server**  
   ```bash
   npm run dev
   ```

> That's it! Your NavigationTracker app should now be running locally.
