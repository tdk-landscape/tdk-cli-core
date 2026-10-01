## ADDED Requirements

### Requirement: Public product name
Public titles and first-screen copy SHALL identify the product as “TDK CLI” and SHALL NOT call it “Tilt Development Kit” or bare “TDK”. Existing repository and npm package names SHALL remain unchanged.

#### Scenario: Organization profile
- **WHEN** a reader opens the GitHub organization profile
- **THEN** the display name is “TDK CLI”
- **AND** the subtitle is not “Tilt Development Kit”

#### Scenario: npm package page
- **WHEN** a reader opens `@tdk-landscape/tdk-cli-core`
- **THEN** its title identifies TDK CLI as the tool for starting services on a laptop
- **AND** its package name remains unchanged

### Requirement: First sentence states the job
The first sentence of the homepage, organization About, and npm README SHALL say that TDK CLI starts services on the laptop.

#### Scenario: Homepage hero
- **WHEN** a reader loads the homepage
- **THEN** its H1 is “Start your services on your laptop.”
- **AND** the H1 contains neither “Tilt” nor “Docker”

### Requirement: Reject deploy and Compose misreads
The homepage and npm README opening SHALL say TDK CLI is not a deploy and not a Compose file, then identify `tdk up` as the local start command.

#### Scenario: Reader identifies the scope
- **WHEN** a reader sees the homepage subhead
- **THEN** it contains “Not a deploy. Not a Compose file.”
- **AND** it names `tdk up`

### Requirement: Explain the engine below the hero
The first screen SHALL omit Tilt, Starlark, PSR, Infisical, and Traefik. How it works SHALL explain the engine in one sentence: “Docker runs the containers. Tilt runs the dev loop. TDK CLI writes that config.”

#### Scenario: First-screen scan
- **WHEN** a reader scans the initial viewport
- **THEN** the listed engine terms do not appear there

### Requirement: Qualify fixture evidence
Every public mention of 100 services SHALL call them a generated `/health` fixture in the same sentence.

#### Scenario: ERP example About
- **WHEN** a reader sees the `tdk-erp-system` About text
- **THEN** it says “Scale fixture for TDK CLI: 100 generated health services. Not an ERP product.”

### Requirement: Keep one buyer in the homepage opening
The homepage SHALL NOT lead with the payroll calculator or Premium. ROI sliders SHALL remain available on `/waiting`.

#### Scenario: Calculator placement
- **WHEN** a reader loads the homepage
- **THEN** ROI sliders are absent from its content
- **AND** the calculator remains available at `/waiting`

### Requirement: Do not invent social proof
Public copy SHALL NOT add a customer name, logo, or quote unless that customer has already published it.

#### Scenario: No published testimonial exists
- **WHEN** no customer quote is on file
- **THEN** no customer quote is added

### Requirement: Use a concise scope reply
The approved reply to a deploy-tool misread SHALL explain local startup and the Helm production boundary without explaining Tilt.

#### Scenario: Deploy-tool misread
- **WHEN** a comment calls TDK CLI a deploy tool
- **THEN** the reply is “This is not a production deploy. tdk up starts services, a database, and a proxy on your machine. No cluster. Helm still deploys production.”
