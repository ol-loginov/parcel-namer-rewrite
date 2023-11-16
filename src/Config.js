import {PluginLogger} from '@parcel/logger';
import path from 'path';
import fs from 'fs';

const PACKAGE_JSON_SECTION = "parcel-namer-rewrite";

export class Config {
    profileEnvKey = 'PARCEL-NAMER-REWRITE-PROFILE'

    rules: NamerRule[]
    chain: string
    /**
     * Disable in development
     */
    disable = false
    /**
     * Name hashing
     */
    hashing = '' // "never", "always"
    /**
     * Disable logging names
     */
    silent = false
    /**
     * Use file name hashes from parcel
     */
    useParcelHash = true

    constructor() {
    }

    loadFromPackageFolder(rootFolder: string, env: {}, defaultProfiles: string[], logger: PluginLogger) {
        const packageJson = fs.readFileSync(path.join(rootFolder, 'package.json')).toString();
        const packageInfo = JSON.parse(packageJson);
        const packageSection = packageInfo[PACKAGE_JSON_SECTION];
        if (!packageSection) {
            logger.warn({
                message: `no "${PACKAGE_JSON_SECTION}" section in package.json. Use no-rules config`
            })
            return;
        }

        this._loadFromPackageSection(packageSection, logger);

        let profileNames = '';
        if (defaultProfiles) profileNames += ',' + defaultProfiles
        if (this.profileEnvKey in env) profileNames += ',' + env[this.profileEnvKey]

        const profileSections = packageSection['profiles'];
        if (profileSections) {
            profileNames.split(/[,]/)
                .map(profile => profileSections[profile])
                .filter(profile => !!profile)
                .forEach(profile => {
                    this._loadFromPackageSection(profile, logger)
                });
        }

        if (!this.chain) {
            this.chain = '@parcel/namer-default';
            logger.info({message: 'Delegate namer is not configured. Use default "@parcel/namer-default"'});
        }

        if (!this.rules) {
            this.rules = [];
            logger.info({message: 'Rewrite rules are empty'})
        }
    }

    _loadFromPackageSection(section, logger: PluginLogger) {
        if (!section) return;

        if ('profile-env-key' in section) {
            this.profileEnvKey = section['profile-env-key'];
        }

        if ('chain' in section) {
            this.chain = section.chain;
        }

        if ('neverHashing' in section) {
            this.neverHashing = !!section.neverHashing
        }

        this.silent = 'silent' in section && section.silent;

        if ('useParcelHash' in section) {
            this.useParcelHash = !!section.useParcelHash;
        }

        if ('rules' in section) {
            Object.keys(section.rules).forEach(k => {
                const ruleData = section.rules[k];
                const ruleTo = typeof ruleData === 'string' ? ruleData : null;
                if (ruleTo === null) {
                    logger.warn(`No "to" rule for test "${k}" `);
                    return;
                }

                this.rules.push({
                    test: new RegExp(k),
                    to: ruleTo
                })
            })
        }

        if ('developmentHashing' in section) {
            throw Error(`The "developmentHashing" option is not supported any more. Add "development" profile and set {"hashing": "never"} there. See documentation for details here: https://github.com/ol-loginov/parcel-namer-rewrite`)
        }

        if ('developmentDisable' in section) {
            throw Error(`The "developmentDisable" option is not supported any more. Add "development" profile and set {"disable": false} there. See documentation for details here: https://github.com/ol-loginov/parcel-namer-rewrite`)
        }

        if ('hashing' in section) {
            this.hashing = section['hashing'];
        }
        if ('disable' in section) {
            this.disable = !!section['disable'];
        }
    }

    selectRule(name: string): NamerRule | null {
        const matches = this.rules
            .map(rule => rule.test.test(name) ? rule : null)
            .filter(rule => rule != null);
        if (matches.length > 0) {
            return matches[0];
        }
        return null;
    }
}

export interface NamerRule {
    test: RegExp;
    to: string;
}
