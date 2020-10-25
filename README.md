This plugin allows to rewrite bundle file names.

## Why?

To get more control over bundle file names. 
You may find another useful plugin - https://github.com/ol-loginov/parcel-reporter-entries to
 get report about actual bundle file names. 

## Configuration

Plugin takes all config from package.json file. Example of config is below:

```json
{
    "name": "...",
    "version": "...",
    "description": "",

  
    "parcel-namer-rewrite": {
        "rules": {
            "styles/(.*).css": "$1.{hash}.css",
            "scripts/TestMePlease.js": "Dunno.js"
        }
    }
}
```

This example:
1) rewrites all .css bundles in "styles" folder of distDir directly to distDir and adds hashes to names.
2) moves "scripts/TestMePlease.js" to "Dunno.js"

### How write rules

"rules" is the object with rules: "key" is RegExp pattern to search in file names, "value" is replacement
 strings (you may use RegExp references here)


