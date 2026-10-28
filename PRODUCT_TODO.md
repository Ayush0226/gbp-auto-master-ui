# GBP Auto Master Product Todo

This product is dedicated to Google Business Profile management and supporting Google services. The website, backend and MCP tools share this Google-only scope.

## Current foundation

- [x] Account authentication and Google OAuth connection
- [x] Multiple Google Business Profile locations
- [x] Shared account credit balance
- [x] Review loading and unanswered-review filters
- [x] AI reply drafting, regeneration, editing and publishing
- [x] Review reply deletion and bounded batch processing
- [x] Draft, approval and auto-publish automation modes
- [x] Rating, language, tone, delay and daily-limit rules
- [x] Standard, event and offer content campaigns
- [x] Calls to action and multi-location scheduling
- [x] Photo media records and per-location publishing status
- [x] Scheduled publishing and review-processing cron routes
- [x] Local top-11 rank reports and downloadable PDFs
- [x] Google analytics and search-keyword retrieval
- [x] Razorpay plans, top-ups and promo validation
- [x] Transactional credit charging and failure refunds
- [x] OAuth-protected MCP server with account, review, content and rank tools
- [x] Sample workspace, product website and guided onboarding
- [x] Consent-controlled website analytics
- [x] User profile with identity, regional preferences and account summary
- [x] One-action per-location review autopilot setup and Google notification registration
- [x] Ownership, billing, MCP and workflow test coverage

## P0 — Release reliability and account control

- [ ] Verify all Supabase migrations in staging and production
- [ ] Add migration-version health reporting
- [ ] Add self-service Google disconnect
- [ ] Add account-data export
- [ ] Add account deletion request and completion workflow
- [ ] Cancel scheduled jobs when an account or location is disconnected
- [ ] Add a user-visible automation activity and audit history
- [ ] Add token and Google connection health indicators
- [ ] Add reauthorization alerts and recovery flow
- [ ] Add failed-job retry controls and dead-letter visibility
- [ ] Add Google quota and rate-limit monitoring
- [ ] Add structured application error reporting
- [ ] Add uptime, worker and cron monitoring
- [ ] Add database backup and restoration procedure
- [ ] Add a public service-status page
- [ ] Review privacy, terms, refunds and data-retention language
- [ ] Replace deprecated Supabase Python auth dependency when supported
- [ ] Remove or archive duplicated legacy dashboard implementations
- [ ] Finish mobile, tablet, keyboard and reduced-motion QA
- [ ] Reduce or replace the large optional 3D website bundle
- [ ] Create production social-sharing image and release assets

## P1 — Complete Google Business Profile management

### Profile health centre

- [ ] Profile completeness score per location
- [ ] Missing primary and secondary category checks
- [ ] Missing description, phone, website and appointment-link checks
- [ ] Regular and holiday-hours checks
- [ ] Verification and suspension status guidance
- [ ] Stale photo and stale post warnings
- [ ] Unanswered review and reply-time alerts
- [ ] Duplicate listing detection workflow
- [ ] Prioritised corrective-action list

### Profile editor

- [ ] Business description editor
- [ ] Categories editor
- [ ] Regular and special hours editor
- [ ] Phone and website editor
- [ ] Appointment and ordering links
- [ ] Services, amenities and profile attributes
- [ ] Change preview and confirmation before Google submission
- [ ] Change audit log with before and after values

### Questions, products and services

- [ ] Google Questions and Answers inbox where API support permits
- [ ] Suggested answers with approval
- [ ] Frequently asked question library
- [ ] Service catalogue with descriptions and prices
- [ ] Product catalogue with photos and purchase links
- [ ] Location-specific availability

### Review intelligence

- [ ] Review sentiment and topic trends
- [ ] Recurring complaint detection
- [ ] Product, service and staff mention extraction
- [ ] Urgent negative-review escalation
- [ ] Suspected spam and abuse review guidance
- [ ] Competitor review benchmarking
- [ ] Weekly and monthly reputation reports

### Media management

- [ ] Complete photo upload, validation and publishing flow
- [ ] Complete supported video flow with accurate feature gates
- [ ] Image dimension and quality validation
- [ ] Duplicate media detection
- [ ] Before-and-after galleries
- [ ] Media calendar and expiration reminders
- [ ] Brand templates and media approval

## P2 — Local SEO, discovery and website tools

- [ ] Automated on-page website audit
- [ ] Title, description, heading and indexability checks
- [ ] LocalBusiness structured-data validation
- [ ] Core business-information consistency checks
- [ ] Internal-link and broken-link checks
- [ ] Location landing-page recommendations
- [ ] Citation consistency monitoring
- [ ] Correction links for unsupported directory integrations
- [ ] Rank history by keyword, area and device context
- [ ] Competitor visibility comparisons
- [ ] Google Search Console integration
- [ ] Local landing-page and mini-site builder
- [ ] Calls, directions, bookings and form conversion tracking
- [ ] UTM campaign builder

## P3 — Multi-location and agency operations

- [ ] Organisation, workspace and client account hierarchy
- [ ] Owner, manager, editor and approver roles
- [ ] Per-location permissions
- [ ] Approval deadlines and service-level targets
- [ ] Location health command centre
- [ ] Brand rules and reusable templates
- [ ] Bulk location actions with safe previews
- [ ] Client-facing scheduled reports
- [ ] White-label options where commercially appropriate
- [ ] Agency billing and credit allocation
- [ ] Team audit trail

## P4 — Business intelligence and AI assistant

- [ ] Daily owner summary
- [ ] Weekly action plan
- [ ] Plain-language performance explanations
- [ ] Alerts for Google reviews, posts and connection failures
- [ ] Recommendations ranked by effort and expected value
- [ ] Revenue and lead attribution where data is available
- [ ] Anomaly detection across locations
- [ ] Downloadable Google Business Profile reports in the dashboard
- [ ] Agent confirmation policy for public or paid actions
- [ ] Expanded MCP tools for Google profile health and reporting
- [ ] Tool-level permissions for teams and agencies

## Product principles

- [ ] Show the credit or financial effect before every paid action
- [ ] Require clear confirmation before public publishing unless a rule authorises it
- [ ] Never promise rankings, reviews, leads or revenue
- [ ] Label samples, estimates and live data accurately
- [ ] Use official Google APIs and comply with Google policies
- [ ] Collect only the data required for the chosen workflow
- [ ] Make disconnect, export and deletion understandable
- [ ] Preserve an audit trail for agent and automation actions
- [ ] Design for one location first and make multi-location behaviour explicit
- [ ] Keep this project focused on Google Business Profile and supporting Google services

## Recommended delivery order

1. Release reliability and self-service account controls.
2. GBP profile health, editing, services, products and media.
3. Google review automation, approval queues and reputation reporting.
4. Google content scheduling and multi-location publishing.
5. Google Search Console and local SEO reporting.
6. Agency operations, Google connection health and MCP reporting tools.
