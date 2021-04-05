# clean-up-gh-packages
A GitHub Action that cleans up old version of packages published to GitHub Packages

## Inputs

### `ORG`

Name of the organisation in which the github package was published. If org is not given, package will be considered to belong to a user.

### `PACKAGE_TYPE`

The type of supported package. Can be one of npm, maven, rubygems, nuget, docker, or container.

**Required**

### `OLDER_THAN_NUMBER_OF_DAYS`

Packages older than OLDER_THAN_NUMBER_OF_DAYS will be deleted.

**Required**

### `TOKEN`

Auth token with delete permission.

**Required**

## Example Usage

```yml
- name: Clean up packages
  uses: gps/clean-up-gh-packages@master
  with:
    ORG: {{ORG_NAME}}
    PACKAGE_TYPE: npm
    OLDER_THAN_NUMBER_OF_DAYS: 30
    TOKEN: ${{ secrets.TEST_PACKAGE__RELEASE_DELETE_KEY }}
```

```yml
- name: Clean up packages
  uses: gps/clean-up-gh-packages@master
  with:
    PACKAGE_TYPE: npm
    OLDER_THAN_NUMBER_OF_DAYS: 30
    TOKEN: ${{ secrets.TEST_PACKAGE__RELEASE_DELETE_KEY }}
```

## Example to take input from user and manually trigger github action

``` yml
name: Clean up packages
on:
 workflow_dispatch:
  inputs:
    noOfDays:
      description: 'Number of days older than which the package versions should be deleted'     
      required: true
jobs:
  clean-up-packages:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2
      - name: clean up packages
        uses: gps/clean-up-gh-packages@master
        with:
          ORG: {{ORG_NAME}}
          PACKAGE_TYPE: npm
          OLDER_THAN_NUMBER_OF_DAYS: ${{ github.event.inputs.noOfDays }}
          TOKEN: ${{ secrets.TEST_PACKAGE__RELEASE_DELETE_KEY }}
```
