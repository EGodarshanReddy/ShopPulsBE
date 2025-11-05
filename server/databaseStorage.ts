// Thin proxy module that re-exports the selected storage implementation.
// The application code imports `storage` from "./databaseStorage". After
// migrating to Supabase we keep this file as a compatibility shim that
// re-exports the implementation from `server/storage.ts`.

import { storage } from "./storage";

export { storage };