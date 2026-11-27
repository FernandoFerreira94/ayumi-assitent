/** Regera subtitles.en.srt (referência versionada, com as durações estimadas de captions.ts). */
import { writeFileSync } from "node:fs";
import { join } from "node:path";
import { referenceCues, toSrt } from "./captions";

writeFileSync(join(import.meta.dirname, "subtitles.en.srt"), toSrt(referenceCues()));
