# Project Prompts & Requests

- Can you check if we are using shadcn components? If not, please uninstall the unused libraries to save space.
- Update the README.md to accurately update the project architecture documentation.
- Refactor the type declarations in `app/actions.ts` and `trigger/syncOrders.ts` to a `types` folder and remove the `ts-ignore` comments.
- Fix the hydration error where the body className includes `font-sans` on the client but not the server.
- Update the login page project name to "Commerce Order Reporting & Visualization Intelligence Dashboard" and make the "CORVID" acronym bold.
- Restructure the dashboard layout: white navbar with logo, cream background (`#FEF8D6`), and a white card container for content. Put it in a `(dashboard)` route group.
- Add the `public/logo-magpie.png` logo to the login page.
- Switch the font from Geist to Google Font Inter in `app/layout.tsx`.
- Fix the TypeScript error in `syncOrders.ts` where 'brand' is missing from `ProductUpdateInput`.
- Migrate the database IDs to integers and reset the database.
- Build the frontend dashboard with metric cards, charts, and data tables using Server Actions.
