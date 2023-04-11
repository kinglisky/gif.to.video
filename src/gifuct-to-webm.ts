import { parseGIF, decompressFrames } from 'gifuct-js';
import WebMWriter from 'webm-writer';
import { fetchArrayBuffer } from './utils';

async function gifToWebM(gifUrl: string) {
    // 加载GIF
    const gifBuffer = await fetchArrayBuffer(gifUrl);
    const gif = parseGIF(gifBuffer);
    const frames = decompressFrames(gif, true);

    console.log({ gif, frames });

    return new Promise<string>((resolve) => {
        const videoWriter = new WebMWriter({
            quality: 1, // WebM image quality from 0.0 (worst) to 0.99999 (best), 1.00 (VP8L lossless) is not supported
            fileWriter: null, // FileWriter in order to stream to a file instead of buffering to memory (optional)
            fd: null, // Node.js file handle to write to instead of buffering to memory (optional)

            // You must supply one of:
            frameDuration: frames[0].delay, // Duration of frames in milliseconds
            frameRate: 1000 / frames[0].delay, // Number of frames per second

            transparent: true, // True if an alpha channel should be included in the video
            alphaQuality: 1, // Allows you to set the quality level of the alpha channel separately.
            // If not specified this defaults to the same value as `quality`.
        });

        const canvas = document.createElement('canvas');
        canvas.width = frames[0].dims.width;
        canvas.height = frames[0].dims.height;

        for (let frame of frames) {
            const ctx = canvas.getContext('2d')!;
            ctx.clearRect(0, 0, canvas.width, canvas.height);
            const data = new ImageData(
                frame.patch,
                frame.dims.width,
                frame.dims.height
            );
            ctx.putImageData(data, frame.dims.left, frame.dims.top);
            videoWriter.addFrame(canvas);
        }

        videoWriter.complete().then((webMBlob: Blob) => {
            console.log('webMBlob', webMBlob);
            resolve(URL.createObjectURL(webMBlob));
        });
    });
}

export function setupParseGifToWebm(options: {
    gifURL: string;
    button: HTMLButtonElement;
    video: HTMLVideoElement;
    time: HTMLSpanElement;
}) {
    const startTranscode = async () => {
        options.time.innerText = '开始转码...';
        const startTime = new Date();

        const webMURL = await gifToWebM(options.gifURL);
        options.video.src = webMURL;
        const endTime = new Date();
        const duration = (endTime.getTime() - startTime.getTime()) / 1000;
        options.time.innerText = `转码完成，用时 ${duration}s`;
    };

    options.button.addEventListener('click', startTranscode, false);
}
