import { Command } from "commander";
export declare const MIN_MAINTAINERS = 3;
export declare const MIN_COMPANIES = 2;
export interface MaintainerRow {
    name: string;
    githubId: string;
    company: string;
}
export type ParseResult = {
    ok: true;
    rows: MaintainerRow[];
} | {
    ok: false;
    error: string;
};
export declare function parseMaintainers(markdown: string): ParseResult;
export interface MaintainersReport {
    eligible: boolean;
    people: number;
    companies: number;
    missingPeople: number;
    missingCompanies: number;
}
export declare function evaluateMaintainers(rows: MaintainerRow[]): MaintainersReport;
export declare function runMaintainersCheck(file: string): {
    exitCode: number;
    output: string;
};
export declare const maintainersCommand: Command;
