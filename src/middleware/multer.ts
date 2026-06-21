import multer from "multer";
import multerS3 from "multer-s3";
import { b2Client } from "../utilities/s3/bucket.js";
import { kDefaultBucketName } from "../constants/strings.js";
import { nanoid } from "nanoid";

type StorageFolder = "images" | "documents" | "videos" | "uploads";

const s3Storage = (folder: StorageFolder = "uploads") =>
    multerS3({
        s3: b2Client,
        bucket: kDefaultBucketName,
        contentType: multerS3.AUTO_CONTENT_TYPE,
        metadata: function (req, file, cb) {
            cb(null, { fieldName: file.fieldname });
        },
        key: function (req, file, cb) {
            const ext = file.originalname.split(".").pop();
            const uniqueS3Key = `${folder}/${Date.now()}-${nanoid()}-${ext}`;
            cb(null, uniqueS3Key);
        },
    });

export const multerB2Upload = (folder: string = "uploads") =>
    multer({ storage: s3Storage() });
