module.exports = {
    USER_ROLES: {
        ADMIN: 'admin',
        PANELIST: 'panelist'
    },
    
    EVENT_STATUS: {
        UPCOMING: 'upcoming',
        ONGOING: 'ongoing',
        COMPLETED: 'completed'
    },

    PANELIST_STATUS: {
        ACTIVE: 'active',
        INACTIVE: 'inactive'
    },

    ERROR_MESSAGES: {
        INVALID_CREDENTIALS: 'Invalid username or password',
        USER_NOT_FOUND: 'User not found',
        EVENT_NOT_FOUND: 'Event not found',
        PARTICIPANT_NOT_FOUND: 'Participant not found',
        UNAUTHORIZED: 'Unauthorized access',
        DUPLICATE_USER: 'User already exists',
        INVALID_TOKEN: 'Invalid or expired token',
        MISSING_REQUIRED_FIELDS: 'Missing required fields',
        PANELIST_FIELDS_REQUIRED: 'Username, password and full name are required',
        PARTICIPANT_NAME_REQUIRED: 'Participant name is required'
    },

    SUCCESS_MESSAGES: {
        LOGIN_SUCCESS: 'Login successful',
        CREATED_SUCCESS: 'Created successfully',
        UPDATED_SUCCESS: 'Updated successfully',
        DELETED_SUCCESS: 'Deleted successfully'
    }
};
