# State

The Redux store: a slice per entity holding a dictionary and named queries,
relations spread across slices, and how state is cleaned up. Requests that
fill the store are in [Requests](requests.md).

**Code:** `web-application/client/state/`, `web-application/client/state/lib/`

## The Store

`state/store.js` combines:

- **An entity slice per entity**, in a folder named for it
  (`state/Post/`, `state/GroupMember/`), with `slice.js`, `thunks.js` and an
  `index.js` exporting both.
- **System slices**: `system` (configuration, CSRF token, features, host
  and API, text zoom), `authentication` (the current user, a pending MFA
  user), `socket` and `events` (the WebSocket and its subscriptions),
  `jobs`, `notifications`, `requests`, `history`, `tokens`, `admin`,
  `features`.

The socket middleware is added here; see [Real-Time](real-time.md).

## An Entity Slice

```javascript
const initialState = {
    dictionary: {},   // { [id]: entity }
    queries: {}       // { [name]: { meta, list } }
}

export const PostSlice = createSlice({
    name: 'Post',
    initialState,
    reducers: {
        setPostsInDictionary: setInDictionary,
        removePost: removeEntity,
        setPostQueryResults: setQueryResults,
        clearPostQuery: clearQuery,
        clearPostQueries: clearQueries,
        resetPostSlice: () => initialState
    }
})
```

The generic reducers come from `state/lib/slice.js`. `setInDictionary`
takes `{ entity }` or `{ dictionary }`; `setQueryResults` takes
`{ name, meta, list }`. A slice can hold more (Post keeps `drafts`).

- **`dictionary`** is the single copy of each entity, however many queries
  include it. Components select from it by id.
- **`queries`** are results by name, each with `meta` (paging) and `list`
  (ids in order). The entity hooks name a query by its parameters
  (`JSON.stringify(params)`), so the same parameters share a query.

## Thunks

Each thunk calls one endpoint, named after the controller method it calls,
and updates the store on success:

```javascript
export const getPosts = function(name, params) {
    return function(dispatch, getState) {
        const endpoint = `/posts${( params ? '?' + qs.stringify(params) : '')}`
        return dispatch(makeRequest('GET', endpoint, null,
            function(response) {
                dispatch(setPostsInDictionary({ dictionary: response.dictionary }))
                dispatch(setPostQueryResults({ name, meta: response.meta, list: response.list }))
                dispatch(setRelationsInState(response.relations))
            }
        ))
    }
}
```

After a create or delete, thunks clear the entity's queries
(`clearPostQueries()`), so lists are fetched again with the change.

## Relations

`setRelationsInState(relations)` (`state/lib/relations.js`) puts each
relation from a response into its own slice: `users` into `User`,
`postComments` into `PostComment`, and so on, through its `entityMap`. A
new entity slice must be added there, or its relations are dropped with a
warning. `cleanupRelations()` does the reverse.

## Cleaning Up

- **Queries:** entity query hooks clear their query when the component
  using it unmounts; its entities stay in the dictionary. A few slices
  (`Post`, `User`, `Blocklist`) also have a `cleanup<Entity>Query(name)`
  thunk, which removes the query's entities too, unless another query
  still uses them (`queryIsUsing()`).
- **Everything:** `resetEntities()` (`state/lib/reset.js`) resets every
  entity slice, for changes that affect what the user can see everywhere
  (friending or unfriending someone).
- **Logging out** dispatches `system/reset`, which `store.js` turns into a
  reset of the whole store, clears local storage (drafts) and, in the
  apps, the stored session, then reloads at `/`.

## Adding a Slice

1. Create `state/<Entity>/slice.js`, `thunks.js` and `index.js`, following
   `state/Post/`.
2. Add the reducer to `state/store.js`.
3. Add it to `entityMap` in `state/lib/relations.js` (under the relation's
   name in responses) and to `state/lib/reset.js`.
4. Add hooks in `lib/hooks/<Entity>/`; see [Hooks](hooks.md).
