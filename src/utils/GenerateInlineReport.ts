// tslint:disable-next-line:no-implicit-dependencies
import * as ParcelBundler from "parcel-bundler";
// tslint:disable-next-line:no-implicit-dependencies
import * as plugin from "parcel-plugin-inliner";
import { Constants } from "../processor/Constants";
import { IO } from "./IO";
import { Dependencies } from "../processor/Dependencies";
import * as path from "path";
import { IThirdPartyDependency } from "../processor/doc/IThirdPartyDependency";

const resultDir = "web/temp/";

const obtainWebFile = (name: string): string => {
    return IO.readFileSync(path.resolve(__dirname, "./../../web", name));
};

const obtainJsRenderFile = (name: string): string => {
    return IO.readFileSync(path.resolve(__dirname, "./../render/", name));
};

const addThirdParty = (dependency: IThirdPartyDependency) => {
    const location = require.resolve(dependency.requireDir + dependency.file);
    IO.writeFileSync(dependency.targetDir + dependency.file, IO.readFileSync(location));
};

// copy tempalte
IO.mkdirsSync(resultDir);
IO.copyFileSync("web/template.html", resultDir + "template.html");

// create our css
const cssDir = resultDir + Constants.CSS_DIR;
IO.mkdirsSync(cssDir);
IO.writeFileSync(cssDir + Constants.JEST_STARE_CSS, obtainWebFile(Constants.JEST_STARE_CSS));

// create our js
const jsDir = resultDir + Constants.JS_DIR;
IO.mkdirsSync(jsDir);
IO.writeFileSync(jsDir + Constants.JEST_STARE_JS, obtainJsRenderFile(Constants.JEST_STARE_JS));

// add third party dependencies
Dependencies.THIRD_PARTY_DEPENDENCIES.forEach((dependency) => {
    const updatedDependency = Object.assign({}, ...[dependency]);
    updatedDependency.targetDir = resultDir + dependency.targetDir;
    addThirdParty(updatedDependency);
});

const bundler = new ParcelBundler(resultDir + "template.html",
{
    watch: false,
    publicUrl: ".",
    outDir: "web/dist",
    minify: true,
});
plugin(bundler);
bundler.bundle().then((result) => {
    try {
        IO.copyFileSync("web/dist/template.html", "web/templateInlineSource.html");
        IO.deleteFolderSync("web/dist");
        IO.deleteFolderSync("web/temp");
    } catch (error) {
        // tslint:disable-next-line:no-console
        console.log("error while parce bundle", error);
        throw error;
    }
}).catch((error) => {
    // tslint:disable-next-line:no-console
    console.log("error while parce bundle", error);
    throw error;
});
