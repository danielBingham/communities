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
    name text PRIMARY KEY,
    status feature_status DEFAULT 'created',
    created_date timestamptz,
    updated_date timestamptz
);

/**
 * Insert those features that have already been migrated in the schema.
 */
INSERT INTO features (name, status, created_date, updated_date)
    VALUES 
        ('80-group-moderators-can-ban-users', 'enabled', now(), now());



/******************************************************************************
 * Users 
 *****************************************************************************/

CREATE TYPE user_status AS ENUM('invited', 'unconfirmed', 'confirmed', 'banned');
CREATE TYPE user_permissions AS ENUM('user', 'moderator', 'admin', 'superadmin');
CREATE TYPE user_site_role AS ENUM('user', 'moderator', 'admin', 'superadmin');

CREATE TABLE users (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),

    name text DEFAULT '',
    username text DEFAULT '',

    email text NOT NULL,
    password text,
    birthday text DEFAULT '',

    status user_status DEFAULT 'unconfirmed',
    permissions user_permissions DEFAULT 'user',
    site_role user_site_role DEFAULT 'user',

    about text DEFAULT NULL,

    location geography(POINT),

    invitations int DEFAULT 50, /* Deprecated */

    settings jsonb DEFAULT '{}'::jsonb,
    notices jsonb DEFAULT '{}'::jsonb,

    failed_authentication_attempts int DEFAULT 0,
    last_authentication_attempt_date timestamptz,

    created_date timestamptz,
    updated_date timestamptz 
);
CREATE INDEX users__name ON users (name);
CREATE INDEX users_username ON users (username);
CREATE INDEX users__name_trgm ON users USING GIN (name gin_trgm_ops);

/**
 * Insert the admin user. Initial password is "PasswordPassword".  If deploying
 * a non-local environment, it will be changed as soon as the environment is
 * finished creating.
 */
INSERT INTO users (name, username, email, password, status, permissions, site_role, last_authentication_attempt_date, created_date, updated_date)
    VALUES ('Administrator', 'administrator', 'contact@communities.social', '$2b$10$ywAqKPvFH51jeILdx.Piy.mm5ci37vMpy7G4lEBWObfIzOif5ZgzK', 'confirmed', 'superadmin', 'superadmin', now(), now(), now());

CREATE TYPE user_relationship_status AS ENUM('pending', 'confirmed', 'blocked');
CREATE TABLE user_relationships (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id uuid REFERENCES users(id) ON DELETE CASCADE NOT NULL,
    friend_id uuid REFERENCES users(id) ON DELETE CASCADE NOT NULL,

    status user_relationship_status NOT NULL,

    created_date timestamptz,
    updated_date timestamptz
);
CREATE INDEX user_relationships__user_id ON user_relationships (user_id);
CREATE INDEX user_relationships__friend_id ON user_relationships (friend_id);

/******************************************************************************
 * Notifications 
 *****************************************************************************/

CREATE TABLE notifications (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id uuid REFERENCES users(id) ON DELETE CASCADE NOT NULL, 

    type text,
    description text,
    path text,
    is_read boolean,

    created_date timestamptz,
    updated_date timestamptz
);
CREATE INDEX notifications__user_id ON notifications (user_id);

/******************************************************************************
 * Email Domain Blocklist
 ******************************************************************************/

CREATE TABLE blocklist (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id uuid REFERENCES users(id) ON DELETE SET NULL DEFAULT NULL, 
    domain text NOT NULL,
    notes text DEFAULT '',
    created_date timestamptz,
    updated_date timestamptz
);
CREATE INDEX blocklist__user_id ON blocklist (user_id);
CREATE INDEX blocklist__domain ON blocklist (domain);

/******************************************************************************
 * Tokens
 *****************************************************************************/

CREATE TYPE token_type AS ENUM('email-confirmation', 'reset-password', 'invitation');
CREATE TABLE tokens (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id uuid REFERENCES users(id) ON DELETE CASCADE NOT NULL,

    /** User who created the token, for invitations. **/
    creator_id uuid REFERENCES users (id) ON DELETE SET NULL,

    token text,
    type token_type NOT NULL,

    created_date timestamptz,
    updated_date timestamptz
);
CREATE INDEX tokens__user_id ON tokens (user_id);
CREATE INDEX tokens__creator_id ON tokens (creator_id);
CREATE INDEX tokens__token ON tokens (token);

/******************************************************************************
 * Files 
 *****************************************************************************/

CREATE TABLE files (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id uuid REFERENCES users(id) ON DELETE CASCADE,

    location text, /* This is the S3/Spaces bucket URL. */
    filepath text,
    type text,

    created_date timestamptz,
    updated_date timestamptz
);
CREATE INDEX files__user_id ON files (user_id);

/*  Now that we've created the files table, we can add the link to the users table. */
/* This is for the user's profile picture. */
ALTER TABLE users ADD COLUMN file_id uuid REFERENCES files(id) ON DELETE SET NULL;
CREATE INDEX users__file_id ON users (file_id);

/******************************************************************************
 *
 ******************************************************************************/

CREATE TABLE link_previews (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    url text,

    title text,
    type text,
    site_name text,
    description text,
    image_url text,
    file_id uuid REFERENCES files (id) ON DELETE SET NULL,

    created_date timestamptz,
    updated_date timestamptz
);
CREATE INDEX link_previews__url ON link_previews (url);

/******************************************************************************
 * Tags 
 *****************************************************************************/

CREATE TABLE tags (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    name text,
    description text,

    created_date timestamptz,
    updated_date timestamptz
);
CREATE INDEX tags__name ON tags (name);
CREATE INDEX tags__name_trgm ON tags USING GIN (name gin_trgm_ops);

/******************************************************************************
 * Groups
 ******************************************************************************/

CREATE TYPE group_type as ENUM('open', 'private', 'hidden');
CREATE TYPE group_post_permissions as ENUM('anyone', 'members', 'approval', 'restricted');
CREATE TABLE groups (
    id uuid primary key DEFAULT gen_random_uuid(),
    post_permissions group_post_permissions DEFAULT 'members',
    type group_type,
    title text,
    slug text,
    about text,

    file_id uuid REFERENCES files (id) ON DELETE SET NULL DEFAULT NULL,

    entrance_questions jsonb DEFAULT '{}'::jsonb,

    created_date timestamptz,
    updated_date timestamptz
);
CREATE INDEX groups__file_id ON groups (file_id);
CREATE INDEX groups_title ON groups (title);
CREATE INDEX groups_title_trgm ON groups USING GIN (title gin_trgm_ops);

CREATE TYPE group_member_status AS ENUM('pending-invited', 'pending-requested', 'member', 'banned');
CREATE TYPE group_member_role AS ENUM('admin', 'moderator', 'member'); 
CREATE TABLE group_members (
    id uuid primary key DEFAULT gen_random_uuid(),
    group_id uuid REFERENCES groups (id) ON DELETE CASCADE NOT NULL,
    user_id uuid REFERENCES users (id) ON DELETE CASCADE NOT NULL,

    status group_member_status DEFAULT 'pending-requested',
    entrance_answers jsonb DEFAULT '{}'::jsonb,
    role group_member_role DEFAULT 'member',

    created_date timestamptz,
    updated_date timestamptz
);
CREATE INDEX group_members__group_id ON group_members (group_id);
CREATE INDEX group_members__user_id ON group_members (user_id);

/******************************************************************************
 * Tags 
 *****************************************************************************/

CREATE TYPE post_type as ENUM('feed', 'group', 'event', 'announcement', 'info');
CREATE TYPE post_visibility as ENUM('public', 'private');

CREATE TABLE posts (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id uuid REFERENCES users (id) ON DELETE CASCADE NOT NULL,

    group_id uuid REFERENCES groups (id) ON DELETE CASCADE DEFAULT NULL,

    type post_type NOT NULL DEFAULT 'feed' ,
    visibility post_visibility NOT NULL DEFAULT 'private',

    file_id uuid REFERENCES files (id) DEFAULT NULL,
    link_preview_id uuid REFERENCES link_previews (id) DEFAULT NULL,
    shared_post_id uuid REFERENCES posts (id) ON DELETE SET NULL DEFAULT NULL,


    site_moderation_id uuid DEFAULT NULL, /* REFERENCES site_moderation (id) ON DELETE SET NULL -- defined below*/
    group_moderation_id uuid DEFAULT NULL, /* REFERENCES group_moderation (id) ON DELETE SET NULL -- defined below */

    activity bigint DEFAULT 1,
    content text,

    created_date timestamptz,
    updated_date timestamptz
);
CREATE INDEX posts__user_id ON posts (user_id);
CREATE INDEX posts__file_id ON posts (file_id);
CREATE INDEX posts__group_id ON posts (group_id);

CREATE TABLE post_versions (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    post_id uuid REFERENCES posts (id) ON DELETE CASCADE NOT NULL,

    file_id uuid REFERENCES files (id) ON DELETE SET NULL DEFAULT NULL,

    content text,

    created_date timestamptz,
    updated_date timestamptz
);
CREATE INDEX post_versions__post_id ON post_versions (post_id);
CREATE INDEX post_versions__file_id ON post_versions (file_id);

CREATE TABLE post_tags (
    post_id uuid REFERENCES posts (id) NOT NULL,
    tag_id uuid REFERENCES tags (id) NOT NULL,

    created_date timestamptz,

    PRIMARY KEY(post_id, tag_id)
);

/* Used by both posts and post_comments */
CREATE TYPE reaction_type AS ENUM(
    /** positive **/
    'like',

    /** negative **/
    'dislike',

    /** block **/
    'block'
);
CREATE TABLE post_reactions (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    post_id uuid REFERENCES posts (id) ON DELETE CASCADE NOT NULL,
    user_id uuid REFERENCES users (id) ON DELETE CASCADE NOT NULL,

    reaction reaction_type NOT NULL,

    created_date timestamptz,
    updated_date timestamptz
);
CREATE INDEX post_reactions__post_id ON post_reactions (post_id);
CREATE INDEX post_reactions__user_id ON post_reactions (user_id);

CREATE TABLE post_comments (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    post_id uuid REFERENCES posts (id) ON DELETE CASCADE NOT NULL,
    user_id uuid REFERENCES users (id) ON DELETE CASCADE NOT NULL,

    content text,

    site_moderation_id uuid DEFAULT NULL, /* REFERENCES site_moderation (id) ON DELETE SET NULL -- defined below*/
    group_moderation_id uuid DEFAULT NULL, /* REFERENCES group_moderation (id) ON DELETE SET NULL -- defined below */

    created_date timestamptz,
    updated_date timestamptz
);
CREATE INDEX post_comments__post_id ON post_comments (post_id);
CREATE INDEX post_comments__user_id ON post_comments (user_id);

CREATE TABLE post_comment_versions (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    post_comment_id uuid REFERENCES post_comments (id) ON DELETE CASCADE NOT NULL,

    content text,

    created_date timestamptz,
    updated_date timestamptz
);
CREATE INDEX post_comment_versions__post_comment_id ON post_comment_versions (post_comment_id);

CREATE TABLE post_subscriptions (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id uuid REFERENCES users (id) ON DELETE CASCADE NOT NULL,
    post_id uuid REFERENCES posts (id) ON DELETE CASCADE NOT NULL,

    created_date timestamptz,
    updated_date timestamptz
);
CREATE INDEX post_subscriptions__user_id ON post_subscriptions (user_id);
CREATE INDEX post_subscriptions__post_id ON post_subscriptions (post_id);

/******************************************************************************
 * Group Moderation
 ******************************************************************************/
CREATE TYPE group_moderation_status AS ENUM('flagged', 'approved', 'rejected', 'pending');
CREATE TABLE group_moderation (
    id uuid PRIMARY KEY NOT NULL DEFAULT gen_random_uuid(),
    user_id uuid REFERENCES users (id) ON DELETE SET NULL,
    group_id uuid REFERENCES groups (id) ON DELETE CASCADE NOT NULL,

    status group_moderation_status NOT NULL DEFAULT 'flagged',
    reason text,

    post_id uuid REFERENCES posts (id) ON DELETE CASCADE DEFAULT NULL ,
    post_comment_id uuid REFERENCES post_comments (id) ON DELETE CASCADE DEFAULT NULL, 

    created_date timestamptz, 
    updated_date timestamptz
);
CREATE INDEX group_moderation__user_id ON group_moderation (user_id);
CREATE INDEX group_moderation__post_id ON group_moderation (post_id);
CREATE INDEX group_moderation__post_comment_id ON group_moderation (post_comment_id);

CREATE TABLE group_moderation_events (
    id uuid PRIMARY KEY NOT NULL DEFAULT gen_random_uuid(),
    group_moderation_id uuid REFERENCES group_moderation (id) ON DELETE SET NULL,
    user_id uuid REFERENCES users (id) ON DELETE SET NULL,
    group_id uuid REFERENCES groups (id) ON DELETE CASCADE NOT NULL,

    status group_moderation_status NOT NULL,
    reason text,

    post_id uuid REFERENCES posts(id) ON DELETE CASCADE DEFAULT NULL,
    post_comment_id uuid REFERENCES post_comments(id) ON DELETE CASCADE DEFAULT NULL,

    created_date timestamptz
);
CREATE INDEX group_moderation_events__group_moderation_id ON group_moderation_events (group_moderation_id);
CREATE INDEX group_moderation_events__user_id ON group_moderation_events (user_id);
CREATE INDEX group_moderation_events__post_id ON group_moderation_events (post_id);
CREATE INDEX group_moderation_events__post_comment_id ON group_moderation_events (post_comment_id);

ALTER TABLE posts ADD CONSTRAINT posts_group_moderation_id_fkey FOREIGN KEY (group_moderation_id) REFERENCES group_moderation (id) ON DELETE SET NULL;
ALTER TABLE post_comments ADD CONSTRAINT post_comments_group_moderation_id_fkey FOREIGN KEY (group_moderation_id) REFERENCES group_moderation (id) ON DELETE SET NULL;

/******************************************************************************
 * Site administration
 ******************************************************************************/

CREATE TYPE site_moderation_status AS ENUM('flagged', 'approved', 'rejected');
CREATE TABLE site_moderation (
    id uuid PRIMARY KEY NOT NULL DEFAULT gen_random_uuid(),
    user_id uuid REFERENCES users (id) ON DELETE SET NULL,

    status site_moderation_status NOT NULL DEFAULT 'flagged',
    reason text,

    post_id uuid REFERENCES posts (id) ON DELETE CASCADE DEFAULT NULL ,
    post_comment_id uuid REFERENCES post_comments (id) ON DELETE CASCADE DEFAULT NULL, 

    created_date timestamptz, 
    updated_date timestamptz
);
CREATE INDEX site_moderation__user_id ON site_moderation (user_id);
CREATE INDEX site_moderation__post_id ON site_moderation (post_id);
CREATE INDEX site_moderation__post_comment_id ON site_moderation (post_comment_id);

CREATE TABLE site_moderation_events (
    id uuid PRIMARY KEY NOT NULL DEFAULT gen_random_uuid(),
    site_moderation_id uuid REFERENCES site_moderation (id) ON DELETE SET NULL,
    user_id uuid REFERENCES users (id) ON DELETE SET NULL,

    status site_moderation_status NOT NULL,
    reason text,

    post_id uuid REFERENCES posts(id) ON DELETE CASCADE DEFAULT NULL,
    post_comment_id uuid REFERENCES post_comments(id) ON DELETE CASCADE DEFAULT NULL,

    created_date timestamptz
);
CREATE INDEX site_moderation_events__site_moderation_id ON site_moderation_events (site_moderation_id);
CREATE INDEX site_moderation_events__user_id ON site_moderation_events (user_id);
CREATE INDEX site_moderation_events__post_id ON site_moderation_events (post_id);
CREATE INDEX site_moderation_events__post_comment_id ON site_moderation_events (post_comment_id);

ALTER TABLE posts ADD CONSTRAINT posts_site_moderation_id_fkey FOREIGN KEY (site_moderation_id) REFERENCES site_moderation (id) ON DELETE SET NULL;
ALTER TABLE post_comments ADD CONSTRAINT post_comments_site_moderation_id_fkey FOREIGN KEY (site_moderation_id) REFERENCES site_moderation (id) ON DELETE SET NULL;

/******************************************************************************
 * Permissions
 ******************************************************************************/

CREATE TABLE roles (
    id  uuid PRIMARY KEY NOT NULL DEFAULT gen_random_uuid(),
    name    text NOT NULL,
    display_name text NOT NULL,
    description text NOT NULL,
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

    entity text NOT NULL,
    action text NOT NULL,

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


