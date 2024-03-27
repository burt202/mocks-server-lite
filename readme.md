# Mocks Server

### To Run

- `npm run mocks`
- fetch users using mocks in default collection: `curl http://localhost:3000/api/users`
- update the selected collection special endpoint: `curl -X POST -d '{"collection":"all-users"}' -H 'Content-Type: application/json' http://localhost:3000/__set-collection`
- fetch users using mocks in updated collection: `curl http://localhost:3000/api/users`

### TODO

- pretty terminal logging
- better runtime not found error
- middleware
- calling same endpoint multiple times (callcount)
