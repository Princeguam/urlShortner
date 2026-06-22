import cron from "node-cron";
import { startPostgresBackup } from "../utilities/index.js";

export function scheduledPostgresBackup() {
    cron.schedule("0 0 *  * 0 ", async () => {
        try {
            console.log("starting scheduled backup");
            await startPostgresBackup();
        } catch (err) {
            console.error(err);
            console.log("scheduled postgres backup failed");
        }
    });
}

export function schedulePostgresBackupDelete() {}
