import { promises as fs } from "node:fs";
import { fileURLToPath } from "node:url";
import path from "node:path";
import {
  GeneratedFiles,
  GeneratorAnswers,
  MountVersion,
  deriveConfig,
} from "@onstep/shared";

// Resolves to src/generator/templates in dev (tsx) and dist/generator/templates
// in prod (the build copies the templates alongside the compiled output).
const templatesDir = fileURLToPath(new URL("./templates/", import.meta.url));

async function loadTemplate(version: MountVersion, name: string): Promise<string> {
  return fs.readFile(path.join(templatesDir, version, name), "utf8");
}

/** Python string.Template semantics: $name, ${name}, and $$ -> $. */
export function substitute(tpl: string, vars: Record<string, string>): string {
  return tpl.replace(
    /\$(?:(\$)|\{([A-Za-z_][A-Za-z0-9_]*)\}|([A-Za-z_][A-Za-z0-9_]*))/g,
    (_m, dollar, braced, bare) => {
      if (dollar) return "$";
      const key = (braced ?? bare) as string;
      if (!(key in vars)) throw new Error(`template placeholder $${key} has no value`);
      return vars[key];
    }
  );
}

export async function generateConfigs(answers: GeneratorAnswers): Promise<GeneratedFiles> {
  const config = deriveConfig(answers);
  const version = answers.version;
  const [onstepx, onstepxExtended, plugins, swsConfig, swsExtended] = await Promise.all([
    loadTemplate(version, "onstepx.h"),
    loadTemplate(version, "onstepx-extended.h"),
    loadTemplate(version, "plugins.h"), // static: enables the website plugin
    loadTemplate(version, "sws.h"),
    loadTemplate(version, "sws-extended.h"),
  ]);
  return {
    onstepx: {
      "Config.h": substitute(onstepx, config),
      "Extended.config.h": substitute(onstepxExtended, config),
      "Plugins.config.h": plugins,
    },
    sws: {
      "Config.h": substitute(swsConfig, config),
      "Extended.config.h": substitute(swsExtended, config),
    },
  };
}
