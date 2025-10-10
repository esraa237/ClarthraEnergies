export const FILE_CONSTANTS = {
    UPLOAD_DIR: process.env.UPLOAD_DIR || 'uploads',

    MAX_SIZES: {
        image: parseInt(process.env.MAX_IMAGE_SIZE || '5242880', 10),
        video: parseInt(process.env.MAX_VIDEO_SIZE || '20971520', 10),
        file: parseInt(process.env.MAX_FILE_SIZE || '10485760', 10),
    },

    MESSAGES: {
        NO_FILE: 'No file provided',
        INVALID_TYPE: {
            image: 'Invalid image file. Only images are allowed.',
            video: 'Invalid video file. Only videos are allowed.',
            file: 'Invalid file type.',
        },
        INVALID_EXTENSION: (extList: string[]) =>
            `Invalid file extension. Allowed: ${extList.join(', ')}`,
        TOO_LARGE: (maxMB: number) => `File too large. Max allowed size is ${maxMB} MB.`,
    },
};

export enum FileType {
    IMAGE = 'image',
    VIDEO = 'video',
    FILE = 'file',
}