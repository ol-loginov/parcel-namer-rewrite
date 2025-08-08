import {Namer} from '@parcel/plugin';
import {Config} from "./Config";
import {PluginLogger} from '@parcel/logger';
import crypto from "crypto";
import {md5FromFilePath} from "@parcel/utils";

const CONFIG = Symbol.for('parcel-plugin-config');

// noinspection JSUnusedGlobalSymbols
export default new Namer({
    config: Config | undefined,
    delegate: null,

    async name(opts: { bundle: Bundle, bundleGraph: {}, options: {}, logger: PluginLogger }) {
        const config = this.ensureConfig(opts.options, opts.logger);
        if (!config) {
            return null;
        }

        if (config.skipTargets.includes(opts.bundle?.target?.name)) {
            return await this.delegate.name(opts);
        }

        const nameFromSuper = await this.delegate.name(opts);
        if (nameFromSuper != null && !config.disable) {
            return this.rewrite(opts.bundle, opts.bundleGraph, opts.options, nameFromSuper, opts.logger);
        }
        return nameFromSuper;
    },

    ensureConfig(options: {}, logger: PluginLogger) {
        if (!this.config) {
            const projectRoot = options.projectRoot
            const packageManager = options.packageManager
            const env = options.env
            const profiles = options.mode

            const config = new Config();
            config.loadFromPackageFolder(projectRoot, env, profiles, logger);
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

    async getBundleHash(bundle) {
        if (this.config.hashing === 'never') return '';

        if (this.config.useParcelHash && bundle.hashReference) {
            return bundle.hashReference;
        }

        if (this.config.hashing !== 'always') return ''

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
        return hash.digest('hex').substring(0, 6);
    },

    async rewrite(bundle: { id: string }, bundleGraph: {}, options: {}, superName: string, logger) {
        const neverHashing = this.config.hashing === 'never';

        function superNameWithoutHashReference() {
            return bundle.hashReference
                ? superName.replace("." + bundle.hashReference, "")
                : superName;
        }

        const rule = this.config.selectRule(superName);
        if (!rule) {
            return neverHashing ? superNameWithoutHashReference() : superName;
        }

        const bundleHash = await this.getBundleHash(bundle, options);
        const rewrite = superNameWithoutHashReference()
            .replace(rule.test, rule.to)
            .replace(/{(.?)hash(.?)}/, !neverHashing && bundleHash.length > 0 ? `$1${bundleHash}$2` : '');

        if (this.config.silent !== true) {
            logger.info({
                message: `Rewrite ${superName} -> ${rewrite}`
            });
        }

        return rewrite;
    }
});
