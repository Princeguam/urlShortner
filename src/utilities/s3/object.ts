import { kDefaultBucketName } from "../../constants/strings.js";
import { b2Client, checkBucketExist, createBucket } from "./bucket.js";
import {
    PutObjectCommand,
    GetObjectCommand,
    DeleteObjectCommand,
} from "@aws-sdk/client-s3";
import { nanoid } from "nanoid";

function generateFileLink(fileName: string, bucketName: string) {
    return `https://s3.eu-central-003.backblazeb2.com/${kDefaultBucketName}/${fileName}/${nanoid(10)}`;
}

interface ObjectType {
    bucketName: string;
    objectKey: string;
    /**
     * For the Object Key, it follows a folder structre, so add a preceeding folder key before file name
     */
    contentType: string | undefined;
    body: any;
}

export async function getObject(input: ObjectType) {
    try {
        let { Body } = await b2Client.send(
            new GetObjectCommand({
                Bucket: input.bucketName,
                Key: input.objectKey,
            }),
        );

        return await Body?.transformToString(); // here there can be a couple of ways to work with the readable stream
    } catch (err) {
        console.error(err);
    }
}

export async function uploadObject(input: ObjectType) {
    let command = new PutObjectCommand({
        Bucket: input.bucketName,
        Key: input.objectKey,
        Body: input.body,
        ContentType: input.contentType,
    });
    try {
        await b2Client.send(command);
    } catch (err) {
        console.error(`Error Uploading to ${input.bucketName}`, err);
        throw new Error(`Error Uploading to ${input.bucketName}`);
    }
}

export async function deleteObject(input: ObjectType) {
    let command = new DeleteObjectCommand({
        Bucket: input.bucketName,
        Key: input.objectKey,
    });
    try {
        await b2Client.send(command);
    } catch (err) {
        console.error(`Error Deleting ${input.objectKey} `, err);
        throw new Error(`Error deleting ${input.objectKey}`);
    }
}
