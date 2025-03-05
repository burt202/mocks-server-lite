### TODO

- introduce inquirer or something similar

### Development/Testing

- run `npm run build`
- go to `mocks-server-lite-example` repo
- run `npm link mocks-server-lite`
- follow 'To Run' instructions in its readme

### Publishing

- ensure all changes are pushed to `main`
- ensure `package.json` version has been updated accordingly and run `npm i`
- commit version bump
- go to the releases page and click 'Draft a new release'
- for 'Choose a tag', click create a new tag with the tag matches the new version number
- the title can again just be the version number
- in the description field add relevant info that describes the release and changes going out
- lastly click 'Publish release' which will kick off the `publish.yml` github workflow which ultimately runs `npm publish`
