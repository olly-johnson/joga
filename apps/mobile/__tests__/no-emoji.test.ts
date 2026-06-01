import { readdirSync, readFileSync, statSync } from "fs";
import { join } from "path";

/**
 * Guard rail for the professional-tone redesign: no emoji and no em/en dashes
 * in shipped screen or component source. Apostrophes and middots are allowed.
 */
const ROOTS = [join(__dirname, "..", "app"), join(__dirname, "..", "components")];
const EMOJI = /\p{Extended_Pictographic}/u;
const EM_OR_EN_DASH = /[—–]/;

function sourceFiles(dir: string): string[] {
  const out: string[] = [];
  for (const entry of readdirSync(dir)) {
    const full = join(dir, entry);
    if (statSync(full).isDirectory()) {
      out.push(...sourceFiles(full));
    } else if (/\.(ts|tsx)$/.test(entry)) {
      out.push(full);
    }
  }
  return out;
}

describe("professional tone", () => {
  const files = ROOTS.flatMap(sourceFiles);

  it("scans a non-trivial number of source files", () => {
    expect(files.length).toBeGreaterThan(10);
  });

  it.each(files)("%s contains no emoji or em/en dashes", (file) => {
    const content = readFileSync(file, "utf8");
    expect(EMOJI.test(content)).toBe(false);
    expect(EM_OR_EN_DASH.test(content)).toBe(false);
  });
});
