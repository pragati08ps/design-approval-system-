// User Roles
export const ROLES = {
    DESIGNER: 'Designer',
    DIGITAL_MARKETER: 'Digital Marketer',
    ADMIN: 'Admin',
    GRAPHIC_DESIGNER: 'Graphic Designer',
    MANAGER: 'Manager',
    CEO: 'CEO',
    CLIENT: 'Client'
};

// Workflow Stages
export const STAGES = {
    DIGITAL_MARKETER: 'digital_marketer',
    DESIGNER: 'designer',
    GRAPHIC_DESIGNER: 'graphic_designer',
    MANAGER: 'manager',
    ADMIN: 'admin',
    CLIENT: 'client',
    COMPLETED: 'completed'
};

// Stage Display Names
export const STAGE_NAMES = {
    [STAGES.DIGITAL_MARKETER]: 'Content Upload',
    [STAGES.DESIGNER]: 'Design Upload',
    [STAGES.GRAPHIC_DESIGNER]: 'Graphic Designer Review',
    [STAGES.MANAGER]: 'Manager Review',
    [STAGES.ADMIN]: 'Admin Review',
    [STAGES.CLIENT]: 'Client Review',
    [STAGES.COMPLETED]: 'Completed'
};

// Design Types
export const DESIGN_TYPES = [
    'Poster',
    'Webpage',
    'Video',
    'Brochure',
    'Flyers',
    'Logo',
    'Nameboard',
    'Letterhead'
];

// API Base URL
export const API_BASE_URL = 'http://localhost:8000';
