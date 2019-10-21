import { isNullOrUndefined } from "util";
import { IJestStareConfig } from "../processor/doc/IJestStareConfig";
import { Logger } from "../utils/Logger";
import { Constants } from "../processor/Constants";
import { IO } from "../utils/IO";
import { Processor } from "../processor/Processor";
import * as yargs from "yargs";

/**
 * Handle CLI execution
 * @export
 * @class CLI
 */
export class CLI {
    /**
     * Read args and invoke processor
     * @static
     * @param {string[]} args - array separated arguments
     * @memberof CLI
     */
    public static run(argv: string[]) {
        const args = yargs
            .usage("$0 <testResults> [resultDir]", "jest-stare CLI", (y) =>
                y
                    .positional("testResults", { type: "string" })
                    .positional("resultDir", { type: "string" })
            )
            .options({
                coverageLink: {
                    type: "string",
                    description:
                        "Link to coverage report for convenient referencing in top left of HTML report"
                }
            })
            .strict()
            .parse(argv);

        const config: IJestStareConfig = {};

        if (isNullOrUndefined(args._[0])) {
            Logger.get.error(Constants.NO_CLI_INPUT);
            throw new Error();
        }

        if (!isNullOrUndefined(args._[1])) {
            config.resultDir = args._[1] as string;
        }

        if (!isNullOrUndefined(args.coverageLink)) {
            config.coverageLink = args.coverageLink;
        }

        const results = IO.readFileSync(args._[0] as string);
        Processor.run(JSON.parse(results), config);
    }
}
