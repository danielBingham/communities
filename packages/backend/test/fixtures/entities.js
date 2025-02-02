/******************************************************************************
 * Entity Fixtures for use in tests.
 *
 * These are the entities constructed by the DAOs and returned from our REST
 * endpoints.  These are also what our REST endpoints expect to recieve when
 * constructing resources.
 *
 ******************************************************************************/

/**
 * Unclean User Entities
 *
 * These are users that have all of their data, including private data.
 *
 * @see packages/backend/daos/UserDAO.js -> hydrateUsers()
 */
const usersUnclean = {
    1: {
        id: 1,
        fileId: null,
        name: 'James Watson',
        username: 'james.watson',
        email: 'jwatson@university.edu',
        status: 'confirmed',
        permissions: 'user',
        settings: {},
        notices: {},
        about: '',
        location: '',
        invitations: 50,
        createdDate: 'TIMESTAMP',
        updatedDate: 'TIMESTAMP'
    },
    2: {
        id: 2,
        fileId: null,
        name: 'Francis Crick',
        username: 'francis.crick',
        email: 'fcrick@university.edu',
        status: 'confirmed',
        permissions: 'user',
        settings: {},
        notices: {},
        about: '',
        location: '',
        invitations: 50,
        createdDate: 'TIMESTAMP',
        updatedDate: 'TIMESTAMP'
    }
}

/**
 * Cleaned User Entities
 *
 * These are users that have been stripped of private data.
 *
 * @see packages/backend/daos/UserDAO.js -> hydrateUsers()
 */
const usersCleaned = {
    1: {
        id: 1,
        fileId: null,
        name: 'James Watson',
        username: 'james.watson',
        about: '',
        createdDate: 'TIMESTAMP',
        updatedDate: 'TIMESTAMP'
    },
    2: {
        id: 2,
        fileId: null,
        name: 'Francis Crick',
        username: 'francis.crick',
        about: '',
        createdDate: 'TIMESTAMP',
        updatedDate: 'TIMESTAMP'
    }
}


/**
 * Export the entities in the form of the `results` objects returned by our 
 * GET /resources endpoints.
 */
module.exports = {
    users: {
        dictionary: usersCleaned,
        list: Object.values(usersCleaned),
        meta: {
            count: Object.keys(usersCleaned).length,
            page: 1,
            pageSize: 20,
            numberOfPages: 1
        },
        relations: {}
    },
    usersUnclean: {
        dictionary: usersUnclean,
        list: Object.values(usersUnclean),
        meta: {
            count: Object.keys(usersUnclean).length,
            page: 1,
            pageSize: 20,
            numberOfPages: 1
        },
        relations: {}
    }
}
