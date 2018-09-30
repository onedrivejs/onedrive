# onedrive
OneDrive client written in JavaScript (node.js).

## Installation
```
npm install -g onedrivejs
```

## Setup
```
onedrive auth
```
This will provide you with a url to open in your web browser. You will be
redirected to a blank white page, copy the url you are redirected to back into
the command to finish the authentication.

Alternatively, you can authenticate the app by setting the
`ONEDRIVE_REFRESH_TOKEN` environment variable.

## Usage
```
onedrive watch [folder]
```
This will sync a folder with OneDrive and continue watching it.
