This plugin allows to rewrite bundle file names.

## Why?

To get more control over bundle file names.
You may find another useful plugin - https://github.com/ol-loginov/parcel-reporter-entries to
get report about actual bundle file names.

## Install and usage

Install the package first:

```
npm install --save-dev parcel-namer-rewrite
```

And edit `.parcelrc` file to add new namer (put it before or instead default one):

```
/* .parcelrc */
{
  "extends": "@parcel/config-default",
  "namers": [ "parcel-namer-rewrite" ]
}
```

## Configuration

Plugin takes all config from package.json file. Example of config is below:

```json5
/* package.json */
{
  "name": "...",
  "version": "...",
  "description": "",
  "parcel-namer-rewrite": {
    /* This is optional, you may omit that line, and default namer will be used to get actual names */
    "chain": "@parcel/namer-default",
    /* You may select between always|never hashing. See below for details*/
    "hashing": "always",
    /* Turn plugin on and off */
    "disable": false,
    /* Rewrite rules */
    "rules": {
      "styles/(.*).css": "$1.{hash}.css",
      "scripts/TestMePlease.js": "Dunno.js"
    },
    /* profiles are optional */
    "profiles": {
      "development": {
        /* for development Node mode */
      },
      "production": {
        /* for production Node mode */
      },
      "other-custom-profile": {
        /* this profile is activated via environment variable */
      }
    }
  }
}
```

This example:

1) Rewrites all .css bundles in "styles" folder of distDir directly to distDir and adds hashes to names.
2) Moves "scripts/TestMePlease.js" to "Dunno.js"

### How to write rules

"rules" is the object with rules: "key" is RegExp pattern to search in file names, "value" is replacement
strings (you may use RegExp references here)

### Using hash in file names

File name `"$1.{hash}.css"` adds hash before extension. If hash is empty (in development mode, for example), then you get double dot in file name:

```
"file.{hash}.css" -> "file..css"
```

But there is a solution - just put dot inside brackets. For example: `"file{.hash}.css"` or `"file{hash.}.css"`. In this case for empty hash strings all inside brackets will be removed. And you may use any single character instead of dot: `"file{~hash}.css"`, `"file{-hash}.css"` are valid replacements.

### Hashing mode

In development mode hashes are blank for file names. You may force hashing in development mode by setting "hashing" to `true` in "development" profile.

Like this:

```json5
/* package.json */
{
  "parcel-namer-rewrite": {
    "rules": {
      /* some rules  */
    },
    "profiles": {
      "development": {
        "hashing": "always"
      }
    }
  }
}
```

You may turn off hashing completely (even for non-entry bundles) by selecting `hashing` to `"never"`.
You may set it on the main configuration or in profile configuration.

Any other (or absent) value for `hashing' will keep hash only for assets that are hashed by parcel itself.

### Hide logs

This plugin will log every renamed file. To disable this feature, add this option to `package.json` :

```json5
/* package.json */
{
  "parcel-namer-rewrite": {
    // ...
    "silent": true
  }
}
```

### Disable in development mode

You may want to disable the namer in development mode. To disable the plugin, add this option to `package.json` profile `"development"` :

```json5
/* package.json */
{
  "parcel-namer-rewrite": {
    // ...
    "profiles": {
      "development": {
        "disable": true
      }
    },
  }
}
```

### Configuration profiles

You may want to override some configuration based on some condition - use configuration profile feature! `"profiles"` section in plugin configuration
may contain additional configuration options that are activated based on profile key. By default, there are `"development"` and `"production"`
profiles (you don't need to activate it via environment). These profiles are being activated by current Node mode - development or production.

In configuration below plugin is turned off for production mode:

```json5
/* package.json */
{
  "parcel-namer-rewrite": {
    "profiles": {
      "development": {
        /* for development Node mode */
      },
      "production": {
        /* for production Node mode */
        "disable": true
      },
    }
  }
}
```

To activate other profiles - use environment variable `PARCEL_NAMER_REWRITE_PROFILE`. Here you may see command line:

```commandline
PARCEL_NAMER_REWRITE_PROFILE=myprofile parcel build
```

and corresponding configuration profile in package.json (it disables hashing completely)

```json5
/* package.json */
{
  "parcel-namer-rewrite": {
    "profiles": {
      "myprofile": {
        "hashing": "never"
      }
    }
  }
}
```

You may activate multiple profiles with comma-delimited list of profile keys

```commandline
PARCEL_NAMER_REWRITE_PROFILE=myprofile,profile2,profile3 parcel build
```
