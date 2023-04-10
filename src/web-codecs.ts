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
        // 创建WebM编码器
        const init = {
            codec: 'vp8',
            width: frames[0].dims.width,
            height: frames[0].dims.height,
            bitrate: 12000000, // 调整比特率以改变输出质量
            framerate: 1000 / frames[0].delay,
        };

        // const chunks: BlobPart[] = []; // 存储编码后的数据块

        // const encoder = new VideoEncoder({
        //     output: async (chunk: BlobPart) => {
        //         const frameData = new Uint8Array(chunk.byteLength);
        //         chunk.copyTo(frameData);
        //         console.log('chunk', chunk, frameData);

        //         // 处理编码后的数据块
        //         chunks.push(
        //             new Blob([frameData], { type: 'application/octet-stream' })
        //         );

        //         if (chunks.length === frames.length) {
        //             // 完成编码
        //             await encoder.flush();
        //             await encoder.close();

        //             // 将编码后的数据块转换为Blob URL
        //             const blob = new Blob(chunks, { type: 'video/webm' });
        //             const url = URL.createObjectURL(blob);
        //             console.log('VideoEncoder blob', blob);
        //             resolve(url);
        //         }
        //     },
        //     error: (e: any) => {
        //         console.error('error', e);
        //     },
        // });

        // encoder.configure(init);

        // 将GIF帧添加到WebM编码器

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

        // let timestamp = 0;
        for (let frame of frames) {
            const canvas = document.createElement('canvas');
            canvas.width = frame.dims.width;
            canvas.height = frame.dims.height;

            const ctx = canvas.getContext('2d')!;
            const data = new ImageData(
                frame.patch,
                frame.dims.width,
                frame.dims.height
            );
            ctx.putImageData(data, frame.dims.left, frame.dims.top);
            videoWriter.addFrame(canvas);
            // const imageBitmap = await createImageBitmap(canvas);
            // const duration = frame.delay * 1000; // 帧延迟（微秒）
            // const vf = new VideoFrame(canvas, { timestamp, duration });
            // encoder.encode(vf);
            // vf.close();
            // timestamp += frame.delay;
        }

        videoWriter.complete().then((webMBlob: Blob) => {
            console.log('webMBlob', webMBlob);
            resolve(URL.createObjectURL(webMBlob));
        });
    });
}

export function setupWebCodecsTranscode(options: {
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
        options.video.controls = true;
        const endTime = new Date();
        const duration = (endTime.getTime() - startTime.getTime()) / 1000;
        options.time.innerText = `转码完成，用时 ${duration}s`;
    };

    options.button.addEventListener('click', startTranscode, false);
}
