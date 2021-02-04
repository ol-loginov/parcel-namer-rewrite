import {PluginLogger} from '@parcel/logger';
import path from 'path';
import fs from 'fs';

const PACKAGE_JSON_SECTION = "parcel-namer-rewrite";

export class Config {
    rules: NamerRule[]
    chain: string
    developmentHashing = false

    constructor() {
        this.chain = '@parcel/namer-default';
        this.rules = [];
    }

    loadFromPackageFolder(rootFolder: string, logger: PluginLogger) {
        const packageJson = fs.readFileSync(path.join(rootFolder, 'package.json')).toString();
        const packageInfo = JSON.parse(packageJson);
        const packageSection = packageInfo[PACKAGE_JSON_SECTION];
        if (!packageSection) {
            logger.warn({
                message: `no "${PACKAGE_JSON_SECTION}" section in package.json. Use no-rules config`
            })
            return;
        }

        if (packageSection && 'chain' in packageSection) {
            this.chain = packageSection.chain;
        }
        
        this.silent = packageSection && 'silent' in packageSection && packageSection.silent;

        if (packageSection && 'rules' in packageSection) {
            Object.keys(packageSection.rules).forEach(k => {
                const ruleData = packageSection.rules[k];
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

        if (packageSection && 'developmentHashing' in packageSection) {
            this.developmentHashing = !!packageSection.developmentHashing;
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
