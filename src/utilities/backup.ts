import { exec } from "node:child_process";
import { promisify } from "node:util";
import { uploadObject } from "./s3/object.js";
import path from "node:path";
import fs from "node:fs";
import {
    kDefaultBucketName,
    kDefaultFileContentType,
} from "../constants/strings.js";

const execAsync = promisify(exec);

const DBPASSWORD = process.env.DB_PASSWORD;
const DBUSER = process.env.DB_USER;
const DBNAME = process.env.DB_NAME;
const BACKUP_DIR = path.resolve(process.cwd(), "backup");

export async function startPostgresBackup() {
    let now = new Date().toISOString().replace(/[:.]/g, "-");
    let filename = `backup-${now}.sql`;
    let filepath = path.join(BACKUP_DIR, filename);

    if (!fs.existsSync(BACKUP_DIR)) {
        fs.mkdirSync(BACKUP_DIR, { recursive: true });
    }

    try {
        await pg_dumpFile(filepath);

        await uploadBackupToS3(filename, filepath);

        fs.unlinkSync(filepath);
    } catch (err) {
        if (fs.existsSync(filepath)) {
            fs.unlinkSync(filepath);
            console.log("cleaned partial backup");
        }
        console.log("backup failed");
        console.error(err);
    }
}

export async function deletePostgresBackup() {
    let now = new Date();
}

async function pg_dumpFile(filepath: string) {
    let pg_dump_command = `PGPASSWORD=${DBPASSWORD} pg_dump -h db -U ${DBUSER} -d ${DBNAME} -F p -f ${filepath}`;

    console.log("Database backup dumping started");

    await execAsync(pg_dump_command);
    console.log("Database backup dumping complete");
}

async function uploadBackupToS3(objectKey: string, filepath: string) {
    console.log(`uploading to container ${kDefaultBucketName}`);

    let fileStream = fs.createReadStream(filepath);
    let fileSize = fs.statSync(filepath).size;

    await uploadObject({
        bucketName: kDefaultBucketName,
        objectKey: objectKey,
        body: fileStream,
        contentType: kDefaultFileContentType,
    });

    console.log(`upload to container ${kDefaultBucketName} complete`);
}
