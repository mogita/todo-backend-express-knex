# Task Management Application Technical Design

| Author      | Yun Wang                |
| ----------- | ----------------------- |
| Status      | Draft                   |
| Date        | 2024-05-15              |

## Table of Contents

1. [Decisions Made So Far](#part-1-decisions-made-so-far)
   - [Core Architecture Decisions](#11-core-architecture-decisions)
   - [Implemented Data Models](#12-implemented-data-models)
   - [Implemented APIs](#13-implemented-apis)
2. [User Stories](#part-2-user-stories)
   - [User Personas](#21-user-personas)
   - [Core User Stories](#22-core-user-stories)
   - [Future User Stories](#23-future-user-stories)
3. [Proposed Design Decisions](#part-3-proposed-design-decisions)
   - [Frontend Architecture](#31-frontend-architecture)
   - [Real-time Collaboration Strategy](#32-real-time-collaboration-strategy)
   - [Data Model Extensions](#33-data-model-extensions)
   - [API Extensions](#34-api-extensions)
4. [Implementation Guide](#part-4-implementation-guide)
   - [Development](#41-development)
     - [Backend Implementation](#411-backend-implementation)
     - [Frontend Implementation](#412-frontend-implementation)
     - [Database Migration](#413-database-migration)
   - [Quality Assurance](#42-quality-assurance)
     - [Testing Strategy](#421-testing-strategy)
   - [Operations](#43-operations)
     - [Monitoring and Observability](#431-monitoring-and-observability)
   - [Cross-Cutting Concerns](#44-cross-cutting-concerns)
     - [Operational Excellence](#441-operational-excellence)
5. [Development Standards](#part-5-development-standards)
   - [Code Quality Standards](#51-code-quality-standards)
   - [Documentation Standards](#52-documentation-standards)
   - [CI/CD Pipeline](#53-cicd-pipeline)
   - [Security Standards](#54-security-standards)
   - [Future Considerations](#55-future-considerations)

## Part 1: Decisions Made So Far

### 1.1 Core Architecture Decisions
- **Backend Stack**: Express + TypeScript
  - Chosen for team familiarity and type safety
  - Proven scalability for similar applications
  - Strong ecosystem and community support

- **Database**: PostgreSQL
  - Selected for relational data requirements
  - Strong ACID compliance for business data
  - JSON support for flexible schema needs

- **Authentication/Authorization**
  - JWT-based authentication implemented
  - Role-based access control (RBAC)
  - Organization-level permissions structure

### 1.2 Implemented Data Models
```sql
-- Core entities implemented so far
organizations {
  id: integer PRIMARY KEY
  name: string
  owner_id: integer REFERENCES users(id)
  created_at: timestamp
  updated_at: timestamp
}

users {
  id: integer PRIMARY KEY
  email: string UNIQUE
  username: string
  password: string (hashed)
  created_at: timestamp
  updated_at: timestamp
}

org_members {
  id: integer PRIMARY KEY
  org_id: integer REFERENCES organizations(id)
  user_id: integer REFERENCES users(id)
  role: string ['admin', 'member']
  created_at: timestamp
  updated_at: timestamp
}

projects {
  id: integer PRIMARY KEY
  name: string
  org_id: integer REFERENCES organizations(id)
  created_at: timestamp
  updated_at: timestamp
}

todos {
  id: integer PRIMARY KEY
  project_id: integer REFERENCES projects(id)
  title: string
  order: integer
  completed: boolean
  org_id: integer REFERENCES organizations(id)
  created_at: timestamp
  updated_at: timestamp
}
```

### 1.3 Implemented APIs
```typescript
// User Authentication
POST   /register                    // Register a new user
POST   /login                       // Login a user
GET    /users/self                  // Get current user info
PATCH  /users                       // Update user info

// Organizations
GET    /orgs                        // Get all organizations for current user
GET    /orgs/:org_id                // Get a specific organization
POST   /orgs                        // Create a new organization
PATCH  /orgs/:org_id                // Update an organization
DELETE /orgs/:org_id                // Delete an organization

// Organization Members
GET    /orgs/:org_id/members        // Get all members of an organization
GET    /orgs/:org_id/members/:id    // Get a specific member of an organization
POST   /orgs/:org_id/members        // Add a member to an organization
PATCH  /orgs/:org_id/members/:id    // Update a member's role in an organization
DELETE /orgs/:org_id/members/:id    // Remove a member from an organization

// Projects
GET    /projects                    // Get all projects for current user
GET    /projects/:project_id        // Get a specific project
POST   /projects                    // Create a new project
PATCH  /projects/:project_id        // Update a project
DELETE /projects                    // Delete all projects
DELETE /projects/:project_id        // Delete a specific project

// Tasks (Todos)
GET    /projects/:project_id/todos         // Get all todos for a project
GET    /projects/:project_id/todos/:id     // Get a specific todo
POST   /projects/:project_id/todos         // Create a new todo
PATCH  /projects/:project_id/todos/:id     // Update a todo
DELETE /projects/:project_id/todos         // Delete all todos for a project
DELETE /projects/:project_id/todos/:id     // Delete a specific todo
```

## Part 2: User Stories

### 2.1 User Personas

#### Organization Administrator
A user who creates and manages an organization, with full control over projects, members, and settings.

#### Team Member
A user who belongs to one or more organizations and contributes to projects by creating and managing tasks.

#### Guest User
A user who has limited access to view specific projects or tasks they've been invited to.

### 2.2 Core User Stories

#### Authentication & User Management
- **As a user**, I want to register for an account so that I can access the system
- **As a user**, I want to log in to my account so that I can access my organizations and projects
- **As a user**, I want to update my profile information so that my details are current
- **As a user**, I want to reset my password if I forget it so that I can regain access to my account

#### Organization Management
- **As an organization administrator**, I want to create a new organization so that I can manage projects for my team
- **As an organization administrator**, I want to invite users to my organization so that they can collaborate on projects
- **As an organization administrator**, I want to assign roles to members so that they have appropriate permissions
- **As an organization administrator**, I want to remove members from my organization when they no longer need access
- **As a user**, I want to see all organizations I belong to so that I can navigate between them

#### Project Management
- **As an organization member**, I want to create projects so that I can organize related tasks
- **As an organization member**, I want to view all projects I have access to so that I can find my work
- **As an organization member**, I want to update project details so that information stays current
- **As an organization administrator**, I want to archive or delete projects that are no longer needed

#### Task Management
- **As a team member**, I want to create tasks within a project so that work can be tracked
- **As a team member**, I want to assign tasks to myself or others so that responsibilities are clear
- **As a team member**, I want to update task status (todo, in progress, done) so that progress is visible
- **As a team member**, I want to set priorities on tasks so that important work is highlighted
- **As a team member**, I want to set due dates on tasks so that deadlines are clear
- **As a team member**, I want to mark tasks as complete when finished
- **As a team member**, I want to view all tasks assigned to me across projects so I can manage my workload

#### Collaboration
- **As a team member**, I want to comment on tasks so that I can provide updates or ask questions
- **As a team member**, I want to @mention other users in comments so they are notified
- **As a team member**, I want to receive notifications when tasks are assigned to me or when I'm mentioned
- **As a team member**, I want to see real-time updates when others modify tasks I'm viewing
- **As a team member**, I want to attach images and files to tasks and comments so I can share visual information
- **As a team member**, I want to upload images for my profile avatar so I can personalize my account
- **As an organization administrator**, I want to upload an image for my organization's avatar to establish brand identity

### 2.3 Future User Stories

#### Reporting & Analytics
- **As an organization administrator**, I want to see project progress reports so I can track completion status
- **As an organization administrator**, I want to see team workload distribution so I can balance assignments
- **As a team member**, I want to see my personal productivity metrics so I can improve my efficiency

#### Billing & Subscription Management
- **As an organization administrator**, I want to select a subscription plan so that I can access features appropriate for my team's needs
- **As an organization administrator**, I want to manage payment methods so that I can control how my organization is billed
- **As an organization administrator**, I want to view billing history so that I can track expenses and plan budgets
- **As an organization administrator**, I want to download invoices so that I can submit them for reimbursement or accounting
- **As an organization administrator**, I want to upgrade or downgrade my subscription so that I can adjust to changing team needs

#### Integrations
- **As a user**, I want to integrate with calendar applications so task deadlines appear in my schedule
- **As a user**, I want to integrate with communication tools like Slack so I can receive notifications there
- **As a developer**, I want to integrate with version control systems so code commits can be linked to tasks

## Part 3: Proposed Design Decisions

### 3.1 Frontend Architecture
- **Recommendation**: Next.js/Remix implementing BFF pattern
  - Benefits:
    - SSR for initial loads and SEO
    - Client-side navigation
    - API security through BFF layer
  - Decision needed: Choose between Next.js vs Remix
- Tailwind CSS and shadcn-ui for styling

### 3.2 Real-time Collaboration Strategy
- **Proposal**: Integrated WebSocket + Redis approach
  - Initial implementation as part of main service
  - Designed for future extraction as microservice
  - Decision needed: Real-time feature prioritization

#### Real-time Collaboration Features
- **Collaborative Task Editing**
  - Multiple users can edit task details simultaneously
  - Changes are reflected in real-time for all viewers
  - Conflict resolution with operational transforms
  - Visual indicators showing who is currently editing

- **Live Status Updates**
  - Task status changes appear instantly for all team members
  - Live notifications when tasks are assigned or modified
  - Real-time progress tracking on project dashboards
  - Animated transitions for status changes on kanban boards

- **Presence Awareness**
  - See which team members are currently online
  - View who is looking at the same project or task
  - Cursor/avatar indicators showing where others are focusing
  - Activity feed showing real-time team actions

- **Collaborative Comments**
  - Live comment threads with typing indicators
  - Real-time comment notifications
  - Emoji reactions that update instantly
  - Threaded discussions with live updates

### 3.3 Data Model Extensions
```sql
-- Proposed extensions to existing entities
projects {
  -- Add these fields to the existing projects table
  description: text
  status: enum ['active', 'archived']
}

todos {
  -- Rename to 'tasks' and add these fields
  description: text
  status: enum ['todo', 'in_progress', 'done']
  assignee_id: integer REFERENCES users(id)
  due_date: timestamp
  priority: enum ['low', 'medium', 'high']
}

-- New entities to implement
comments {
  id: integer PRIMARY KEY
  task_id: integer REFERENCES tasks(id)
  user_id: integer REFERENCES users(id)
  content: text
  created_at: timestamp
  updated_at: timestamp
}

notifications {
  id: integer PRIMARY KEY
  user_id: integer REFERENCES users(id)
  type: string
  content: text
  read: boolean
  related_id: integer
  related_type: string
  created_at: timestamp
}

-- Billing and subscription entities
-- For storing available subscription tiers
subscription_plans {
  id: integer PRIMARY KEY
  name: string
  description: text
  price: decimal
  billing_interval: string ['monthly', 'yearly']
  features: jsonb
  is_active: boolean
  created_at: timestamp
  updated_at: timestamp
}

-- For tracking organization subscriptions
org_subscriptions {
  id: integer PRIMARY KEY
  org_id: integer REFERENCES organizations(id)
  plan_id: integer REFERENCES subscription_plans(id)
  status: string ['active', 'canceled', 'past_due']
  current_period_start: timestamp
  current_period_end: timestamp
  cancel_at_period_end: boolean
  stripe_subscription_id: string
  created_at: timestamp
  updated_at: timestamp
}

-- For storing payment method information securely
payment_methods {
  id: integer PRIMARY KEY
  org_id: integer REFERENCES organizations(id)
  type: string ['credit_card', 'bank_account']
  last_four: string
  card_brand: string
  expiry_month: integer
  expiry_year: integer
  is_default: boolean
  stripe_payment_method_id: string
  created_at: timestamp
  updated_at: timestamp
}

-- For tracking billing history and invoice details
invoices {
  id: integer PRIMARY KEY
  org_id: integer REFERENCES organizations(id)
  subscription_id: integer REFERENCES org_subscriptions(id)
  amount: decimal
  status: string ['paid', 'open', 'void']
  invoice_date: timestamp
  due_date: timestamp
  invoice_number: string
  stripe_invoice_id: string
  stripe_hosted_invoice_url: string
  stripe_pdf_url: string
  created_at: timestamp
  updated_at: timestamp
}

-- Media attachments entities
-- For storing metadata about uploaded files (filename, content type, size, storage location)
media_attachments {
  id: integer PRIMARY KEY
  filename: string
  original_filename: string
  content_type: string
  size_bytes: integer
  storage_key: string
  storage_provider: string ['s3', 'gcs']
  owner_id: integer REFERENCES users(id)
  org_id: integer REFERENCES organizations(id)
  created_at: timestamp
  updated_at: timestamp
}

-- For creating polymorphic relationships between media and various entities (tasks, comments, users, organizations)
attachable_items {
  id: integer PRIMARY KEY
  media_id: integer REFERENCES media_attachments(id)
  attachable_type: string ['task', 'comment', 'user', 'organization']
  attachable_id: integer
  created_at: timestamp
}
```

### 3.4 API Extensions
```typescript
// Task Extensions
PATCH  /projects/:project_id/todos/:id/assign    // Assign a task to a user
PATCH  /projects/:project_id/todos/:id/status    // Update task status
PATCH  /projects/:project_id/todos/:id/priority  // Update task priority
GET    /todos/assigned                           // Get all tasks assigned to current user

// Comments
POST   /projects/:project_id/todos/:id/comments  // Add a comment to a task
GET    /projects/:project_id/todos/:id/comments  // Get all comments for a task
DELETE /comments/:id                             // Delete a comment

// Notifications
GET    /notifications                            // Get all notifications for current user
PATCH  /notifications/:id                        // Mark a notification as read
DELETE /notifications                            // Delete all notifications

// Subscription Plans
GET    /subscription_plans                       // Get all available subscription plans
GET    /subscription_plans/:id                   // Get details of a specific plan

// Organization Subscriptions
GET    /orgs/:org_id/subscription               // Get current subscription for an organization
POST   /orgs/:org_id/subscription               // Create or update subscription for an organization
PATCH  /orgs/:org_id/subscription/cancel        // Cancel subscription at period end
PATCH  /orgs/:org_id/subscription/reactivate    // Reactivate a canceled subscription

// Payment Methods
GET    /orgs/:org_id/payment_methods            // Get all payment methods for an organization
POST   /orgs/:org_id/payment_methods            // Add a new payment method (Stripe token only, no direct CC data)
PATCH  /orgs/:org_id/payment_methods/:id/default // Set a payment method as default
DELETE /orgs/:org_id/payment_methods/:id        // Remove a payment method

// Invoices
GET    /orgs/:org_id/invoices                   // Get all invoices for an organization
GET    /orgs/:org_id/invoices/:id               // Get a specific invoice
GET    /orgs/:org_id/invoices/:id/pdf           // Download invoice as PDF

// Media Attachments
POST   /media                                   // Upload a new media file
GET    /media/:id                               // Get media metadata
GET    /media/:id/content                       // Get signed URL for media content
DELETE /media/:id                               // Delete a media attachment

// Task Attachments
POST   /projects/:project_id/todos/:id/attachments  // Attach media to a task
GET    /projects/:project_id/todos/:id/attachments  // Get all attachments for a task
DELETE /projects/:project_id/todos/:id/attachments/:attachment_id  // Remove attachment from task

// Comment Attachments
POST   /comments/:id/attachments                // Attach media to a comment
GET    /comments/:id/attachments                // Get all attachments for a comment
DELETE /comments/:id/attachments/:attachment_id // Remove attachment from comment

// User Avatar
POST   /users/avatar                            // Upload or update user avatar
DELETE /users/avatar                            // Remove user avatar

// Organization Avatar
POST   /orgs/:org_id/avatar                     // Upload or update organization avatar
DELETE /orgs/:org_id/avatar                     // Remove organization avatar
```

## Part 4: Implementation Guide

### 4.1 Development

#### 4.1.1 Backend Implementation

1. **Task Enhancement**
   - Extend the existing `todos` table with additional fields (description, status, assignee, due date, priority)
   - Update the corresponding schemas and handlers
   - Implement task assignment functionality
   - Add filtering and sorting capabilities to task endpoints

2. **Comments System**
   - Create the comments table and related migrations
   - Implement comment creation, retrieval, and deletion endpoints
   - Add validation and authorization for comment operations

3. **Notification System**
   - Create the notifications table and related migrations
   - Implement notification creation logic for key events (task assignment, mentions, etc.)
   - Add endpoints for retrieving and managing notifications

4. **Real-time Updates**
   - Implement WebSocket server for real-time communication
   - Create event system for broadcasting changes to connected clients
   - Add Redis for scaling WebSocket connections across multiple server instances

5. **DevOps Infrastructure**
   - Containerize application with Docker for consistent environments
   - Implement Kubernetes deployment for orchestration and scaling on GKE or EKS
   - Set up CI/CD pipelines for automated testing and deployment
   - Configure horizontal pod autoscaling for handling traffic spikes
   - Implement blue-green deployment strategy for zero-downtime updates
   - Trace IDs for tracing requests across services

6. **Media Storage System**
   - Implement cloud storage integration with Amazon S3 or Google Cloud Storage
   - Create secure file upload service with content type validation
   - Support images (JPG, PNG, GIF, WebP), videos (MP4), and audio (MP3, WAV) formats
   - Generate signed URLs for secure, time-limited access to media files
   - Implement file size limits and quota management per organization
   - Create thumbnail generation service for image previews
   - Implement virus/malware scanning for uploaded files

7. **Billing & Subscription System**
   - Integrate with Stripe for payment processing and subscription management
   - Use Stripe Elements for secure payment collection (no credit card data touches our servers)
   - Implement webhook handlers for subscription lifecycle events
   - Create secure payment flow with proper error handling
   - Develop invoice generation and management system
   - Implement subscription plan management and feature access control
   - Set up automated billing notifications and reminders

   **Rationale for Stripe Selection:**
   - Cost-effective transaction fee-based model aligns with our initial pricing strategy
   - Simpler integration path for our B2C product with straightforward subscription tiers
   - Comprehensive API and documentation reduces development time
   - Future flexibility to migrate to platforms like Chargebee if we expand to complex enterprise pricing
     with variable subscription plans, volume-based pricing, or custom contracts for larger business customers

8. **API Gateway Implementation**
   - Deploy API Gateway to handle and route all incoming traffic
   - Implement request rate limiting and throttling
   - Set up service discovery for backend services
   - Configure SSL termination and security policies
   - Automatic SSL certificate rotation with Let's Encrypt
   - Implement request/response transformation and validation

#### 4.1.2 Frontend Implementation

1. **Core UI Components**
   - Authentication screens (login, register, password reset)
   - Organization management interface
   - Project listing and detail views
   - Task board with drag-and-drop capabilities
   - Task detail modal with comments and activity history

2. **Billing & Subscription UI**
   - Subscription plan selection and comparison page
   - Payment method management interface using Stripe Elements
   - Billing history and invoice listing
   - Subscription management dashboard
   - Secure checkout flow with Stripe.js integration
   - Invoice detail and download interface

3. **State Management**
   - Implement global state management (Redux, Zustand, or Context API)
   - Create API service layer for communication with backend
   - Add caching strategies for improved performance

4. **Media Upload Components**
   - Drag-and-drop file upload interface for tasks and comments
   - Image preview and cropping tool for avatars
   - Progress indicators for file uploads
   - Media gallery component for viewing attachments
   - Lightbox for full-screen image viewing
   - Video and audio players for media playback

5. **Real-time Integration**
   - Implement WebSocket client connection
   - Add event listeners for real-time updates
   - Update UI components in response to real-time events

#### 4.1.3 Database Migration

1. **Schema Evolution**
   - Use Knex migrations for all schema changes
   - Implement backward compatible changes where possible
   - Include data migration scripts for non-compatible changes

2. **Data Integrity**
   - Add appropriate foreign key constraints
   - Implement database transactions for multi-step operations
   - Add database indexes for frequently queried fields

### 4.2 Quality Assurance

1. **Unit Testing**
   - Use Vitest for frontend and Jest for backend unit tests
   - Minimum 80% code coverage for all new code
   - Test all business logic functions and data access layers
   - Implement mocking and stubbing for isolated testing
   - Automate test runs on every commit

2. **Integration Testing**
   - Test API endpoints and service interactions
   - Validate request/response contracts
   - Test database interactions with test databases
   - Verify authentication and authorization flows

3. **End-to-End Testing**
   - Use Playwright for comprehensive E2E testing
   - Cover all critical user flows and journeys
   - Test across multiple browsers and devices
   - Include visual regression testing
   - Implement realistic data scenarios

4. **Performance Testing**
   - Load testing for high-traffic endpoints
   - Stress testing for system limits
   - Benchmark database query performance
   - Monitor memory usage and response times

5. **User Acceptance Testing**
   - Dedicated UAT environment with production-like data
   - Structured test scenarios covering all user stories
   - Stakeholder feedback collection and prioritization process

6. **Monitoring in UAT**
   - Track critical user journeys during UAT phases
   - Monitor feature adoption and usage patterns
   - Compare performance metrics between UAT and production

### 4.3 Monitoring and Observability

1. **System Performance Monitoring**
   - Integrate Datadog for comprehensive monitoring
   - Set up custom dashboards for key performance metrics
   - Configure alerts for critical thresholds
   - Implement distributed tracing for request flows

2. **User Journey Tracking**
   - Monitor critical user journeys end-to-end
   - Set up synthetic tests for key workflows
   - Create alerts for degraded user experiences
   - Implement real user monitoring (RUM)

3. **Log Management**
   - Centralize logs with structured logging format on Datadog
   - Implement log retention and archiving policies
   - Set up log-based alerting for error patterns
   - Create log correlation with trace IDs

### 4.4 Operational Excellence

1. **Workgroup Structure**
   - Establish operational excellence workgroup
   - Regular service reviews and health checks
   - Incident management and post-mortem processes
   - Continuous improvement initiatives

2. **Service Level Objectives**
   - Define SLOs for all critical services
   - Track error budgets and reliability metrics
   - Regular SLO reviews and adjustments
   - Automated SLO reporting and dashboards

## Part 5: Development Standards

### 5.1 Code Quality Standards

- **Code Style**
  - Use ESLint with TypeScript rules
  - Follow Prettier formatting standards
  - Maintain consistent naming conventions

- **Code Review Process**
  - All code changes require at least one reviewer approval
  - Critical components require senior developer review
  - Use pull request templates for standardized descriptions

- **Code Review Requirements**
  - Detailed review checklists for different types of changes
  - Automated static analysis integrated with PR process
  - Regular code quality retrospectives

### 5.2 Documentation Standards

- **API Documentation**
  - Use OpenAPI/Swagger for API documentation
  - Document all endpoints, parameters, and responses
  - Include example requests and responses

- **Code Documentation**
  - Document all public functions and classes
  - Include JSDoc comments for TypeScript code
  - Document complex algorithms and business logic

- **Architecture Documentation**
  - Maintain up-to-date system architecture diagrams
  - Document design decisions and their rationale
  - Keep a record of rejected alternatives and why

### 5.3 CI/CD Pipeline

- **Continuous Integration**
  - Run linting and type checking on all pull requests
  - Execute unit and integration tests
  - Enforce code coverage thresholds

- **Continuous Deployment**
  - Automated deployment to staging environment after PR merge
  - Manual approval for production deployments
  - Automated rollback capability for failed deployments

### 5.4 Security Standards

- **Authentication & Authorization**
  - Use JWT with appropriate expiration times
  - Implement refresh token rotation
  - Apply principle of least privilege for all operations

- **Data Protection**
  - Encrypt sensitive data at rest and in transit
  - Implement rate limiting for authentication endpoints
  - Regular security audits and dependency updates

### 5.5 Future Considerations

- **Microservice Extraction Strategy**
  - Identify candidates for extraction (notifications, real-time, etc.)
  - Plan for service boundaries and communication patterns
  - Implement service discovery and API gateway

- **Scaling Approach**
  - Horizontal scaling for stateless services
  - Caching strategy for frequently accessed data
  - Database sharding for large data volumes

- **Integration Capabilities**
  - Design webhook system for external integrations
  - Create OAuth flow for third-party service connections
  - Implement API rate limiting and quotas

- **Analytics and Reporting**
  - Design data warehouse schema for analytics
  - Implement event tracking for user actions
  - Create reporting API for dashboard integration
