/* Peer Review Schema file */

/* Allows us to do fuzzy finding. */
CREATE EXTENSION pg_trgm;
CREATE EXTENSION postgis;

/*****************************************************************************
 * Feature Flags
 *****************************************************************************/

/** 
 * NOTE: When adding a new status, make sure to update it in
 * FeatureController::patchFeature() 
 */
CREATE TYPE feature_status AS ENUM(
    'created', /* the feature's row has been inserted into the databse table */
    'initializing',
    'initialized', /* the feature has been initialized */
    'migrating', /* the feature's data migration is being run */
    'migrated', /* the feature's data has been successfully migrated */
    'enabled',
    'disabled',
    'rolling-back', 
    'rolled-back', 
    'uninitializing',
    'uninitialized'
);
CREATE TABLE features (
    name varchar(256) PRIMARY KEY,
    status feature_status DEFAULT 'created',
    created_date timestamptz,
    updated_date timestamptz
);

/******************************************************************************
 * Users 
 *****************************************************************************/

CREATE TYPE user_status AS ENUM('invited', 'unconfirmed', 'confirmed');
CREATE TYPE user_permissions AS ENUM('user', 'moderator', 'admin', 'superadmin');
CREATE TABLE users (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),

    name varchar(512) DEFAULT '',
    username varchar(512) DEFAULT '',

    email varchar(512) NOT NULL,
    password varchar(256),

    status user_status DEFAULT 'unconfirmed',
    permissions user_permissions DEFAULT 'user',

    about varchar(1024) DEFAULT NULL,

    location geography(POINT),

    invitations int DEFAULT 50,

    created_date timestamptz,
    updated_date timestamptz 
);
CREATE INDEX users__name ON users (name);
CREATE INDEX users_username ON users (username);
CREATE INDEX users__name_trgm ON users USING GIN (name gin_trgm_ops);

/**
 * Insert the admin user. Initial password is "PasswordPassword". It will be
 * changed as soon as the environment is finished creating. 
 */
INSERT INTO users (name, username, email, password, status, permissions, created_date, updated_date)
    VALUES ('Administrator', 'administrator', 'contact@communities.social', '$2b$10$ywAqKPvFH51jeILdx.Piy.mm5ci37vMpy7G4lEBWObfIzOif5ZgzK', 'confirmed', 'superadmin', now(), now());

CREATE TYPE user_relationship_status AS ENUM('pending', 'confirmed');
CREATE TABLE user_relationships (
    user_id uuid REFERENCES users(id) ON DELETE CASCADE NOT NULL,
    friend_id uuid REFERENCES users(id) ON DELETE CASCADE NOT NULL,

    status user_relationship_status NOT NULL,

    created_date timestamptz,
    updated_date timestamptz,
    PRIMARY KEY(user_id, friend_id)
);

/******************************************************************************
 * Notifications 
 *****************************************************************************/

CREATE TABLE notifications (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id uuid REFERENCES users(id) ON DELETE CASCADE NOT NULL, 

    type varchar(1024),
    description text,
    path varchar(1024),
    is_read boolean,

    created_date timestamptz,
    updated_date timestamptz
);
CREATE INDEX notifications__user_id ON notifications (user_id);


/******************************************************************************
 * Tokens
 *****************************************************************************/

CREATE TYPE token_type AS ENUM('email-confirmation', 'reset-password', 'invitation');
CREATE TABLE tokens (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id uuid REFERENCES users(id) ON DELETE CASCADE NOT NULL,

    token varchar(1024),
    type token_type NOT NULL,

    created_date timestamptz,
    updated_date timestamptz
);
CREATE INDEX tokens__user_id ON tokens (user_id);
CREATE INDEX tokens__token ON tokens (token);


/******************************************************************************
 * Files 
 *****************************************************************************/

CREATE TABLE files (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id uuid REFERENCES users(id) ON DELETE CASCADE,

    location varchar(1024), /* This is the S3/Spaces bucket URL. */
    filepath varchar(1024),
    type varchar(256),

    created_date timestamptz,
    updated_date timestamptz
);
CREATE INDEX files__user_id ON files (user_id);

/*  Now that we've created the files table, we can add the link to the users table. */
/* This is for the user's profile picture. */
ALTER TABLE users ADD COLUMN file_id uuid REFERENCES files(id) ON DELETE SET NULL;
CREATE INDEX users__file_id ON users (file_id);

/******************************************************************************
 * Tags 
 *****************************************************************************/

CREATE TABLE tags (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    name varchar(512),
    description text,

    created_date timestamptz,
    updated_date timestamptz
);
CREATE INDEX tags__name ON tags (name);
CREATE INDEX tags__name_trgm ON tags USING GIN (name gin_trgm_ops);

/******************************************************************************
 * Tags 
 *****************************************************************************/

/* Used by both posts and post_comments */
CREATE TYPE reaction_type AS ENUM(
    /** positive **/
    'like',

    /** negative **/
    'dislike',

    /** block **/
    'block'
);

CREATE TYPE post_status AS ENUM('writing', 'editing', 'posted');
CREATE TABLE posts (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id uuid REFERENCES users (id) NOT NULL,

    file_id uuid REFERENCES files (id) DEFAULT NULL,

    status post_status default 'writing' NOT NULL,
    activity real DEFAULT 1,
    content text,

    created_date timestamptz,
    updated_date timestamptz
);
CREATE INDEX posts__user_id ON posts (user_id);
CREATE INDEX posts__file_id ON posts (file_id);

CREATE TABLE post_tags (
    post_id uuid REFERENCES posts (id) NOT NULL,
    tag_id uuid REFERENCES tags (id) NOT NULL,

    created_date timestamptz,

    PRIMARY KEY(post_id, tag_id)
);

CREATE TABLE post_reactions (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    post_id uuid REFERENCES posts (id) NOT NULL,
    user_id uuid REFERENCES users (id) NOT NULL,

    reaction reaction_type NOT NULL,

    created_date timestamptz,
    updated_date timestamptz
);
CREATE INDEX post_reactions__post_id ON post_reactions (post_id);
CREATE INDEX post_reactions__user_id ON post_reactions (user_id);

CREATE TYPE post_comment_status AS ENUM('writing', 'editing', 'posted');
CREATE TABLE post_comments (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    post_id uuid REFERENCES posts (id) NOT NULL,
    user_id uuid REFERENCES users (id) NOT NULL,

    status post_comment_status DEFAULT 'writing' NOT NULL,
    content text,

    created_date timestamptz,
    updated_date timestamptz
);
CREATE INDEX post_comments__post_id ON post_comments (post_id);
CREATE INDEX post_comments__user_id ON post_comments (user_id);

/******************************************************************************
 * Permissions
 ******************************************************************************/

CREATE TABLE roles (
    id  uuid PRIMARY KEY NOT NULL DEFAULT gen_random_uuid(),
    name    varchar(1024) NOT NULL,
    display_name varchar(1024) NOT NULL,
    description varchar(1024) NOT NULL,
    programattic boolean NOT NULL DEFAULT false,

    created_date timestamptz,
    updated_date timestamptz
);
CREATE INDEX roles__name ON roles (name);

INSERT INTO roles (name, display_name, description, programattic) VALUES ('public', 'Public', 'The general public.', true);

CREATE TABLE user_roles (
    role_id uuid REFERENCES roles(id) NOT NULL,
    user_id uuid REFERENCES users(id) NOT NULL,

    created_date timestamptz,

    PRIMARY KEY(role_id, user_id)
);

CREATE TABLE permissions (
    id uuid PRIMARY KEY NOT NULL DEFAULT gen_random_uuid(),

    entity varchar(512) NOT NULL,
    action varchar(512) NOT NULL,

    user_id uuid REFERENCES users(id) DEFAULT NULL,
    role_id uuid REFERENCES roles(id) DEFAULT NULL,

    post_id uuid REFERENCES posts(id) DEFAULT NULL,

    created_date timestamptz,
    updated_date timestamptz
);
CREATE INDEX permissions__entity ON permissions (entity);
CREATE INDEX permissions__action ON permissions (action);

CREATE INDEX permissions__user_id ON permissions (user_id);
CREATE INDEX permissions__role_id ON permissions (role_id);

CREATE INDEX permissions__post_id ON permissions (post_id);

