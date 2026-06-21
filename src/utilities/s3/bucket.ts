import {
    S3Client,
    CreateBucketCommand,
    HeadBucketCommand,
    DeleteBucketCommand,
    paginateListObjectsV2,
    DeleteObjectCommand,
} from "@aws-sdk/client-s3";

const ENDPOINT = process.env.BACKBLAZE_ENDPOINT ?? "";
const REGION = process.env.BACKBLAZE_REGION ?? "";
const KEYID = process.env.BACKBLAZE_S3_APP_KEY_ID ?? "";
const ACCESSKEY = process.env.BACKBLAZE_S3_APP_KEY ?? "";

export const b2Client = new S3Client({
    endpoint: ENDPOINT,
    region: REGION,
    credentials: {
        accessKeyId: KEYID,
        secretAccessKey: ACCESSKEY,
    },
});

export async function checkBucketExist(bucketName: string) {
    try {
        await b2Client.send(new HeadBucketCommand({ Bucket: bucketName }));
        return true;
    } catch {
        return false;
    }
}

export async function createBucket(bucketName: string) {
    try {
        let output = await b2Client.send(
            new CreateBucketCommand({ Bucket: bucketName }),
        );
        return output;
    } catch (err) {
        console.error(err);
        return err;
    }
}

export async function deleteBucket(bucketName: string) {
    try {
        let paginator = paginateListObjectsV2(
            { client: b2Client },
            { Bucket: bucketName },
        );
        for await (const page of paginator) {
            const allObjects = page.Contents;

            if (allObjects) {
                for (const object of allObjects) {
                    let i = 0;
                    await b2Client.send(
                        new DeleteObjectCommand({
                            Bucket: bucketName,
                            Key: object.Key,
                        }),
                    );
                    i++;
                    console.log(`Deleted ${i} objects`);
                }
            }
        }

        await b2Client.send(new DeleteBucketCommand({ Bucket: bucketName }));
    } catch (err) {
        console.error(`Error deleting bucket ${bucketName}`, err);
    }
}
