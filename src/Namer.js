import {CONFIG, Namer} from '@parcel/plugin';
import {Config} from "./Config";
import {PluginLogger} from '@parcel/logger';
import crypto from "crypto";
import {md5FromFilePath} from "@parcel/utils";


// noinspection JSUnusedGlobalSymbols
export default new Namer({
    config: Config | undefined,
    delegate: null,

    async name(opts: { bundle: Bundle, bundleGraph: {}, options: {}, logger: PluginLogger }) {
        const config = this.ensureConfig(opts.options.projectRoot, opts.options.packageManager, opts.logger);
        if (!config) {
            return null;
        }

        const nameFromSuper = await this.delegate.name(opts);
        if (nameFromSuper != null) {
            return this.rewrite(opts.bundle, opts.bundleGraph, opts.options, nameFromSuper, opts.logger);
        }
        return nameFromSuper;
    },

    ensureConfig(projectRoot: string, packageManager: {}, logger: PluginLogger) {
        if (!this.config) {
            const config = new Config();
            config.loadFromPackageFolder(projectRoot, logger);
            if (!config.chain) {
                throw Error('No chain namer has been found in project. Set package.json#parcel-namer-rewrite:chain to set a delegate namer ("@parcel/namer-default" by default)');
            }

            const delegatePackage = packageManager.load(config.chain, projectRoot);
            if (!delegatePackage) {
                throw Error(`'Package ${config.delegate}' is not available. Set package.json#parcel-namer-rewrite:chain to set a delegate namer ("@parcel/namer-default" by default)`);
            }

            const delegate = delegatePackage.default[CONFIG];
            if (!delegate) {
                throw Error(`Package '${config.delegate}' has been found, but it's not a namer. Set package.json#parcel-namer-rewrite:chain to set a delegate namer ("@parcel/namer-default" by default)`);
            }

            this.delegate = delegate;
            this.config = config;
        }
        return this.config;
    },

    async rewrite(bundle: { id: string }, bundleGraph: {}, options: {}, superName: string, logger) {
        const rule = this.config.selectRule(superName);
        if (!rule) {
            return superName;
        }

        let rewriteHash = '';
        if (options.mode !== 'development' || this.config.developmentHashing) {
            let assets = [];
            bundle.traverseAssets((asset) => assets.push(asset));

            let hash = crypto.createHash('md5');
            for (let i = 0; i < assets.length; ++i) {
                const asset = assets[i];
                if (asset.filePath) {
                    const fileHash = await md5FromFilePath(asset.fs, asset.filePath);
                    hash.update([asset.filePath, fileHash].join(':'));
                }
            }

            rewriteHash = hash.digest('hex').substr(0, 6);
        }

        const rewrite = superName
            .replace(rule.test, rule.to)
            .replace(/{(.?)hash(.?)}/, `$1${rewriteHash}$2`);

        logger.info({
            message: `Rewrite ${superName} -> ${rewrite}`
        });

        return rewrite;
    }
});
