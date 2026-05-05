# Profile Page Redesign Plan

## Current Structure (845 lines)
- Growth Plan and Roadmap
- Min Job Fit Slider
- Personal Information (2 columns: contact + summary)
- Skills + Work Values (2 columns)
- Work Experience (dynamic list)
- Education (dynamic list)
- Trainings & Certifications (dynamic list)
- Skills and Courses Link
- CV Download

## New Structure (English)

### 1. Growth Path & Profile Readiness (TOP)
**Icon-first overview card**
- Growth Path
- Profile Readiness Moves
- Supporting materials (collapsible guidance)
- Status indicators: Needs Input, In Progress, Complete

### 2. Personal Information Card (2 columns)
**Left Column: Contact Information**
- Full Name
- Email
- Phone
- Location
- LinkedIn URL
- CV URL

**Right Column: Professional Summary + Work Values**
- Professional Summary (textarea)
- Work Values (select list + custom input field)

### 3. Career Goals (2 columns)
**Left Column: Career Goals**
- Target Job Title
- Target Salary Min/Max
- Target Seniority
- Desired Industry

**Right Column: Work Preferences**
- Remote/Hybrid/Office
- Willing to Travel
- Preferred Company Size
- Work-Life Balance Priority

### 4. Dynamic Sections (2 columns)
**Left Column: Work Experience**
- Dynamic list of experiences
- Add/Edit/Delete functionality

**Right Column: Education, Courses, Languages, Hobbies**
- Education (dynamic)
- Important Courses/Certifications (dynamic)
- Languages (dynamic)
- Hobbies (dynamic)

### 5. Skills Summary (BOTTOM)
- All skills pulled from documents
- Skills from trainings section
- Add "Certifications/Licenses" to trainings

## Implementation Steps

1. ✅ Create redesign plan
2. Add new state for Career Goals and Work Preferences
3. Add new state for Languages and Hobbies
4. Restructure JSX layout
5. Update styling for 2-column layouts
6. Add Work Values select list
7. Test and deploy

## New Fields to Add

### Career Goals (backend schema may need update)
- targetJobTitle (exists)
- targetSalaryMin (exists)
- targetSalaryMax (exists)
- targetSeniority (new?)
- desiredIndustry (new?)

### Work Preferences (new section)
- workMode: 'remote' | 'hybrid' | 'office'
- willingToTravel: boolean
- preferredCompanySize: 'startup' | 'small' | 'medium' | 'large' | 'enterprise'
- workLifeBalance: number (1-5 scale)

### Languages (new section)
- language: string
- proficiency: 'basic' | 'intermediate' | 'advanced' | 'native'

### Hobbies (new section)
- hobby: string
- description: string (optional)

## Notes
- All data must be pulled from documents where possible
- Keep existing functionality intact
- Maintain responsive design
- English labels throughout
